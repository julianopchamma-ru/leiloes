// Gera PDF sem dependências externas (PDF 1.4 manual) + HTML espelho
// Rode: node gera-pdf-leiloes.mjs
import { writeFileSync } from 'node:fs';

const lotes = [
  {
    uf: 'MG', cidade: 'Patos de Minas',
    titulo: '04% da Fazenda Caixetas (2,42 ha de 60,66 ha) – Capão Grande / Santana de Patos',
    processo: '5005751-55.2023.8.13.0480 – 1ª Vara Cível Patos de Minas/MG',
    area: '2,42 ha (parte ideal 4%)',
    tipo: 'Leilão Judicial – Cumprimento de Sentença',
    praca1: '01/10/2026 14h00 a 07/10/2026 13h00', valor1: 'R$ 145.598,64',
    praca2: '07/10/2026 14h00 a 15/10/2026 14h00', valor2: 'R$ 101.919,04 (70%)',
    fonte: 'spyleiloes.com.br/leilao/952694',
    obs: 'Eletrônico adrianoapolinario.com.br. Comissão 5%.',
  },
  {
    uf: 'MG', cidade: 'Iapu (distrito São Sebastião da Barra)',
    titulo: 'Fazenda Floresta – 190,06 ha – pastagem braquiária, casa sede + 2 casas colonos, curral, tulha',
    processo: '5001044-25.2020.8.13.0003 – 1ª Vara Abre Campo/MG (exequente Banco do Brasil)',
    area: '190,06 ha', tipo: 'Leilão Judicial',
    praca1: '27/08/2026 12h00', valor1: 'R$ 7.854.000,00 (avaliação)',
    praca2: '17/09/2026 12h00', valor2: 'R$ 3.927.000,00 (50%)',
    fonte: 'spyleiloes.com.br/leilao/905629',
    obs: '2º leilão foi anteontem (17/09). Confirmar se houve arremate / nova praça.',
  },
  {
    uf: 'SP', cidade: 'Tapiraí',
    titulo: 'Parte da Gleba 7 – 26,62 ha – Fazenda',
    processo: '1001734-49.1989.8.26.0100 – 26ª Vara Cível Central TJ/SP',
    area: '26,62 ha', tipo: 'Leilão Judicial',
    praca1: '08/09/2026 12h30', valor1: 'R$ 883.766,25',
    praca2: '29/10/2026 12h30', valor2: 'R$ 353.506,50 (40% – 60% desconto)',
    fonte: 'spyleiloes.com.br/leilao/961777 / alfaleiloes.com',
    obs: 'Aceita parcelamento. Comissão 5%. 2ª praça ainda futura – oportunidade.',
  },
  {
    uf: 'TO', cidade: 'Dianópolis – Loteamento Duas Pontes, Lote 06',
    titulo: 'Fazenda 250,96 ha – terras planas, histórico lavoura – acesso TO-040 / TO-387',
    processo: 'Leilão Judicial online (Leilão Ninja – redireciona ao leiloeiro oficial)',
    area: '250,96 ha', tipo: 'Leilão Judicial',
    praca1: '16/09/2026 16h00', valor1: 'R$ 1.730.879,12 (encerrada)',
    praca2: '01/10/2026 16h00 + 3ª em 16/10/2026 16h00', valor2: 'R$ 1.730.879,12',
    fonte: 'leilaoninja.com – Dianopolis/TO',
    obs: '25% entrada + saldo em até 30 meses. Exige termo de capacidade de pagamento.',
  },
  {
    uf: 'TO', cidade: 'Goianorte – Fazenda Bananal',
    titulo: 'Direitos fiduciários Fazenda Bananal – 858,60 ha',
    processo: '1008349-34.2021.8.26.0100 – 16ª Vara Cível Central TJ/SP',
    area: '858,60 ha', tipo: 'Leilão Judicial',
    praca1: '28/09/2026 13h00', valor1: 'R$ 20.239.338,00',
    praca2: '20/10/2026 13h00', valor2: 'R$ 10.119.669,00 (50%)',
    fonte: 'spyleiloes.com.br/leilao/975509 / alfaleiloes.com',
    obs: 'Maior ticket da lista. À vista. Comissão 5%.',
  },
  {
    uf: 'TO', cidade: 'Ponte Alta do Tocantins – Fazenda São José',
    titulo: 'Fazenda São José – 472 ha',
    processo: '0018319-83.2008.8.09.0139 – 1ª Vara Cível Rubiataba TJ/GO',
    area: '472 ha', tipo: 'Leilão Judicial',
    praca1: '06/10/2026 09h00', valor1: 'R$ 5.125.742,50',
    praca2: '06/10/2026 13h00', valor2: 'R$ 3.588.019,80 (70%)',
    fonte: 'spyleiloes.com.br/leilao/962503',
    obs: 'Débito exequendo R$ 415 mil (2024). Débitos tributários sub-rogados.',
  },
  {
    uf: 'TO', cidade: 'Aliança do Tocantins – Fazenda Souza (lote 44-E)',
    titulo: 'Fazenda Souza – 48,29 ha – latossolo amarelo, fácil acesso BR-153 + 10,5 km vicinal',
    processo: '0305976-42.2016.8.09.0093 – 2ª Vara Cível Jataí/GO',
    area: '48,29 ha', tipo: 'Leilão Judicial',
    praca1: '22/09/2026 11h00', valor1: 'R$ 796.222,06',
    praca2: '22/09/2026 12h00', valor2: 'R$ 400.000,00 (~50%)',
    fonte: 'spyleiloes.com.br/leilao/957818',
    obs: 'Parcelável em até 36x (25% entrada). Sem energia/água – ver laudo mov.124. Mais barato do TO.',
  },
  {
    uf: 'MT', cidade: 'Porto Esperidião (Comarca Mirassol D’Oeste)',
    titulo: 'Fazenda São Fabiano – parte ideal 338,76 ha (de 4.215 ha)',
    processo: 'Matrícula 16.848 – 1º Ofício Mirassol D’Oeste/MT – INCRA 9040580505206',
    area: '338,76 ha (parte ideal)', tipo: 'Leilão Judicial',
    praca1: '08/09/2026 13h00', valor1: 'R$ 4.925.388,50',
    praca2: '22/09/2026 13h00', valor2: 'R$ 2.462.694,20 (50%)',
    fonte: 'spyleiloes.com.br/leilao/981610',
    obs: 'Acesso BR-174 + 88,6 km MT-265. Desmembramento/georref. por conta do arrematante.',
  },
  {
    uf: 'MT', cidade: 'Paranatinga – Fazenda Volta do Matrinxã',
    titulo: 'Fazenda Volta do Matrinxã – 266 ha',
    processo: '0002558-15.2009.8.11.0044 – 2ª Vara Cível Paranatinga/MT',
    area: '266 ha', tipo: 'Leilão Judicial',
    praca1: '27/10/2026 11h00', valor1: 'R$ 8.259.401,97 (avaliação)',
    praca2: '27/10/2026 11h00 (lance mínimo)', valor2: 'R$ 3.303.760,78 (40% – 60% desconto)',
    fonte: 'spyleiloes.com.br/leilao/955147',
    obs: 'Praça mais distante – maior prazo para diligência. Comissão 7% (TJMT).',
  },
  {
    uf: 'GO', cidade: 'Bom Jardim de Goiás – Fazenda Patrimônio das Piranhas / Brasil I',
    titulo: 'Área remanescente 340,18 ha (de 423,19 ha) – sede, curral, pastagem formada, reserva cerrado',
    processo: '5757325-72.2022.8.09.0076 – CRI 3.380',
    area: '340,18 ha', tipo: 'Leilão Judicial',
    praca1: '30/09/2026 11h03', valor1: 'R$ 9.520.000,00',
    praca2: '30/09/2026 13h03', valor2: 'R$ 6.664.000,00 (70%)',
    fonte: 'spyleiloes.com.br/leilao/1005074',
    obs: '30,5 km da cidade (6,5 km BR-158 + 24 km chão). Parcelável 25% + 30 meses. Benfeitorias não averbadas.',
  },
];

