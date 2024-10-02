import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { createVpnKey, listVpnKeys, removeVpnKey, getKeyInfo } from './vpnManager';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });

console.log('Telegram bot started');

// Handle '/addkey' command
bot.onText(/\/addkey/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const vpnKey = await createVpnKey();
    bot.sendMessage(chatId, `New VPN key created: ${vpnKey}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Error creating VPN key.');
  }
});

// Handle '/listkeys' command
bot.onText(/\/listkeys/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const keys = await listVpnKeys();
    if (keys.length === 0) {
      bot.sendMessage(chatId, 'No VPN keys available.');
    } else {
      bot.sendMessage(chatId, `VPN Keys:\n${keys.join('\n')}`);
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Error listing VPN keys.');
  }
});

// Handle '/removekey <keyId>' command
bot.onText(/\/removekey (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const keyId = match?.[1];  // Extract the keyId from the command
  if (!keyId) {
    bot.sendMessage(chatId, 'Error: No keyId provided.');
    return;
  }
  try {
    await removeVpnKey(keyId);
    bot.sendMessage(chatId, `VPN key ${keyId} removed.`);
  } catch (error) {
    bot.sendMessage(chatId, `Error removing VPN key ${keyId}.`);
  }
});

// Handle '/keyinfo <keyId>' command
bot.onText(/\/keyinfo (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const keyId = match?.[1];  // Extract the keyId from the command
  if (!keyId) {
    bot.sendMessage(chatId, 'Error: No keyId provided.');
    return;
  }
  try {
    const info = await getKeyInfo(keyId);
    bot.sendMessage(chatId, `VPN Key Info:\n${JSON.stringify(info, null, 2)}`);
  } catch (error) {
    bot.sendMessage(chatId, `Error fetching info for VPN key ${keyId}.`);
  }
});
