// Versão expandida: coleta dados + area + 2a praca
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BASE = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
const base = JSON.parse(readFileSync('lotes_total_final.json','utf8'));
const idsBase = new Set(base.lotes.map(l=>String(l.id)));

async function fetchHtml(url){
  const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
  const t = await r.text();
  return { status: r.status, html: t };
}

function parseList(html, map){
  const re = new RegExp('\\{\\s*item_id:\\s*"([0-9]+)"[\\s\\S]*?item_name:\\s*"([^"]+)"[\\s\\S]*?discount:\\s*([0-9.]+)[\\s\\S]*?item_brand:\\s*"([^"]*)"[\\s\\S]*?item_variant:\\s*"([^"]*)"[\\s\\S]*?price:\\s*([0-9.]+)','g');
  let m; while((m=re.exec(html))!==null){ if(!map.has(m[1])) map.set(m[1],{id:m[1],nome:m[2],desconto:m[3],brand:m[4],tipo:m[5],preco:m[6],preco_2a:'',data_leilao:'',data_2a:'',area:'',path:'',link_url:''}); }
  const rl = new RegExp('href="(/imovel/[^"]+--([0-9]+))"','g');
  while((m=rl.exec(html))!==null){ const e=map.get(m[2]); if(e && !e.path) { e.path=m[1]; e.link_url='https://www.leilaodefazenda.com.br'+m[1]; } }
  const rd = new RegExp('item_id:\\s*"([0-9]+)"[\\s\\S]{0,600}?item_category4:\\s*"([^"]+)"','g');
  while((m=rd.exec(html))!==null){ const e=map.get(m[1]); if(e) e.data_leilao=m[2]; }
}

// Extrai dados detalhados de um lote individual
async function fetchLoteDetails(path) {
  try {
    const url = `https://www.leilaodefazenda.com.br${path}`;
    const {html} = await fetchHtml(url);

    const result = { area: '', data_2a: '', preco_2a: '' };

    // Tenta extrair área (em hectares ou m²)
    const areaMatch = html.match(/(?:Área|área)[^\d]*?([0-9.,]+)\s*(?:ha|hectares|m²)/i);
    if (areaMatch) result.area = areaMatch[1];

    // Tenta extrair 2ª praça
    const data2Match = html.match(/(?:2[ªa]\s*praça|segunda\s*praça|segunda\s*realização)[^\d]*?(\d{1,2}\/\d{1,2}\/\d{4}[^\d]*\d{1,2}:\d{2})/i);
    if (data2Match) result.data_2a = data2Match[1];

    // Tenta extrair preço 2ª praça
    const preco2Match = html.match(/(?:2[ªa]\s*praça|segunda\s*praça)[^\d]*?R\$\s*([0-9.,]+)/i);
    if (preco2Match) result.preco_2a = preco2Match[1];

    return result;
  } catch (e) {
    return { area: '', data_2a: '', preco_2a: '' };
  }
}

console.log(`base: ${idsBase.size}`);

// 1. Paginas 1-3 novos
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

// Busca detalhes dos novos (limita a 5 para não sobrecarregar)
for(const n of novos.slice(0, 5)) {
  const details = await fetchLoteDetails(n.path);
  Object.assign(n, details);
  await new Promise(r=>setTimeout(r,400));
}

// 2. Saidos
const arrBase = base.lotes;
const amostra = [...arrBase.slice(-20), ...arrBase.filter((_,i)=>i%193===0).slice(0,10)];
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

// 3. Atualiza base
const idsSaid = new Set(saidos.map(l=>String(l.id)));
const novaBase = [...novos.map(n=>({...n})), ...arrBase.filter(l=>!idsSaid.has(String(l.id)))];
novaBase.sort((a,b)=>new Date(b.data_leilao||0)-new Date(a.data_leilao||0));

const hoje = new Date().toISOString().slice(0,10);
writeFileSync('lotes_total_final.json', JSON.stringify({total:novaBase.length,data:new Date().toISOString(),lotes:novaBase},null,2),'utf8');

console.log(`OK total agora ${novaBase.length}. Ordenado por data_leilao DESC.`);
