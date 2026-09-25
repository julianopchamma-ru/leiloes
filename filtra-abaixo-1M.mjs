// Filtra os 150 lotes (de gera-pdf-150.mjs) para lances < R$1M (1a OU 2a praca)
// Gera leiloes-abaixo-1M-*.pdf/html ordenados por data
// Rode: node filtra-abaixo-1M.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync('gera-pdf-150.mjs', 'utf8');
const m = src.match(/const R = \[([\s\S]*?)\];/);
if (!m) { console.error('R nao encontrado'); process.exit(1); }
const Rall = eval('[' + m[1] + ']');
// mesmo universo do PDF de 150: primeiros 150 nao-excluidos na ordem original
const R = Rall.filter(r=>!String(r[6]).includes('EXCLUIDO')).slice(0,150);

function parseBRL(s) {
  if (!s) return null;
  s = String(s);
  if (/EXCLUIDO|indisponivel|ver edital|praca unica|^-\s*$/.test(s)) return null;
  const m2 = s.match(/R\$\s*([\d.]+,\d{2})/);
  if (!m2) return null;
  return parseFloat(m2[1].replace(/\./g, '').replace(',', '.'));
}

const LIM = 1000000;
const out = [];
for (const r of R) {
  const v1 = parseBRL(r[6]), v2 = parseBRL(r[8]);
  if (v1 === null && v2 === null) continue;
  if ((v1 !== null && v1 < LIM) || (v2 !== null && v2 < LIM)) {
    out.push({ r, v1, v2, min: Math.min(v1 ?? Infinity, v2 ?? Infinity) });
  }
}
out.sort((a, b) => a.r[4] < b.r[4] ? -1 : a.r[4] > b.r[4] ? 1 : a.min - b.min);

console.log(`Filtrados: ${out.length} de ${R.length}`);

// HTML
let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Lotes abaixo de R$1M - judicial rural</title><style>body{font-family:Arial,sans-serif;max-width:1100px;margin:20px auto;padding:0 12px;font-size:12px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:4px;vertical-align:top}th{background:#eee}</style></head><body><h2>${out.length} lotes abaixo de R$1M - Leilao Judicial Rural MG/SP/TO/MT/GO - ordem das pracas</h2><p>Criterio: 1a OU 2a praca &lt; R$1.000.000. Sem repeticao. Confirmar edital/matricula/ocupacao.</p><table><tr><th>#</th><th>Data 1a</th><th>UF/Cidade</th><th>Lote / Area</th><th>1a Praca</th><th>2a Praca</th></tr>`;
out.forEach((o, i) => { const r = o.r; html += `<tr><td>${i + 1}</td><td>${r[5]}</td><td><b>${r[0]}</b> ${r[1]}</td><td><b>${r[2]}</b><br>${r[3]}</td><td>${r[5]}<br><b>${r[6]}</b></td><td>${r[7]}<br><b>${r[8]}</b></td></tr>`; });
html += `</table></body></html>`;
writeFileSync('leiloes-abaixo-1M-MG-SP-TO-MT-GO.html', html, 'utf8');

// PDF manual
function norm(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'-');}
const lines = [];
lines.push(`${out.length} LOTES ABAIXO DE R$1M - JUDICIAL RURAL MG/SP/TO/MT/GO - ORDEM DAS PRACAS`);
lines.push('Criterio: 1a ou 2a praca < R$1M | Sem repeticao | Confirmar edital');
lines.push('='.repeat(95));
out.forEach((o, i) => { const r = o.r;
  lines.push('');
  lines.push(`${i + 1}. [${r[0]}] ${r[1]} - ${r[5]}`);
  lines.push(`   ${r[2]} | Area: ${r[3]}`);
  lines.push(`   1a: ${r[5]} -> ${r[6]}`);
  lines.push(`   2a: ${r[7]} -> ${r[8]}`);
  lines.push('-'.repeat(95));
});
function wrap(line, max = 95){ if(line.length<=max) return [line]; const o=[]; let c=''; for(const w of line.split(' ')){ if((c+' '+w).trim().length>max){o.push(c);c=w;} else c=(c+' '+w).trim(); } if(c)o.push(c); return o; }
let flat=[]; for(const ln of lines) flat.push(...wrap(norm(ln)));
const perPage=52, pages=[]; for(let i=0;i<flat.length;i+=perPage) pages.push(flat.slice(i,i+perPage));
function esc(s){return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
const pns=[]; let n=3; for(const _ of pages){pns.push(n);n+=2;}
const f=pns.length? n : 3, tot=n;
let pdf='%PDF-1.4\n'; const off=[0];
function addObj(num,body){off[num]=Buffer.byteLength(pdf,'latin1');pdf+=`${num} 0 obj\n${body}\nendobj\n`;}
addObj(1,'<< /Type /Catalog /Pages 2 0 R >>');
addObj(2,`<< /Type /Pages /Kids [${pns.map(p=>p+' 0 R').join(' ')}] /Count ${pages.length} >>`);
pages.forEach((pg,idx)=>{const p=pns[idx],c=p+1;let st='BT /F1 8 Tf 30 810 Td 10 TL\n';for(const ln of pg)st+=`(${esc(ln)}) Tj T*\n`;st+='ET';addObj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${f} 0 R >> >> /Contents ${c} 0 R >>`);addObj(c,`<< /Length ${Buffer.byteLength(st,'latin1')} >>\nstream\n${st}\nendstream`);});
addObj(f,'<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
const xr=Buffer.byteLength(pdf,'latin1');
pdf+=`xref\n0 ${tot+1}\n0000000000 65535 f \n`;for(let i=1;i<=tot;i++)pdf+=`${String(off[i]).padStart(10,'0')} 00000 n \n`;
pdf+=`trailer\n<< /Size ${tot+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
writeFileSync('leiloes-abaixo-1M-MG-SP-TO-MT-GO.pdf', Buffer.from(pdf,'latin1'));
console.log(`OK -> leiloes-abaixo-1M-MG-SP-TO-MT-GO.pdf (${pages.length} pags)`);
