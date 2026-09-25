// Cliente Jev (TypeSafe AI) via Vercel AI Gateway + AI SDK 7
// Docs: https://vercel.com/docs/ai-gateway/modalities/evaluation
// Modelo: typesafe-ai/jev - evaluation, sem geração de texto
// Requer: AI_GATEWAY_API_KEY no .env
// Uso: import { classificarTexto, rotearTicket } from './jev-client.mjs'

import 'dotenv/config';
import { experimental_evaluate as evaluate } from 'ai';

const DEFAULT_MODEL = 'typesafe-ai/jev';

function assertApiKey() {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error(
      'AI_GATEWAY_API_KEY não definida. Crie um .env com AI_GATEWAY_API_KEY=sua_chave_vercel'
    );
  }
}

/**
 * Classificação / decisão genérica com Jev.
 * @param {string|object|Array} state - conteúdo a julgar (texto, JSON, array = 1 estado)
 * @param {object} questions - mapa de perguntas tipadas { id: { type, instructions, criteria? } }
 * @param {object} opts - { model?, providerOptions? }
 * Tipos: boolean (noul) -> { probability }, choice -> { choice, probabilities }, score -> { score, probabilities }
 */
export async function avaliarComJev(state, questions, opts = {}) {
  assertApiKey();
  const result = await evaluate({
    model: opts.model ?? DEFAULT_MODEL,
    state,
    questions,
    providerOptions: opts.providerOptions ?? {
      gateway: { zeroDataRetention: true },
    },
  });
  return result; // { answers, providerMetadata, usage }
}

/**
 * Exemplo pronto: roteamento de ticket (classification + score + boolean em paralelo)
 */
export async function rotearTicket(ticket, opts = {}) {
  // ticket pode ser string ou objeto { subject, message, plan, ... }
  const result = await avaliarComJev(
    ticket,
    {
      department: {
        type: 'choice',
        instructions: 'Which team should handle this ticket?',
        criteria: {
          billing: 'Charges, invoices, and refunds',
          technical: 'Bugs, outages, and integration failures',
          account: 'Login, permissions, and profile changes',
          other: 'Anything that does not fit the other teams',
        },
      },
      severity: {
        type: 'score',
        instructions: 'How severe is the issue for the customer?',
        criteria: [
          'Cosmetic or informational',
          'Degraded, but a workaround exists',
          'Blocking with no workaround',
          'Blocking and causing financial or data loss',
        ],
      },
      requestsRefund: {
        type: 'boolean',
        instructions: 'Is the customer asking for money back?',
      },
    },
    opts
  );

  const { department, severity, requestsRefund } = result.answers;
  const confidence =
    result.providerMetadata?.typesafe?.confidence ?? {};

  // Lógica de decisão com thresholds - calibre com seus dados rotulados
  const deptConf = confidence.department ?? 0;
  const selectedProb = department.probabilities?.[department.choice] ?? 0;

  if (deptConf < 0.6 || selectedProb < 0.7) {
    return {
      action: 'human-review',
      reason: 'ambiguous department',
      raw: result.answers,
      confidence,
      usage: result.usage,
    };
  }

  return {
    action: 'assign',
    queue: department.choice,
    severity: severity.score,
    refundRequested: requestsRefund.probability >= 0.8,
    confidence,
    usage: result.usage,
  };
}

/**
 * Classificação simples boolean (ex: urgente? spam? reembolso?)
 */
export async function classificarBooleano(texto, instructions, criteria, opts = {}) {
  const result = await avaliarComJev(
    texto,
    {
      decisao: {
        type: 'boolean',
        instructions,
        ...(criteria ? { criteria } : {}),
      },
    },
    opts
  );
  return result.answers.decisao; // { type: 'boolean', probability }
}
