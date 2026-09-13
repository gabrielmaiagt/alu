const FLEVOPAY_URL = 'https://app.flevopay.com.br/api/v1/transaction';

function onlyDigits(v) {
  return String(v || '').replace(/\D/g, '');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) };
  }

  const { amount, description, reference, customer, tracking } = body;

  const document = onlyDigits(customer && customer.document);
  const phone = onlyDigits(customer && customer.phone);

  if (
    !Number.isInteger(amount) || amount <= 0 ||
    !description || !reference ||
    !customer || !customer.name || !customer.email || document.length !== 11
  ) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dados inválidos ou incompletos para gerar o Pix.' }) };
  }

  try {
    const flevoRes = await fetch(FLEVOPAY_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.FLEVOPAY_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        reference,
        source: 'api_externa',
        customer: {
          name: customer.name,
          email: customer.email,
          phone,
          document,
        },
        ...(tracking && Object.keys(tracking).length ? { tracking } : {}),
      }),
    });

    const data = await flevoRes.json();

    if (!flevoRes.ok) {
      return {
        statusCode: flevoRes.status,
        body: JSON.stringify({ error: data.error || data.message || 'Falha ao gerar cobrança Pix.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        transaction_id: data.transaction_id || data.id,
        qr_code: data.qr_code,
        amount: data.amount,
        expires_at: data.expires_at || null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao gerar o Pix. Tente novamente.' }) };
  }
};
