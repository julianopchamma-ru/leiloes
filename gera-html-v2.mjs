// Gera HTML completo com todas as informações: link, área, datas, ordenado por última praça
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('lotes_total_final.json', 'utf8'));
let lotes = data.lotes || [];

// Ordena por data_leilao descendente (últimas praças primeiro)
lotes.sort((a, b) => {
  const da = new Date(a.data_leilao || '1970-01-01');
  const db = new Date(b.data_leilao || '1970-01-01');
  return db - da;
});

function brl(v) {
  if (!v || v === '0' || v === 0) return 'N/A';
  const num = Number(v);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Pendente';
  try {
    // Tenta vários formatos
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
           ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
}

function cidadeUF(path, nome) {
  if (!path) return 'N/A';
  const m = path.match(/^\/imovel\/([a-z]{2})\/([^\/]+)\//);
  if (m) {
    const uf = m[1].toUpperCase();
    const cidade = m[2].split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    return `${cidade}/${uf}`;
  }
  return 'N/A';
}

// Chunks para não sobrecarregar o HTML
const chunks = [];
for (let i = 0; i < lotes.length; i += 400) {
  chunks.push(JSON.stringify(lotes.slice(i, i + 400)));
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Lotes Fazenda - ${lotes.length} Imóveis</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700&display=swap">
  <style>
    :root {
      --bg-primary: #f8f7f5;
      --bg-secondary: #ffffff;
      --text-primary: #1a1a1a;
      --text-secondary: #666666;
      --border-color: #e0ddd9;
      --accent-green: #2d6a4f;
      --accent-red: #dc2626;
      --accent-blue: #0084d4;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2a2a2a;
        --text-primary: #f5f5f5;
        --text-secondary: #b0b0b0;
        --border-color: #404040;
      }
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: var(--bg-primary); color: var(--text-primary); padding: 20px 16px; min-height: 100vh; }
    .container { max-width: 1600px; margin: 0 auto; }
    .header { margin-bottom: 20px; }
    .header h1 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; margin-bottom: 2px; }
    .header p { color: var(--text-secondary); font-size: 12px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; }
    .stat-label { font-size: 10px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .controls { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    @media (max-width: 600px) { .controls { grid-template-columns: 1fr; } }
    input, select { padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 12px; background: var(--bg-primary); color: var(--text-primary); }
    input:focus, select:focus { outline: none; border-color: var(--accent-green); box-shadow: 0 0 0 2px rgba(45,106,79,0.1); }
    .table-wrapper { overflow-x: auto; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { background: var(--bg-primary); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; }
    th { padding: 8px; text-align: left; font-weight: 600; cursor: pointer; white-space: nowrap; user-select: none; }
    th:hover { background: var(--border-color); }
    td { padding: 8px; border-bottom: 1px solid var(--border-color); }
    tbody tr:hover { background: var(--bg-primary); }
    .tipo-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; white-space: nowrap; }
    .tipo-fazenda { background: rgba(45,106,79,0.15); color: var(--accent-green); }
    .tipo-rural { background: rgba(212,188,0,0.15); color: #9d7e00; }
    .preco { font-weight: 600; color: var(--accent-green); }
    .desconto { background: rgba(220,38,38,0.1); color: var(--accent-red); padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: 600; }
    .link-btn { color: var(--accent-blue); text-decoration: none; cursor: pointer; }
    .link-btn:hover { text-decoration: underline; }
    .pagination { margin-top: 12px; text-align: center; display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .pagination button, .pagination span { padding: 4px 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); border-radius: 3px; cursor: pointer; font-size: 10px; }
    .pagination button:hover { background: var(--bg-primary); }
    .pagination .active { background: var(--accent-green); color: white; border-color: var(--accent-green); }
    .loading { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 12px; }
    .footer { text-align: center; color: var(--text-secondary); font-size: 10px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-color); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Lotes de Fazenda em Leilão</h1>
      <p>Banco de Dados Completo • Ordenado por Data da Última Praça</p>
    </div>

    <div class="stats">
      <div class="stat-card"><div class="stat-label">Total</div><div class="stat-value" id="totalLotes">-</div></div>
      <div class="stat-card"><div class="stat-label">Valor Total</div><div class="stat-value" id="valorTotal">-</div></div>
      <div class="stat-card"><div class="stat-label">Com Desconto</div><div class="stat-value" id="comDesconto">-</div></div>
      <div class="stat-card"><div class="stat-label">Fazendas</div><div class="stat-value" id="fazendas">-</div></div>
    </div>

    <div class="controls">
      <input type="text" id="searchInput" placeholder="Buscar por título, cidade, leiloeiro...">
      <select id="filterType">
        <option value="">Todos os tipos</option>
        <option value="Fazenda">Fazenda</option>
        <option value="Área Rural">Área Rural</option>
        <option value="Sítio">Sítio</option>
        <option value="Chácara">Chácara</option>
      </select>
    </div>

    <div class="table-wrapper">
      <div class="loading" id="loading">⏳ Carregando ${lotes.length} lotes...</div>
      <table id="table" style="display: none;">
        <thead>
          <tr>
            <th onclick="sort('id')" title="Clique para ordenar">ID</th>
            <th onclick="sort('nome')" title="Clique para ordenar">Imóvel</th>
            <th onclick="sort('cidade')" title="Clique para ordenar">Localização</th>
            <th onclick="sort('tipo')" title="Clique para ordenar">Tipo</th>
            <th>Área</th>
            <th onclick="sort('preco')" title="Clique para ordenar">1ª Praça</th>
            <th onclick="sort('data_leilao')" title="Clique para ordenar">Data 1ª</th>
            <th>2ª Praça</th>
            <th>Data 2ª</th>
            <th onclick="sort('desconto')" title="Clique para ordenar">%</th>
            <th>Leiloeiro</th>
            <th>Acesso</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>

    <div class="pagination" id="pagination"></div>

    <div class="footer">
      <p>🔄 Atualizado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})} • ${lotes.length} imóveis</p>
    </div>
  </div>

  <script>
    const CHUNKS = [${chunks.map(c => c).join(', ')}];
    let allLotes = [];
    let filteredLotes = [];
    let currentPage = 1;
    const ROWS_PER_PAGE = 40;
    let sortCol = 'data_leilao', sortDir = 'desc';

    function init() {
      allLotes = CHUNKS.flatMap(c => JSON.parse(c));
      // Ordena por data_leilao DESC por padrão
      allLotes.sort((a,b) => new Date(b.data_leilao||0) - new Date(a.data_leilao||0));
      filteredLotes = allLotes;
      updateStats();
      render();
      document.getElementById('loading').style.display = 'none';
      document.getElementById('table').style.display = 'table';
    }

    function updateStats() {
      const total = filteredLotes.length;
      const valor = filteredLotes.reduce((s, l) => s + (Number(l.preco) || 0), 0);
      const desc = filteredLotes.filter(l => Number(l.desconto) > 0).length;
      const faz = filteredLotes.filter(l => l.tipo === 'Fazenda').length;

      document.getElementById('totalLotes').textContent = total.toLocaleString('pt-BR');
      document.getElementById('valorTotal').textContent = valor > 0 ?
        new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0}).format(valor) : 'N/A';
      document.getElementById('comDesconto').textContent = desc;
      document.getElementById('fazendas').textContent = faz;
    }

    function filter() {
      const search = document.getElementById('searchInput').value.toLowerCase();
      const type = document.getElementById('filterType').value;

      filteredLotes = allLotes.filter(l => {
        const match = !search ||
          l.nome.toLowerCase().includes(search) ||
          cidadeUF(l.path).toLowerCase().includes(search) ||
          (l.brand || '').toLowerCase().includes(search);
        const typeMatch = !type || l.tipo === type;
        return match && typeMatch;
      });

      currentPage = 1;
      updateStats();
      render();
    }

    function sort(col) {
      if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortCol = col; sortDir = col === 'data_leilao' ? 'desc' : 'asc'; }

      filteredLotes.sort((a, b) => {
        const aVal = a[col], bVal = b[col];
        let cmp = 0;

        if (col === 'preco' || col === 'desconto') {
          cmp = Number(aVal || 0) - Number(bVal || 0);
        } else if (col === 'data_leilao') {
          cmp = new Date(bVal || 0) - new Date(aVal || 0);
        } else if (typeof aVal === 'string') {
          cmp = (aVal || '').localeCompare(bVal || '');
        } else {
          cmp = (aVal || 0) - (bVal || 0);
        }

        return sortDir === 'asc' ? cmp : -cmp;
      });
      currentPage = 1;
      render();
    }

    function render() {
      const start = (currentPage - 1) * ROWS_PER_PAGE;
      const page = filteredLotes.slice(start, start + ROWS_PER_PAGE);

      document.getElementById('tbody').innerHTML = page.map(l => {
        const cidade = cidadeUF(l.path);
        const tipoClass = l.tipo === 'Fazenda' ? 'tipo-fazenda' : 'tipo-rural';
        const link = l.link_url || ('https://www.leilaodefazenda.com.br' + (l.path || ''));
        const data1 = formatDate(l.data_leilao);
        const data2 = l.data_2a ? formatDate(l.data_2a) : '-';
        const preco2 = l.preco_2a ? brl(l.preco_2a) : '-';
        const area = l.area || '-';

        return \`<tr>
          <td><strong>\${l.id}</strong></td>
          <td><strong>\${l.nome.substring(0, 35)}</strong></td>
          <td>\${cidade}</td>
          <td><span class="tipo-badge \${tipoClass}">\${l.tipo}</span></td>
          <td>\${area}</td>
          <td class="preco">\${brl(l.preco)}</td>
          <td><small>\${data1}</small></td>
          <td class="preco">\${preco2}</td>
          <td><small>\${data2}</small></td>
          <td>\${l.desconto && l.desconto !== '0.00' ? \`<span class="desconto">\${l.desconto}%</span>\` : '-'}</td>
          <td><small>\${(l.brand || '').substring(0,16)}</small></td>
          <td><a href="\${link}" target="_blank" class="link-btn" title="\${l.nome}">🔗</a></td>
        </tr>\`;
      }).join('');

      renderPagination();
    }

    function renderPagination() {
      const total = Math.ceil(filteredLotes.length / ROWS_PER_PAGE);
      const html = [];

      if (total > 1) {
        if (currentPage > 1) html.push(\`<button onclick="currentPage=1;render()">«</button>\`);
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(total, currentPage + 2); i++) {
          html.push(\`<button class="\${i === currentPage ? 'active' : ''}" onclick="currentPage=\${i};render()">\${i}</button>\`);
        }
        if (currentPage < total) html.push(\`<button onclick="currentPage=\${total};render()">»</button>\`);
      }

      document.getElementById('pagination').innerHTML = html.join('');
    }

    function brl(v) {
      if (!v || v === '0' || v === 0) return 'N/A';
      const num = Number(v);
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(num);
    }

    function cidadeUF(path) {
      if (!path) return 'N/A';
      const m = path.match(/^\\/imovel\\/([a-z]{2})\\/([^\\/]+)\\//);
      return m ? \`\${m[2].split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}/\${m[1].toUpperCase()}\` : 'N/A';
    }

    function formatDate(d) {
      if (!d) return '-';
      try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric'}) +
               ' ' + dt.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
      } catch(e) { return d; }
    }

    document.getElementById('searchInput').addEventListener('input', filter);
    document.getElementById('filterType').addEventListener('change', filter);

    init();
  </script>
</body>
</html>`;

writeFileSync('lotes_fazenda.html', html, 'utf8');
console.log(\`✓ HTML COMPLETO gerado: lotes_fazenda.html (\${lotes.length} lotes, ordenado por data da última praça)\`);
