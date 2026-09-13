// Recebe notificações da FlevoPay quando o status de uma transação muda
// (ex: pix aprovado). Configurado automaticamente por transação via
// `postback_url` no momento da criação do Pix (ver create-pix.js).
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

  // status possíveis: pending, approved, processing, under_review, failed, refunded, chargeback
  console.log('[flevopay-webhook]', JSON.stringify({
    transaction_id: payload.transaction_id,
    external_id: payload.external_id,
    status: payload.status,
    amount: payload.amount,
    payment_method: payload.payment_method,
    tracking: payload.tracking,
  }));

  // A FlevoPay exige 200 OK para considerar o webhook entregue.
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
