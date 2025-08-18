const { withCors } = require('./_cors');
const { kvGet } = require('./_kv');

exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '{"ok":false}' };
  const { clientId } = JSON.parse(event.body || '{}');
  if (!clientId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'clientId_required' }) };

  const chatId = await kvGet(`chat:${clientId}`);
  const connected = Boolean(chatId);
  return { statusCode: 200, body: JSON.stringify({ ok: true, connected, chatId: connected ? String(chatId) : null }) };
});


