// Atualizacao diaria - so novos + saidos - leilaodefazenda
// Rode: node atualiza-diario.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const BASE = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
const base = JSON.parse(readFileSync('lotes_total_final.json','utf8'));
const idsBase = new Set(base.lotes.map(l=>String(l.id)));
console.log(`base: ${idsBase.size}`);
async function fetchHtml(url){
  const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
  const t = await r.text();
  return { status: r.status, html: t };
}
function parseList(html, map){
  const re = new RegExp('\\{\\s*item_id:\\s*"([0-9]+)"[\\s\\S]*?item_name:\\s*"([^"]+)"[\\s\\S]*?discount:\\s*([0-9.]+)[\\s\\S]*?item_brand:\\s*"([^"]*)"[\\s\\S]*?item_variant:\\s*"([^"]*)"[\\s\\S]*?price:\\s*([0-9.]+)','g');
  let m; while((m=re.exec(html))!==null){ if(!map.has(m[1])) map.set(m[1],{id:m[1],nome:m[2],desconto:m[3],brand:m[4],tipo:m[5],preco:m[6],path:'',data_leilao:''}); }
  const rl = new RegExp('href="(/imovel/[^"]+--([0-9]+))"','g');
  while((m=rl.exec(html))!==null){ const e=map.get(m[2]); if(e && !e.path) e.path=m[1]; else if(!e) map.set(m[2],{id:m[2],nome:'',desconto:'',brand:'',tipo:'',preco:'',path:m[1],data_leilao:''}); }
  const rd = new RegExp('item_id:\\s*"([0-9]+)"[\\s\\S]{0,600}?item_category4:\\s*"([^"]+)"','g');
  while((m=rd.exec(html))!==null){ const e=map.get(m[1]); if(e) e.data_leilao=m[2]; }
}
// 1. paginas 1-3 novos
const recentes = new Map();
for(let p=1;p<=3;p++){
  const url = p===1?BASE:BASE+'&pag='+p;
  console.log(`fetch recentes ${p}/3`);
  const {html} = await fetchHtml(url);
  parseList(html, recentes);
  await new Promise(r=>setTimeout(r,600));
}
const novos = [...recentes.values()].filter(l=>!idsBase.has(String(l.id)));
console.log(`novos: ${novos.length}`);
for(const n of novos) console.log(` + ${n.id} | ${n.nome} | ${n.path}`);
// 2. saidos: testa 20 mais antigos da base (tail) + 10 aleatorios
const arrBase = base.lotes;
const amostra = [...arrBase.slice(-20), ...arrBase.filter((_,i)=>i%193===0).slice(0,10)];
console.log(`testando saidas em amostra de ${amostra.length}`);
const saidos = [];
for(const l of amostra){
  if(!l.path) continue;
  const url = `https://www.leilaodefazenda.com.br${l.path}`;
  try{
    const {status, html} = await fetchHtml(url);
    if(status===404 || /EXCLUIDO|imovel nao encontrado|nao disponivel/i.test(html.slice(0,20000))){
      saidos.push(l);
      console.log(` - saiu ${l.id}`);
    }
  }catch(e){ console.log(` erro check ${l.id}: ${e.message}`); }
  await new Promise(r=>setTimeout(r,400));
}
console.log(`saidos na amostra: ${saidos.length}`);
// 3. atualiza base
const idsSaid = new Set(saidos.map(l=>String(l.id)));
const novaBase = [...novos.map(n=>({...n})), ...arrBase.filter(l=>!idsSaid.has(String(l.id)))];
novaBase.sort((a,b)=>Number(b.id)-Number(a.id));
const hoje = new Date().toISOString().slice(0,10);
writeFileSync('lotes_total_final.json', JSON.stringify({total:novaBase.length,data:new Date().toISOString(),lotes:novaBase},null,2),'utf8');
writeFileSync(`atualizacao-${hoje}.json`, JSON.stringify({data:hoje,novos,saidos:saidos.map(s=>s.id),total:novaBase.length},null,2),'utf8');
// 4. rebuild md rapido
function brl(v){ if(!v) return 'N/A'; return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function cidadeUF(path,nome){ const m=(path||'').match(/^\/imovel\/([a-z]{2})\/([^\/]+)\//); if(m) return `${m[2].split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}/${m[1].toUpperCase()}`; const m2=(nome||'').match(/em (.+)$/); return m2?m2[1]:'N/A'; }
const linhas=novaBase.map(l=>`| ${l.id} | ${l.nome||'N/A'} | https://www.leilaodefazenda.com.br${l.path} | ${cidadeUF(l.path,l.nome)} | N/A | ${brl(l.preco)} | N/A | N/A | N/A | ${l.desconto?l.desconto+'%':'N/A'} | ${l.brand||'N/A'} | ${l.tipo||'N/A'} | ${l.data_leilao||'N/A'} | N/A | ativo |`);
let mdOld = readFileSync('lotes_fazenda_completo.md','utf8');
const logNovo = `### Atualização [${hoje}] - MODO DIARIO\n- +entradas: ${novos.length}\n${novos.map(n=>`  - ${n.id} | ${n.nome} | https://www.leilaodefazenda.com.br${n.path}`).join('\n')||'  - nenhuma'}\n- -saidas (amostra verificada): ${saidos.length}\n${saidos.map(s=>`  - ${s.id} | ${s.nome}`).join('\n')||'  - nenhuma'}\n- total_atual: ${novaBase.length}\n\n`;
let md;
if(mdOld.includes('## Log de Atualizações - FASE 2')){
  const parts = mdOld.split('## Log de Atualizações - FASE 2');
  const header = parts[0].replace(/- total_mapeado: \d+/, `- total_mapeado: ${novaBase.length}`).replace(/- data_execucao: .+/, `- data_execucao: ${hoje}`).replace(/percentual_concluido: .+/, `percentual_concluido: ${(novaBase.length/1932*100).toFixed(1)}%`);
  // reconstroi tabela completa para manter 100% fiel
  const tabStart = header.indexOf('## Tabela de Lotes');
  const beforeTab = header.slice(0, tabStart);
  md = `${beforeTab}## Tabela de Lotes\n| id | titulo | url_completa | cidade_UF | endereco | preco_1a_praca | data_1a_praca | preco_2a_praca | data_2a_praca | desconto_pct | modalidade | tipo_imovel | data_encerramento | data_inclusao | status |\n|----|--------|--------------|-----------|----------|----------------|---------------|----------------|---------------|--------------|------------|-------------|-------------------|-----------------|--------|\n${linhas.join('\n')}\n\n## CHECKPOINT\n\`\`\`\nproxima_execucao: MODO ATUALIZAÇÃO - varrer paginas 1-3 dt_insert_d e comparar IDs\ntotal_ids: ${novaBase.length}\n\`\`\`\n\n## Log de Atualizações - FASE 2\n${logNovo}${parts[1]}`;
} else {
  md = mdOld;
}
writeFileSync('lotes_fazenda_completo.md', md, 'utf8');
console.log(`OK total agora ${novaBase.length}. Log em atualizacao-${hoje}.json`);
