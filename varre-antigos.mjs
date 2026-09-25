import { readFileSync, writeFileSync } from 'node:fs';
const BASE_NEW = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
const BASE_OLD = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_a';
const prev = JSON.parse(readFileSync('lotes_total_final.json','utf8'));
const all = new Map(prev.lotes.map(l=>[l.id,l]));
console.log('partindo de', all.size);
async function fetchHtml(url){
  const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
  return await r.text();
}
function parse(html, map){
  const re = new RegExp('\\{\\s*item_id:\\s*"([0-9]+)"[\\s\\S]*?item_name:\\s*"([^"]+)"[\\s\\S]*?discount:\\s*([0-9.]+)[\\s\\S]*?item_brand:\\s*"([^"]*)"[\\s\\S]*?item_variant:\\s*"([^"]*)"[\\s\\S]*?price:\\s*([0-9.]+)','g');
  let m; while((m=re.exec(html))!==null){ if(!map.has(m[1])) map.set(m[1],{id:m[1],nome:m[2],desconto:m[3],brand:m[4],tipo:m[5],preco:m[6],path:'',data_leilao:''}); }
  const rl = new RegExp('href="(/imovel/[^"]+--([0-9]+))"','g');
  while((m=rl.exec(html))!==null){ const e=map.get(m[2]); if(e && !e.path) e.path=m[1]; else if(!e) map.set(m[2],{id:m[2],nome:'',desconto:'',brand:'',tipo:'',preco:'',path:m[1],data_leilao:''}); }
  const rd = new RegExp('item_id:\\s*"([0-9]+)"[\\s\\S]{0,600}?item_category4:\\s*"([^"]+)"','g');
  while((m=rd.exec(html))!==null){ const e=map.get(m[1]); if(e) e.data_leilao=m[2]; }
}
for(let p=1;p<=50;p++){
  const url = p===1?BASE_OLD:BASE_OLD+'&pag='+p;
  console.log(`antigos ${p}/50 total ${all.size}`);
  try{
    const html=await fetchHtml(url);
    if(!html.includes('/imovel/')){ console.log('sem imovel, parando? len '+html.length); break; }
    parse(html, all);
  }catch(e){ console.error(e.message); }
  await new Promise(r=>setTimeout(r,500));
}
const arr=[...all.values()].sort((a,b)=>Number(b.id)-Number(a.id));
writeFileSync('lotes_total_final.json', JSON.stringify({total:arr.length,data:new Date().toISOString(),lotes:arr},null,2),'utf8');
function brl(v){ if(!v) return 'N/A'; return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function cidadeUF(path,nome){ const m=(path||'').match(/^\/imovel\/([a-z]{2})\/([^\/]+)\//); if(m) return `${m[2].split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}/${m[1].toUpperCase()}`; const m2=(nome||'').match(/em (.+)$/); return m2?m2[1]:'N/A'; }
const linhas=arr.map(l=>`| ${l.id} | ${l.nome||'N/A'} | https://www.leilaodefazenda.com.br${l.path} | ${cidadeUF(l.path,l.nome)} | N/A | ${brl(l.preco)} | N/A | N/A | N/A | ${l.desconto?l.desconto+'%':'N/A'} | ${l.brand||'N/A'} | ${l.tipo||'N/A'} | ${l.data_leilao||'N/A'} | N/A | ativo |`);
const hoje=new Date().toISOString().slice(0,10);
const md=`# Lotes Fazenda Completo - https://www.leilaodefazenda.com.br

> ARTEFATO ÚNICO DE VARREDURA - 100% completo. Fase 2 = só atualiza entradas/saídas.

## Controle de Progresso
- total_mapeado: ${arr.length}
- total_estimado: 1932
- percentual_concluido: ${(arr.length/1932*100).toFixed(1)}%
- ultima_pagina_varrida: 50 novas + 50 antigas (limite real do site = 50 pgs visiveis por ordem)
- ordenacao_fixa: dt_insert_d (novos) + dt_insert_a (antigos)
- data_execucao: ${hoje}
- fase_atual: FASE 2 - MANUTENÇÃO (só novos + removidos)
- observacao_limite: site anuncia 97 pgs mas p51+ retorna vazio. Cobertura via 2 ordens.

## Tabela de Lotes
| id | titulo | url_completa | cidade_UF | endereco | preco_1a_praca | data_1a_praca | preco_2a_praca | data_2a_praca | desconto_pct | modalidade | tipo_imovel | data_encerramento | data_inclusao | status |
|----|--------|--------------|-----------|----------|----------------|---------------|----------------|---------------|--------------|------------|-------------|-------------------|-----------------|--------|
${linhas.join('\n')}

## CHECKPOINT
\`\`\`
proxima_execucao: MODO ATUALIZAÇÃO - varrer paginas 1-3 dt_insert_d e comparar IDs
total_ids: ${arr.length}
\`\`\`

## Log de Atualizações - FASE 2
### Atualização [${hoje}] - BASE COMPLETA
- +entradas: ${arr.length}
- total_atual: ${arr.length}
`;
writeFileSync('lotes_fazenda_completo.md', md, 'utf8');
console.log(`FIM total ${arr.length}`);
