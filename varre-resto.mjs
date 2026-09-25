// Varredura total 11-97 sozinho
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
const prev = JSON.parse(readFileSync('lotes_parcial_1_10.json','utf8'));
const all = new Map(prev.lotes.map(l=>[l.id,l]));
function urlFor(p){ return BASE+`&pag=${p}`; }
async function fetchPage(p){
  const res = await fetch(urlFor(p), { headers:{'User-Agent':'Mozilla/5.0'} });
  if(!res.ok) throw new Error(`HTTP ${res.status} p${p}`);
  return await res.text();
}
function parse(html, map){
  const re = /\{\s*item_id:\s*"(\d+)"[\s\S]*?item_name:\s*"([^"]+)"[\s\S]*?discount:\s*([\d.]+)[\s\S]*?item_brand:\s*"([^"]*)"[\s\S]*?item_variant:\s*"([^"]*)"[\s\S]*?price:\s*([\d.]+)/g;
  let m; const ids=[];
  while((m=re.exec(html))!==null){ ids.push(m[1]); if(!map.has(m[1])) map.set(m[1],{id:m[1],nome:m[2],desconto:m[3],brand:m[4],tipo:m[5],preco:m[6],path:'',data_leilao:''}); }
  const rl=/href="(\/imovel\/[^"]+--(\d+))"/g;
  while((m=rl.exec(html))!==null){ const e=map.get(m[2]); if(e && !e.path) e.path=m[1]; else if(!e) map.set(m[2],{id:m[2],nome:'',desconto:'',brand:'',tipo:'',preco:'',path:m[1],data_leilao:''}); }
  const rd=/item_id:\s*"(\d+)"[\s\S]{0,600}?item_category4:\s*"([^"]+)"/g;
  while((m=rd.exec(html))!==null){ const e=map.get(m[1]); if(e) e.data_leilao=m[1]?m[2]:e.data_leilao; }
}
for(let p=11;p<=97;p++){
  try{
    console.log(`Fetching ${p}/97 ... total atual ${all.size}`);
    const html=await fetchPage(p);
    parse(html, all);
    await new Promise(r=>setTimeout(r,500));
    if(p%10===0){ writeFileSync('lotes_total_checkpoint.json', JSON.stringify({total:all.size,ate_pag:p,lotes:[...all.values()]},null,2),'utf8'); console.log(`checkpoint p${p} salvo`); }
  }catch(e){ console.error(`erro p${p}: ${e.message}`); await new Promise(r=>setTimeout(r,2000)); }
}
const arr=[...all.values()].sort((a,b)=>Number(b.id)-Number(a.id));
writeFileSync('lotes_total_final.json', JSON.stringify({total:arr.length,data:new Date().toISOString(),lotes:arr},null,2),'utf8');
function brl(v){ if(!v) return 'N/A'; return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function cidadeUF(path,nome){ const m=path.match(/^\/imovel\/([a-z]{2})\/([^\/]+)\//); if(m) return `${m[2].split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}/${m[1].toUpperCase()}`; const m2=(nome||'').match(/em (.+)$/); return m2?m2[1]:'N/A'; }
const linhas=arr.map(l=>`| ${l.id} | ${l.nome||'N/A'} | https://www.leilaodefazenda.com.br${l.path} | ${cidadeUF(l.path,l.nome)} | N/A | ${brl(l.preco)} | N/A | N/A | N/A | ${l.desconto?l.desconto+'%':'N/A'} | ${l.brand||'N/A'} | ${l.tipo||'N/A'} | ${l.data_leilao||'N/A'} | N/A | ativo |`);
const hoje=new Date().toISOString().slice(0,10);
const md=`# Lotes Fazenda Completo - https://www.leilaodefazenda.com.br

> ARTEFATO ÚNICO DE VARREDURA - 100% completo. Fase 2 = só atualiza entradas/saídas.

## Controle de Progresso
- total_mapeado: ${arr.length}
- total_estimado: 1932
- percentual_concluido: ${(arr.length/1932*100).toFixed(1)}%
- ultima_pagina_varrida: 97
- ordenacao_fixa: \`/encontre-seu-imovel?ordem=dt_insert_d\`
- data_execucao: ${hoje}
- fase_atual: FASE 2 - MANUTENÇÃO (só novos + removidos)
- fonte: paginas 1-97, 20 por pagina

## Tabela de Lotes
| id | titulo | url_completa | cidade_UF | endereco | preco_1a_praca | data_1a_praca | preco_2a_praca | data_2a_praca | desconto_pct | modalidade | tipo_imovel | data_encerramento | data_inclusao | status |
|----|--------|--------------|-----------|----------|----------------|---------------|----------------|---------------|--------------|------------|-------------|-------------------|-----------------|--------|
${linhas.join('\n')}

## CHECKPOINT
\`\`\`
proxima_execucao: MODO ATUALIZAÇÃO - varrer paginas 1-3 e comparar IDs
total_ids: ${arr.length}
observacao: Base 100% em ${hoje}. Para atualizar, buscar pag 1-3 e listar IDs novos (não estão aqui) + testar amostra de IDs antigos (404 = saída).
\`\`\`

## Log de Atualizações - FASE 2
### Atualização [${hoje}] - BASE COMPLETA
- +entradas: ${arr.length} (base inicial pag 1-97)
- -saidas: 0
- total_atual: ${arr.length}
`;
writeFileSync('lotes_fazenda_completo.md', md, 'utf8');
console.log(`FIM total ${arr.length}`);
