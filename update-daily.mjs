#!/usr/bin/env node
// Rotina diária: coleta + gera HTML completo
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const LOG_FILE = `log-${new Date().toISOString().split('T')[0]}.txt`;
let log = [];

function logLine(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  log.push(line);
  console.log(line);
}

async function runScript(script, label) {
  return new Promise((resolve, reject) => {
    logLine(`▶ ${label}...`);
    const child = spawn('node', [script], { stdio: 'pipe' });
    let stdout = '', stderr = '';

    child.stdout.on('data', (d) => {
      stdout += d;
      process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      stderr += d;
      process.stderr.write(d);
    });

    child.on('close', (code) => {
      if (code === 0) {
        logLine(`✓ ${label} OK`);
        resolve(stdout);
      } else {
        logLine(`✗ ${label} ERRO (código ${code})`);
        reject(new Error(\`\${label} falhou\`));
      }
    });
  });
}

async function main() {
  logLine('═══════════════════════════════════════════');
  logLine('ROTINA DIÁRIA - LEILÃO FAZENDA');
  logLine('═══════════════════════════════════════════');
  logLine('');

  try {
    // 1. Coleta dados com extraction expandida
    await runScript('atualiza-diario-v2.mjs', 'Coleta de dados');
    logLine('');

    // 2. Gera HTML completo com todas as informações
    await runScript('gera-html-v2.mjs', 'Geração de HTML');
    logLine('');

    logLine('═══════════════════════════════════════════');
    logLine('✓ SUCESSO - Todos os passos completados');
    logLine('═══════════════════════════════════════════');
    logLine('');
    logLine('Arquivos atualizados:');
    logLine('  • lotes_total_final.json (banco de dados)');
    logLine('  • lotes_fazenda.html (dashboard)');

  } catch (e) {
    logLine('');
    logLine('═══════════════════════════════════════════');
    logLine('✗ ERRO - Execução abortada');
    logLine('═══════════════════════════════════════════');
    logLine(\`Motivo: \${e.message}\`);
    process.exit(1);
  } finally {
    writeFileSync(LOG_FILE, log.join('\\n'), 'utf8');
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
