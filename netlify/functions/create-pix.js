const SKALEPAY_URL = 'https://api.skalepayments.com.br/transactions';
const SKALEPAY_DEFAULT_KEY = 'sk_e3d438dd915590d98a58e726c9069a1101147cb9a9e157ab57fc7e6332b07580';

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

  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers.host || '';
  const proto = headers['x-forwarded-proto'] || (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  const postbackUrl = host ? `${proto}://${host}/api/skalepay-webhook` : undefined;

  const document = onlyDigits(customer && customer.document);
  let phone = onlyDigits(customer && customer.phone);
  if (phone.length < 10 || phone.length > 11) {
    phone = '11987654321';
  }

  if (
    !Number.isInteger(amount) || amount <= 0 ||
    !customer || !customer.name || !customer.email || document.length !== 11
  ) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Dados inválidos ou incompletos para gerar o Pix.' }) };
  }

  const apiKey = (process.env.SKALEPAY_SECRET_KEY && !process.env.SKALEPAY_SECRET_KEY.startsWith('flevopay_'))
    ? process.env.SKALEPAY_SECRET_KEY
    : SKALEPAY_DEFAULT_KEY;

  try {
    const skaleRes = await fetch(SKALEPAY_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        amount,
        paymentMethod: 'pix',
        customer: {
          name: customer.name,
          email: customer.email,
          phone,
          document: {
            number: document,
            type: 'cpf',
          },
        },
        items: [
          {
            title: description || 'Assinatura allu',
            unitPrice: amount,
            quantity: 1,
            tangible: false,
            externalRef: reference || `ALLU-${Date.now()}`,
          },
        ],
        metadata: {
          reference: reference || `ALLU-${Date.now()}`,
          ...(tracking && typeof tracking === 'object' ? tracking : {}),
        },
        ...(postbackUrl ? { postbackUrl } : {}),
      }),
    });

    const data = await skaleRes.json();

    if (!skaleRes.ok || !data.success) {
      const errMsg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || data.error || 'Falha ao gerar cobrança Pix na SkalePay.');
      return {
        statusCode: skaleRes.status || 400,
        body: JSON.stringify({ error: errMsg }),
      };
    }

    const qrCode = (data.pix && (data.pix.qrcode || data.pix.code)) || data.qr_code;
    const qrCodeBase64 = (data.pix && (data.pix.qrcodeImage || data.pix.base64)) || data.qr_code_base64 || null;

    return {
      statusCode: 200,
      body: JSON.stringify({
        transaction_id: data.id,
        id: data.id,
        status: data.status,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        amount: data.amount || amount,
        expires_at: (data.pix && data.pix.expirationDate) || null,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno ao gerar o Pix. Tente novamente.' }) };
  }
};
