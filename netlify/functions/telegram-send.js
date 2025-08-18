const { withCors } = require('./_cors');
const { kvGet } = require('./_kv');

exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '{"ok":false}' };
  const { clientId, message } = JSON.parse(event.body || '{}');
  if (!clientId || !message) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'clientId_and_message_required' }) };

  const chatId = await kvGet(`chat:${clientId}`);
  if (!chatId) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'not_linked' }) };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message })
  }).then(r => r.json());

  if (!resp.ok) return { statusCode: 500, body: JSON.stringify({ ok: false, error: resp.description }) };
  return { statusCode: 200, body: '{"ok":true}' };
});