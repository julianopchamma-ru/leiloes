#!/usr/bin/env node
// Script orquestrador para rotina diária: coleta dados + gera HTML

import { execSync, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const LOG_FILE = `update-${new Date().toISOString().split('T')[0]}.log`;
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

    child.stdout.on('data', (d) => { stdout += d; process.stdout.write(d); });
    child.stderr.on('data', (d) => { stderr += d; process.stderr.write(d); });

    child.on('close', (code) => {
      if (code === 0) {
        logLine(`✓ ${label} concluído`);
        resolve(stdout);
      } else {
        logLine(`✗ ${label} falhou com código ${code}`);
        logLine(`  stderr: ${stderr.slice(0, 200)}`);
        reject(new Error(`${label} failed: ${stderr}`));
      }
    });
  });
}

async function main() {
  logLine('='.repeat(50));
  logLine('ROTINA DIÁRIA - LEILÃO FAZENDA');
  logLine('='.repeat(50));

  try {
    // 1. Atualizar base de dados
    await runScript('atualiza-diario.mjs', 'Coleta de dados (atualiza-diario)');

    // 2. Gerar HTML
    await runScript('gera-html.mjs', 'Geração de HTML (gera-html)');

    logLine('');
    logLine('='.repeat(50));
    logLine('✓ SUCESSO: Todos os passos completados');
    logLine('='.repeat(50));

  } catch (e) {
    logLine('');
    logLine('='.repeat(50));
    logLine(`✗ ERRO: ${e.message}`);
    logLine('='.repeat(50));
    process.exit(1);
  }

  writeFileSync(LOG_FILE, log.join('\n'), 'utf8');
}

main().catch(e => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
