// api/quotes.js — Vercel Serverless Function
// Proxy para brapi.dev com token configurado via variável de ambiente
// Resolve o problema de CORS do navegador

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { tickers } = req.query;
  if (!tickers) {
    return res.status(400).json({ error: 'tickers param required' });
  }

  // Token configurado em Environment Variables na Vercel
  // Se não tiver token, usa sem token (rate limit menor mas funciona)
  const token = process.env.BRAPI_TOKEN || '';
  const tokenParam = token ? `&token=${token}` : '';

  try {
    const url = `https://brapi.dev/api/quote/${tickers}?fundamental=false${tokenParam}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'carteira-app/1.0' }
    });

    if (!response.ok) {
      throw new Error(`brapi returned ${response.status}`);
    }

    const data = await response.json();

    // Cache por 5 minutos no edge
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message, results: [] });
  }
}
