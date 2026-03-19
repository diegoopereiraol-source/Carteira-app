// api/history.js — Historical price data via brapi.dev
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { ticker, range = '1y', interval = '1wk' } = req.query;
  if (!ticker) return res.status(400).json({ error: 'ticker required' });

  const token = process.env.BRAPI_TOKEN || '';
  const tokenParam = token ? `&token=${token}` : '';

  try {
    const url = `https://brapi.dev/api/quote/${ticker}?range=${range}&interval=${interval}&fundamental=false${tokenParam}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'carteira-app/1.0' }
    });

    if (!response.ok) throw new Error(`brapi ${response.status}`);
    const data = await response.json();

    const result = (data.results || [])[0];
    if (!result) throw new Error('no data');

    // Extract historical prices
    const hist = result.historicalDataPrice || [];
    const prices = hist
      .filter(h => h && h.close && h.close > 0)
      .map(h => ({ date: h.date, close: h.close, open: h.open, high: h.high, low: h.low, volume: h.volume }));

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
    res.status(200).json({ ticker, range, interval, prices });

  } catch (err) {
    res.status(500).json({ error: err.message, prices: [] });
  }
}
