// Gera HTML interativo com todos os lotes do JSON
import { readFileSync, writeFileSync } from 'node:fs';

const data = JSON.parse(readFileSync('lotes_total_final.json', 'utf8'));
const lotes = data.lotes || [];

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

function formatDate(dateStr) {
  if (!dateStr) return 'Pendente';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

// Gera dados em chunks para o JavaScript
const chunks = [];
for (let i = 0; i < lotes.length; i += 500) {
  chunks.push(JSON.stringify(lotes.slice(i, i + 500)));
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    body { font-family: 'Inter', sans-serif; background: var(--bg-primary); color: var(--text-primary); padding: 24px 16px; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .header h1 { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header p { color: var(--text-secondary); font-size: 13px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; }
    .stat-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .stat-value { font-size: 20px; font-weight: 700; }
    .controls { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 600px) { .controls { grid-template-columns: 1fr; } }
    input, select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 13px; background: var(--bg-primary); color: var(--text-primary); }
    input:focus, select:focus { outline: none; border-color: var(--accent-green); box-shadow: 0 0 0 2px rgba(45,106,79,0.1); }
    .table-wrapper { overflow-x: auto; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead { background: var(--bg-primary); border-bottom: 1px solid var(--border-color); }
    th { padding: 10px 12px; text-align: left; font-weight: 600; cursor: pointer; white-space: nowrap; }
    th:hover { background: var(--border-color); }
    td { padding: 10px 12px; border-bottom: 1px solid var(--border-color); }
    tbody tr:hover { background: var(--bg-primary); }
    .tipo-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; }
    .tipo-fazenda { background: rgba(45,106,79,0.15); color: var(--accent-green); }
    .tipo-rural { background: rgba(212,188,0,0.15); color: #9d7e00; }
    .preco { font-weight: 600; color: var(--accent-green); }
    .desconto { background: rgba(220,38,38,0.1); color: var(--accent-red); padding: 2px 4px; border-radius: 2px; font-size: 10px; font-weight: 600; }
    .pagination { margin-top: 16px; text-align: center; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .pagination button, .pagination span { padding: 6px 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); border-radius: 4px; cursor: pointer; font-size: 11px; }
    .pagination button:hover { background: var(--bg-primary); }
    .pagination .active { background: var(--accent-green); color: white; border-color: var(--accent-green); }
    .loading { text-align: center; padding: 32px; color: var(--text-secondary); }
    .footer { text-align: center; color: var(--text-secondary); font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Lotes Fazenda</h1>
      <p>Leilão de Fazenda - Banco de Dados Completo</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total de Lotes</div>
        <div class="stat-value" id="totalLotes">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Valor Total</div>
        <div class="stat-value" id="valorTotal">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Com Desconto</div>
        <div class="stat-value" id="comDesconto">-</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Fazendas</div>
        <div class="stat-value" id="fazendas">-</div>
      </div>
    </div>

    <div class="controls">
      <input type="text" id="searchInput" placeholder="Buscar por título, cidade...">
      <select id="filterType">
        <option value="">Todos os tipos</option>
        <option value="Fazenda">Fazenda</option>
        <option value="Área Rural">Área Rural</option>
        <option value="Sítio">Sítio</option>
        <option value="Chácara">Chácara</option>
      </select>
    </div>

    <div class="table-wrapper">
      <div class="loading" id="loading">Carregando dados...</div>
      <table id="table" style="display: none;">
        <thead>
          <tr>
            <th onclick="sort('id')">ID</th>
            <th onclick="sort('nome')">Título</th>
            <th onclick="sort('cidade')">Localização</th>
            <th onclick="sort('tipo')">Tipo</th>
            <th onclick="sort('preco')">Preço</th>
            <th onclick="sort('desconto')">Desc.</th>
            <th onclick="sort('brand')">Leiloeiro</th>
            <th onclick="sort('data_leilao')">Leilão</th>
          </tr>
        </thead>
        <tbody id="tbody"></tbody>
      </table>
    </div>

    <div class="pagination" id="pagination"></div>
    <div class="footer">
      <p>Atualizado em ${new Date().toLocaleDateString('pt-BR')} • ${lotes.length} imóveis</p>
    </div>
  </div>

  <script>
    const CHUNKS = [${chunks.map(c => c).join(', ')}];
    let allLotes = [];
    let filteredLotes = [];
    let currentPage = 1;
    const ROWS_PER_PAGE = 50;
    let sortCol = 'id', sortDir = 'asc';

    function init() {
      allLotes = CHUNKS.flatMap(c => JSON.parse(c));
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
      document.getElementById('valorTotal').textContent = valor > 0 ? new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0}).format(valor) : 'N/A';
      document.getElementById('comDesconto').textContent = desc;
      document.getElementById('fazendas').textContent = faz;
    }

    function filter() {
      const search = document.getElementById('searchInput').value.toLowerCase();
      const type = document.getElementById('filterType').value;

      filteredLotes = allLotes.filter(l => {
        const match = !search || l.nome.toLowerCase().includes(search) || cidadeUF(l.path).toLowerCase().includes(search);
        const typeMatch = !type || l.tipo === type;
        return match && typeMatch;
      });

      currentPage = 1;
      updateStats();
      render();
    }

    function sort(col) {
      if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortCol = col; sortDir = 'asc'; }

      filteredLotes.sort((a, b) => {
        const aVal = a[col], bVal = b[col];
        const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : (aVal - bVal);
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
        return \`<tr>
          <td>\${l.id}</td>
          <td><strong>\${l.nome.substring(0, 40)}</strong></td>
          <td>\${cidade}</td>
          <td><span class="tipo-badge \${tipoClass}">\${l.tipo}</span></td>
          <td class="preco">\${brl(l.preco)}</td>
          <td>\${l.desconto && l.desconto !== '0.00' ? \`<span class="desconto">\${l.desconto}%</span>\` : '-'}</td>
          <td><small>\${(l.brand || '').substring(0,18)}</small></td>
          <td><small>\${formatDate(l.data_leilao)}</small></td>
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
      return !d ? 'Pendente' : new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    document.getElementById('searchInput').addEventListener('input', filter);
    document.getElementById('filterType').addEventListener('change', filter);

    init();
  </script>
</body>
</html>`;

writeFileSync('lotes_fazenda.html', html, 'utf8');
console.log(`✓ HTML gerado: lotes_fazenda.html (${lotes.length} lotes)`);