function ascii(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n:;.,()/%–\-–R$0-9A-Za-z ]/g, '-');
}

// ---- HTML espelho (para leitura rápida) ----
let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Leilões Judiciais – Imóveis Rurais MG/SP/TO/MT/GO</title>
<style>body{font-family:Arial,sans-serif;max-width:1000px;margin:24px auto;padding:0 16px;color:#111}h1{font-size:22px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #999;padding:6px;vertical-align:top}th{background:#eee}.lote{margin:18px 0;padding:12px;border:1px solid #999}.small{color:#444;font-size:12px}</style></head><body>
<h1>Leilões Judiciais – Imóveis Rurais (MG, SP, TO, MT, GO)</h1>
<p class="small">Levantamento em 19/09/2026. Apenas leilão JUDICIAL (não exige massa falida). Sem repetição de lotes. Valores e datas conforme anúncios – confirmar edital antes de dar lance. Alienação fiduciária / extrajudicial excluídas.</p>
<table><tr><th>#</th><th>UF / Cidade</th><th>Imóvel / Área</th><th>1ª Praça – valor</th><th>2ª Praça – valor</th></tr>`;
lotes.forEach((l, i) => {
  html += `<tr><td>${i + 1}</td><td><b>${l.uf}</b> – ${l.cidade}</td><td><b>${l.titulo}</b><br><span class="small">${l.processo}<br>${l.fonte}<br>${l.obs}</span></td><td>${l.praca1}<br><b>${l.valor1}</b></td><td>${l.praca2}<br><b>${l.valor2}</b></td></tr>`;
});
html += `</table><p class="small">Fontes: spyleiloes.com.br, leilaoninja.com, editais dos leiloeiros (Alfa, Adriano Apolinário etc.). Datas em horário de Brasília salvo indicação.</p></body></html>`;
writeFileSync('leiloes-rurais-MG-SP-TO-MT-GO.html', html, 'utf8');

// ---- PDF manual ----
const lines = [];
lines.push('LEILOES JUDICIAIS - IMOVEIS RURAIS (MG, SP, TO, MT, GO)');
lines.push('Levantamento 19/09/2026 | Apenas judicial | Sem repeticao | Confirmar edital');
lines.push('='.repeat(95));
lotes.forEach((l, i) => {
  lines.push('');
  lines.push(`${i + 1}. [${l.uf}] ${l.cidade}`);
  lines.push(`   Imovel: ${l.titulo}`);
  lines.push(`   Area: ${l.area} | ${l.tipo}`);
  lines.push(`   Proc: ${l.processo}`);
  lines.push(`   1a Praca: ${l.praca1} -> ${l.valor1}`);
  lines.push(`   2a Praca: ${l.praca2} -> ${l.valor2}`);
  lines.push(`   Fonte: ${l.fonte}`);
  lines.push(`   Obs: ${l.obs}`);
  lines.push('-'.repeat(95));
});
lines.push('');
lines.push('AVISO: valores/datas dos anuncios; checar edital, matricula, ocupacao e debitos antes do lance.');

function wrap(line, max = 95) {
  if (line.length <= max) return [line];
  const out = []; let cur = '';
  for (const w of line.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) { out.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
let flat = [];
for (const ln of lines) flat.push(...wrap(ascii(ln)));
// paginação: 55 linhas por página, fonte Courier 9
const perPage = 55;
const pages = [];
for (let i = 0; i < flat.length; i += perPage) pages.push(flat.slice(i, i + perPage));

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }

let objs = [];
// 1 catalog, 2 pages, depois por página: page + content; fonte no final
let contentIndices = [];
let n = 3;
const pageObjNums = [];
for (const pg of pages) {
  pageObjNums.push(n); n += 2; // page + content
}
const fontObj = n; n += 1;
const totalObjs = n - 1;

let pdf = '%PDF-1.4\n';
const offsets = [0];
function addObj(num, body) {
  offsets[num] = Buffer.byteLength(pdf, 'latin1');
  pdf += `${num} 0 obj\n${body}\nendobj\n`;
}
const kids = pageObjNums.map(p => `${p} 0 R`).join(' ');
addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
addObj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
pages.forEach((pg, idx) => {
  const pNum = pageObjNums[idx], cNum = pNum + 1;
  let stream = 'BT /F1 9 Tf 36 800 Td 11 TL\n';
  for (const ln of pg) stream += `(${esc(ln)}) Tj T*\n`;
  stream += 'ET';
  addObj(pNum, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${cNum} 0 R >>`);
  addObj(cNum, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
});
addObj(fontObj, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
const xrefPos = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= totalObjs; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
writeFileSync('leiloes-rurais-MG-SP-TO-MT-GO.pdf', Buffer.from(pdf, 'latin1'));
console.log(`OK: ${pages.length} paginas, ${flat.length} linhas -> leiloes-rurais-MG-SP-TO-MT-GO.pdf + .html`);
