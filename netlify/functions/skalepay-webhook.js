// Recebe notificações da SkalePayments quando o status de uma transação muda
// (ex: status: "paid").
// Configurado automaticamente por transação via `postbackUrl` e/ou via painel.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) };
  }

  // status possíveis da SkalePay: waiting_payment, paid, refused, cancelled, refunded
  console.log('[skalepay-webhook]', JSON.stringify({
    id: payload.id,
    status: payload.status,
    amount: payload.amount,
    metadata: payload.metadata,
    user: payload.user,
    pix: payload.pix ? { end2EndId: payload.pix.end2EndId } : null,
    timestamp: payload.timestamp || new Date().toISOString(),
  }));

  // A SkalePayments exige resposta 2xx para confirmar o recebimento
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true }),
  };
};
