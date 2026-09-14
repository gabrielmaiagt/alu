const SKALEPAY_URL = 'https://api.skalepayments.com.br/transactions';
const SKALEPAY_DEFAULT_KEY = 'sk_e3d438dd915590d98a58e726c9069a1101147cb9a9e157ab57fc7e6332b07580';

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro id é obrigatório.' }) };
  }

  const apiKey = (process.env.SKALEPAY_SECRET_KEY && !process.env.SKALEPAY_SECRET_KEY.startsWith('flevopay_'))
    ? process.env.SKALEPAY_SECRET_KEY
    : SKALEPAY_DEFAULT_KEY;

  try {
    const skaleRes = await fetch(
      `${SKALEPAY_URL}/${encodeURIComponent(id)}`,
      {
        headers: {
          'X-API-Key': apiKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      }
    );

    const data = await skaleRes.json();

    if (!skaleRes.ok) {
      return {
        statusCode: skaleRes.status,
        body: JSON.stringify({ error: data.message || data.error || 'Falha ao consultar o pagamento.' }),
      };
    }

    // Status da SkalePay: waiting_payment, paid, refused, cancelled, refunded
    // Para compatibilidade com checagens legadas no front que esperam 'approved' ou 'paid':
    const rawStatus = data.status || '';
    const isPaid = (rawStatus === 'paid' || rawStatus === 'approved');
    const normalizedStatus = isPaid ? 'approved' : rawStatus;

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: normalizedStatus,
        raw_status: rawStatus,
        is_paid: isPaid,
        amount: data.amount,
        updated_at: data.timestamp || data.updatedAt,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao consultar o pagamento.' }) };
  }
};
