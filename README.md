# WPlace Pixel Notifier Chrome Extension

A Chrome extension that monitors your WPlace pixel count and sends Telegram notifications when your pixels are full.

## ⚠️ **IMPORTANT RISK WARNING**

**Using this extension may violate WPlace's Terms of Service and could result in:**
- Account suspension or permanent ban
- IP address blocking
- Loss of access to WPlace services

**Use at your own risk.** The developers are not responsible for any consequences.

## 🛡️ **Safety Features Built-In**

To reduce detection risk, the extension includes:
- **Random intervals** (2-5 minutes) instead of fixed 1-minute checks
- **Human-like behavior** patterns to avoid bot detection
- **Quick disable button** to stop monitoring immediately if needed
- **Session-based authentication** (no suspicious API tokens)

## Features

- 🔄 Automatic pixel monitoring with random intervals (2-5 minutes)
- 📱 Telegram notifications when pixels are full (**only once per full state**)
- ⚙️ Easy configuration through popup
- 🧪 Test button to verify setup
- 🔄 Reset button to re-enable notifications
- ⏸️ **Disable/Enable monitoring** button for quick control
- 📊 Real-time pixel count monitoring
- 🔐 **No separate auth token needed** - uses your current WPlace login session
- 💾 **Settings persist** across browser sessions

## Setup Instructions

### 1. Get Telegram Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Chat ID

1. Start a chat with your bot
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":123456789}` in the response
5. Copy the chat ID number

### 3. Configure Extension

1. **IMPORTANT**: First log into [WPlace](https://wplace.live) in this browser tab
2. Click the extension icon in Chrome
3. Enter your Telegram Bot Token
4. Enter your Telegram Chat ID
5. Click "Save Settings"
6. Click "Test Notification" to verify setup

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder
6. The extension icon should appear in your toolbar

## How It Works

- The extension runs with **random intervals** (2-5 minutes) to avoid detection
- **It uses your current WPlace login session** (no separate token needed)
- It checks your WPlace pixel count via the API
- **When pixels are full, it sends a Telegram message ONCE**
- **No more spam** - you'll only get notified once per full state
- **Reset button** allows you to re-enable notifications when needed
- **Disable button** lets you quickly stop monitoring if needed
- You can manually test the notification system

## Important Notes

- **You must be logged into WPlace** in the same browser tab for the extension to work
- The extension automatically uses your browser's cookies/session
- No need to manage separate authentication tokens
- If you log out of WPlace, the extension will stop working until you log back in
- **Settings are saved permanently** - no need to re-enter bot token/chat ID when you restart browser
- **Notifications are sent only once** when pixels become full, not every minute
- **Use the Disable button** if you're concerned about detection

## Smart Notification System

The extension is designed to prevent notification spam:

- ✅ **Checks with random intervals** - monitors your pixel count continuously (2-5 min)
- ✅ **Notifies only once** - sends message when pixels first become full
- ✅ **Tracks state** - remembers if you've been notified for current pixel count
- ✅ **Auto-reset** - when pixels drop below max, resets notification state
- ✅ **Manual reset** - use "Reset Notifications" button to force re-notification
- ✅ **Quick disable** - stop monitoring immediately if needed

## Risk Mitigation

### **What the extension does to reduce risk:**
- **Random timing** - Not predictable like every 60 seconds
- **Session-based** - Uses your normal login, not suspicious API tokens
- **Human-like patterns** - Varies intervals naturally
- **Quick disable** - Stop monitoring instantly if you're concerned

### **What you can do to reduce risk:**
- **Use sparingly** - Don't run 24/7 if possible
- **Monitor manually** - Use the disable button when not needed
- **Check WPlace ToS** - Understand their policies on automation
- **Use at your own risk** - Be aware of potential consequences

## Troubleshooting

### Extension not working?
- **Make sure you're logged into WPlace** in this browser tab
- Check that bot token and chat ID are saved correctly
- Use the "Test Notification" button to verify Telegram setup
- Check Chrome DevTools console for error messages

### Telegram errors?
- Verify your bot token is correct
- Make sure you've started a chat with your bot
- Check that the chat ID is correct
- Ensure your bot hasn't been blocked

### WPlace API errors?
- **You must be logged into WPlace** in the same browser tab
- Try refreshing the WPlace page and logging in again
- Check that you're logged into the correct account
- The extension will show "Not logged into WPlace" if authentication fails

### Notifications not sending?
- Check that your pixels are actually full
- Verify the extension is running (check background page)
- Look for errors in the console logs
- Ensure you're logged into WPlace
- **Use "Reset Notifications" button** if you want to be notified again

### Getting too many notifications?
- The extension is designed to send only one notification per full state
- If you're getting repeated notifications, there might be a bug
- Check the console logs for any errors

### Concerned about detection?
- **Use the "Disable Monitoring" button** to stop immediately
- The extension will stop making API calls to WPlace
- Re-enable when you're ready to monitor again

## File Structure

- `manifest.json` - Extension configuration
- `background.js` - Background service worker
- `popup.html/js` - Extension popup interface
- `options.html/js` - Options page (alternative configuration)

## Permissions

- `storage` - Save your configuration and notification state
- `alarms` - Schedule periodic checks
- `https://backend.wplace.live/*` - Access WPlace API (uses your session)
- `https://api.telegram.org/*` - Send Telegram messages

## Support

If you encounter issues:
1. **Ensure you're logged into WPlace** in the same browser tab
2. Check the console logs for error messages
3. Verify your Telegram bot settings are correct
4. Test the notification manually
5. Check that the extension is enabled and running
6. Use the "Reset Notifications" button if needed
7. **Use "Disable Monitoring" if concerned about detection**

## Legal Disclaimer

This extension is provided "as is" without any warranties. Users are responsible for:
- Complying with WPlace's Terms of Service
- Understanding the risks of using automated tools
- Any consequences resulting from use of this extension

**Use at your own risk.**

## License

This project is open source and available under the MIT License.
