const { withCors } = require('./_cors');
const { kvSet } = require('./_kv');

exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '{"ok":false}' };
  const { clientId } = JSON.parse(event.body || '{}');
  if (!clientId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'clientId_required' }) };

  const code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  await kvSet(`link:${code}`, clientId, 600); // 10 min TTL

  const botUser = process.env.TELEGRAM_BOT_USERNAME;
  const deepLink = `https://t.me/${botUser}?start=${code}`;
  return { statusCode: 200, body: JSON.stringify({ ok: true, deepLink }) };
});