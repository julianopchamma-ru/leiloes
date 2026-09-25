// Varredura autonoma 10% - leilaodefazenda - paginas 1..10
// Rode: node varre-10porcento.mjs
const BASE = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
function urlFor(p) { return p === 1 ? BASE : BASE + `&pag=${p}`; }
async function fetchPage(p) {
  const url = urlFor(p);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} pag ${p}`);
  return await res.text();
}
function parseItems(html) {
  const items = [];
  const re = /\{\s*item_id:\s*"(\d+)"[\s\S]*?item_name:\s*"([^"]+)"[\s\S]*?discount:\s*([\d.]+)[\s\S]*?item_brand:\s*"([^"]*)"[\s\S]*?item_variant:\s*"([^"]*)"[\s\S]*?price:\s*([\d.]+)/g;
  let m; while ((m = re.exec(html)) !== null) {
    items.push({ id: m[1], nome: m[2], desconto: m[3], brand: m[4], tipo: m[5], preco: m[6] });
  }
  return items;
}
function parseLinks(html) {
  const map = new Map();
  const re = /href="(\/imovel\/[^"]+--(\d+))"/g;
  let m; while ((m = re.exec(html)) !== null) {
    if (!map.has(m[2])) map.set(m[2], m[1]);
  }
  return map;
}
function parseDates(html) {
  const map = new Map();
  const re = /item_id:\s*"(\d+)"[\s\S]{0,600}?item_category4:\s*"([^"]+)"/g;
  let m; while ((m = re.exec(html)) !== null) { map.set(m[1], m[2]); }
  return map;
}
const all = new Map();
for (let p = 1; p <= 10; p++) {
  console.log(`Fetching pag ${p}/10 ...`);
  const html = await fetchPage(p);
  const items = parseItems(html);
  const links = parseLinks(html);
  const dates = parseDates(html);
  console.log(` pag ${p}: ${items.length} items, ${links.size} links`);
  for (const it of items) {
    if (!all.has(it.id)) all.set(it.id, { ...it, path: links.get(it.id) || '', data_leilao: dates.get(it.id) || '' });
  }
  for (const [id, path] of links) {
    if (!all.has(id)) all.set(id, { id, nome: '', desconto: '', brand: '', tipo: '', preco: '', path, data_leilao: dates.get(id) || '' });
  }
  await new Promise(r => setTimeout(r, 800));
}
console.log(`TOTAL UNICOS: ${all.size}`);
import { writeFileSync } from 'node:fs';
const arr = [...all.values()].sort((a,b)=>Number(b.id)-Number(a.id));
writeFileSync('lotes_parcial_1_10.json', JSON.stringify({ total: arr.length, paginas: '1-10', data: new Date().toISOString(), lotes: arr }, null, 2), 'utf8');
// gera linhas markdown
function brl(v){ if(!v) return 'N/A'; const n=Number(v); return 'R$ '+n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
let md = '';
for (const l of arr) {
  const url = l.path ? `https://www.leilaodefazenda.com.br${l.path}` : 'N/A';
  const cidade = (()=>{ const m=l.nome.match(/em (.+)$/); return m?m[1]:'N/A'; })();
  md += `| ${l.id} | ${l.nome||'N/A'} | ${url} | ${cidade} | N/A | ${brl(l.preco)} | N/A | N/A | N/A | ${l.desconto?l.desconto+'%':'N/A'} | ${l.brand||'N/A'} | ${l.tipo||'N/A'} | ${l.data_leilao||'N/A'} | N/A | ativo |\n`;
}
writeFileSync('lotes_md_1_10.txt', md, 'utf8');
console.log('OK -> lotes_parcial_1_10.json + lotes_md_1_10.txt');
