const FLEVOPAY_QUERY_URL = 'https://app.flevopay.com.br/api/v1/query';

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro id é obrigatório.' }) };
  }

  try {
    const flevoRes = await fetch(
      `${FLEVOPAY_QUERY_URL}?action=get_transaction&id=${encodeURIComponent(id)}`,
      { headers: { 'X-API-Key': process.env.FLEVOPAY_SECRET_KEY } }
    );

    const data = await flevoRes.json();

    if (!flevoRes.ok) {
      return {
        statusCode: flevoRes.status,
        body: JSON.stringify({ error: data.error || data.message || 'Falha ao consultar o pagamento.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ status: data.status, amount: data.amount, updated_at: data.updated_at }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao consultar o pagamento.' }) };
  }
};
