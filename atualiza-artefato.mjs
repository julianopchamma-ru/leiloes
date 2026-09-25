// Atualiza artefato com paginas 1-10
import { readFileSync, writeFileSync } from 'node:fs';
const j = JSON.parse(readFileSync('lotes_parcial_1_10.json','utf8'));
function brl(v){ if(!v) return 'N/A'; return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function cidadeUF(path, nome){
  const m = path.match(/^\/imovel\/([a-z]{2})\/([^\/]+)\//);
  if(m){ const uf=m[1].toUpperCase(); const cid=m[2].split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '); return `${cid}/${uf}`; }
  const m2 = nome.match(/em (.+)$/); return m2?m2[1]:'N/A';
}
let linhas = j.lotes.map(l=>{
  const url = `https://www.leilaodefazenda.com.br${l.path}`;
  return `| ${l.id} | ${l.nome} | ${url} | ${cidadeUF(l.path,l.nome)} | N/A | ${brl(l.preco)} | N/A | N/A | N/A | ${l.desconto?l.desconto+'%':'N/A'} | ${l.brand||'N/A'} | ${l.tipo||'N/A'} | ${l.data_leilao||'N/A'} | N/A | ativo |`;
});
const hoje = new Date().toISOString().slice(0,10);
const ids = j.lotes.map(l=>l.id);
const md = `# Lotes Fazenda Completo - https://www.leilaodefazenda.com.br

> ARTEFATO ÚNICO DE VARREDURA - Agente deve LER antes e ATUALIZAR a cada execução. Não criar outro arquivo.

## Controle de Progresso
- total_mapeado: ${j.total}
- total_estimado: 1932
- percentual_concluido: ${(j.total/1932*100).toFixed(1)}%
- ultima_pagina_varrida: 10
- ultimo_id_processado: ${ids[ids.length-1]}
- ordenacao_fixa: \`/encontre-seu-imovel?ordem=dt_insert_d\`
- data_execucao: ${hoje}
- fase_atual: FASE 1 - MAPEAMENTO (10% por execução ~190 lotes)
- ids_processados: [${ids.slice(0,5).join(', ')}, ... total ${ids.length}]

## Tabela de Lotes
| id | titulo | url_completa | cidade_UF | endereco | preco_1a_praca | data_1a_praca | preco_2a_praca | data_2a_praca | desconto_pct | modalidade | tipo_imovel | data_encerramento | data_inclusao | status |
|----|--------|--------------|-----------|----------|----------------|---------------|----------------|---------------|--------------|------------|-------------|-------------------|-----------------|--------|
${linhas.join('\n')}

## CHECKPOINT
\`\`\`
proxima_execucao_começar_em: pagina 11
excluir_ids: [${ids.join(', ')}]
observacao: Paginas 1-10 concluidas (200 lotes). Proxima rodada varrer paginas 11-20.
total_paginas_site: 97
\`\`\`

## Log de Atualizações - FASE 2
<!-- Usar após atingir >=95% mapeado. Não re-listar tudo, só entradas/saídas. -->
### Atualização [${hoje}] - FASE 1 rodada 1/10
- +entradas: ${j.total} (paginas 1-10)
- -saidas: 0
- total_atual: ${j.total}
`;
writeFileSync('lotes_fazenda_completo.md', md, 'utf8');
console.log(`OK artefato atualizado com ${j.total}`);
