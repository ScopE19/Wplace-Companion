const { kvGet, kvDel, kvSet } = require('./_kv');

exports.handler = async (event) => {
  const update = JSON.parse(event.body || '{}');
  const msg = update.message;
  if (!msg) return json200();

  const text = (msg.text || '').trim();
  const chatId = String(msg.chat?.id || '');
  if (!chatId) return json200();

  if (text.startsWith('/start ')) {
    const code = text.split(/\s+/)[1];
    if (code) {
      const clientId = await kvGet(`link:${code}`);
      if (clientId) {
        await kvDel(`link:${code}`);
        await kvSet(`chat:${clientId}`, chatId);
        await sendTG(chatId, '✅ Telegram connected.');
      } else {
        await sendTG(chatId, '❌ Link code invalid or expired.');
      }
    }
  }
  return json200();
};

async function sendTG(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
function json200() { return { statusCode: 200, body: '{"ok":true}' }; }