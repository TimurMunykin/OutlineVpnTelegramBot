import TelegramBot from 'node-telegram-bot-api';
import { createVpnKey } from './vpnManager';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined');
}
const bot = new TelegramBot(token, { polling: true });

// Respond to '/addkey' command
bot.onText(/\/addkey/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const vpnKey = await createVpnKey();
    bot.sendMessage(chatId, `New VPN key created: ${vpnKey}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Error creating VPN key');
  }
});
