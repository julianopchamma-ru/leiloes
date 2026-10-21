// Reconstrução completa da base (lotes_total_final.json foi perdida - nunca foi commitada no git)
// Varre o site em duas ordens (mais novos primeiro, mais antigos primeiro) para cobrir o
// catálogo inteiro, já que cada ordem só expõe ~50 páginas no site.
import { writeFileSync } from 'node:fs';

const URL_NOVOS = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_d';
const URL_ANTIGOS = 'https://www.leilaodefazenda.com.br/encontre-seu-imovel?ordem=dt_insert_a';

async function fetchHtml(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return { status: r.status, html: await r.text() };
}

function parse(html, map) {
  const re = /\{\s*item_id:\s*"(\d+)"[\s\S]*?item_name:\s*"([^"]+)"[\s\S]*?discount:\s*([\d.]+)[\s\S]*?item_brand:\s*"([^"]*)"[\s\S]*?item_variant:\s*"([^"]*)"[\s\S]*?price:\s*([\d.]+)/g;
  let m, found = 0;
  while ((m = re.exec(html)) !== null) {
    found++;
    if (!map.has(m[1])) {
      map.set(m[1], { id: m[1], nome: m[2], desconto: m[3], brand: m[4], tipo: m[5], preco: m[6], preco_2a: '', data_leilao: '', data_2a: '', area: '', path: '', link_url: '' });
    }
  }
  const rl = /href="(\/imovel\/[^"]+--(\d+))"/g;
  while ((m = rl.exec(html)) !== null) {
    const e = map.get(m[2]);
    if (e && !e.path) { e.path = m[1]; e.link_url = 'https://www.leilaodefazenda.com.br' + m[1]; }
  }
  const rd = /item_id:\s*"(\d+)"[\s\S]{0,600}?item_category4:\s*"([^"]+)"/g;
  while ((m = rd.exec(html)) !== null) {
    const e = map.get(m[1]);
    if (e) e.data_leilao = m[2];
  }
  return found;
}

async function crawl(baseUrl, label, map) {
  let vazias = 0;
  for (let p = 1; p <= 60; p++) {
    const url = p === 1 ? baseUrl : baseUrl + '&pag=' + p;
    try {
      const { html } = await fetchHtml(url);
      const found = parse(html, map);
      console.log(`[${label}] pag ${p}: ${found} itens no regex, total acumulado ${map.size}`);
      if (found === 0) {
        vazias++;
        if (vazias >= 2) { console.log(`[${label}] duas páginas vazias seguidas, parando em p${p}`); break; }
      } else {
        vazias = 0;
      }
    } catch (e) {
      console.log(`[${label}] erro pag ${p}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
}

const all = new Map();
await crawl(URL_NOVOS, 'novos', all);
await crawl(URL_ANTIGOS, 'antigos', all);

const arr = [...all.values()];
arr.sort((a, b) => new Date(b.data_leilao || 0) - new Date(a.data_leilao || 0));

writeFileSync('lotes_total_final.json', JSON.stringify({ total: arr.length, data: new Date().toISOString(), lotes: arr }, null, 2), 'utf8');
console.log(`\nOK — base reconstruída com ${arr.length} imóveis -> lotes_total_final.json`);
