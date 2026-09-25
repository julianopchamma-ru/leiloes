// Teste rápido do Jev via Vercel AI Gateway
// Rode: npm run jev:test  (requer .env com AI_GATEWAY_API_KEY)
// Ou: node jev-test.mjs

import 'dotenv/config';
import { rotearTicket, classificarBooleano } from './jev-client.mjs';

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    console.error('❌ Falta AI_GATEWAY_API_KEY no .env');
    console.error('Crie um arquivo .env com: AI_GATEWAY_API_KEY=sua_chave_do_vercel_ai_gateway');
    process.exit(1);
  }

  console.log('— Teste 1: boolean simples —');
  const r1 = await classificarBooleano(
    'The support agent issued a full refund to the customer.',
    'Was a refund issued?'
  );
  console.log(r1);

  console.log('\n— Teste 2: roteamento completo (choice + score + boolean) —');
  const decisao = await rotearTicket({
    subject: 'Cobrança duplicada',
    message: 'I was charged twice. Please refund the duplicate. Cannot use dashboard, blocking deploy.',
    plan: 'pro',
  });
  console.log(JSON.stringify(decisao, null, 2));
}

main().catch((e) => {
  console.error('Erro Jev:', e.message);
  if (e.response) console.error(e.response);
  process.exit(1);
});
