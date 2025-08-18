# WPlace Pixel Notifier (Chrome Extension)

A simple Chrome extension that checks your WPlace pixel count and sends you a Telegram message when your pixels are full.

## Important notice

Using automation may violate WPlace Terms of Service. Use at your own risk.

## How it works

- The extension checks `https://backend.wplace.live/me` using your existing WPlace login session (no extra token).
- It runs checks on random intervals (2–5 minutes) to reduce detection patterns.
- Telegram messages are sent by a shared bot hosted on your backend (Netlify Functions).
- Each browser installation gets a random `clientId`. During linking, the backend maps `clientId -> Telegram chatId` in a key‑value store.
- When pixels are full, the extension calls your backend with `{ clientId, message }` and the backend sends the Telegram message.

## Installation (extension)

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked and select this folder.

## Using the extension

1. Make sure you are logged into `wplace.live` in this browser.
2. Click the extension icon and press Connect Telegram, then press Start in Telegram.
3. Click Test Notification to confirm the link works.
4. Leave monitoring enabled; the extension will notify you once when pixels are full for each full state.

## Backend (shared Telegram bot)

You need a small backend with three Netlify Functions:

- `telegram-link-start`: returns a deep link for your bot and stores a temporary link code for the `clientId`.
- `telegram-webhook`: receives `/start <code>` from Telegram, resolves the code, and stores `clientId -> chatId`.
- `telegram-send`: looks up `chatId` by `clientId` and calls Telegram `sendMessage` using the bot token.

Recommended stack:

- Netlify Functions for hosting
- Upstash Redis for key‑value storage (no SQL needed)

Environment variables (set in Netlify):

- `TELEGRAM_BOT_TOKEN` (from BotFather)
- `TELEGRAM_BOT_USERNAME` (bot username without @)
- `UPSTASH_REST_URL`
- `UPSTASH_REST_TOKEN`

After deploy, set the webhook once:

- `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://YOUR_SITE.netlify.app/.netlify/functions/telegram-webhook`

In the extension code, set the API base to your Netlify site URL in `background.js` and `popup.js`.

## Permissions

- `storage`: save local state
- `alarms`: schedule checks
- `https://backend.wplace.live/*`: read pixel count using your session
- `https://*.netlify.app/*`: call your Netlify Functions

## Troubleshooting

- Must be logged into WPlace in the same browser for checks to work.
- If Connect Telegram fails, verify Netlify env vars and that the webhook is set.
- If Test Notification fails, ensure you completed the Connect flow and that `clientId -> chatId` mapping exists.
- If you get repeated notifications, use Reset Notifications in the popup to clear the last sent state.

## License

MIT
