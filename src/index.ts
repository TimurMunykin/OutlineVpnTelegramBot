import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { createVpnKey, listVpnKeys, removeVpnKey, getKeyInfo } from './vpnManager';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });

console.log('Telegram bot started');

// Main Menu with buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Choose an action:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Create VPN Key', callback_data: 'create_key' }],
        [{ text: 'List VPN Keys', callback_data: 'list_keys' }],
        [{ text: 'Remove VPN Key', callback_data: 'remove_key' }],
        [{ text: 'Get Key Info', callback_data: 'get_key_info' }]
      ]
    }
  });
});

// Handle button presses
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message?.chat.id || 0;
  const action = callbackQuery.data;

  try {
    if (action === 'create_key') {
      const vpnKey = await createVpnKey();
      bot.sendMessage(chatId, `New VPN key created: ${vpnKey}`);
    } else if (action === 'list_keys') {
      const keys = await listVpnKeys();
      if (keys.length === 0) {
        bot.sendMessage(chatId, 'No VPN keys available.');
      } else {
        bot.sendMessage(chatId, `VPN Keys:\n${keys.join('\n')}`);
      }
    } else if (action === 'remove_key') {
      bot.sendMessage(chatId, 'Please send the ID of the key to remove.');
      bot.once('message', async (msg) => {
        const keyId = msg.text || '';
        try {
          await removeVpnKey(keyId);
          bot.sendMessage(chatId, `VPN key ${keyId} removed.`);
        } catch (error) {
          bot.sendMessage(chatId, `Error removing VPN key ${keyId}.`);
        }
      });
    } else if (action === 'get_key_info') {
      bot.sendMessage(chatId, 'Please send the ID of the key to get info.');
      bot.once('message', async (msg) => {
        const keyId = msg.text || '';
        try {
          const keyInfo = await getKeyInfo(keyId);
          bot.sendMessage(chatId, `VPN Key Info:\n${JSON.stringify(keyInfo, null, 2)}`);
        } catch (error) {
          bot.sendMessage(chatId, `Error fetching info for VPN key ${keyId}.`);
        }
      });
    }
  } catch (error) {
    bot.sendMessage(chatId, 'An error occurred. Please try again.');
  }
});
