import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { createVpnKey, getTrafficUsageForKey, listVpnKeys } from './vpnManager';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });

const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID;
const MAX_TRAFFIC_LIMIT = 200;  // Total traffic limit (in GB)
let totalTrafficUsed = 0;  // Track traffic used by all users

console.log('Telegram bot started');

// Check if the user is in the allowed group
async function isUserInGroup(chatId: number, userId: number): Promise<boolean> {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return chatMember.status !== 'left' && chatMember.status !== 'kicked';
  } catch (error) {
    console.error('Error checking chat membership:', error);
    return false;
  }
}

// Assign VPN key to a user and store their Telegram user ID in the key's name
async function assignVpnKey(userId: number, username: string, chatId: number) {
  const vpnKeyId = `${username}_${userId}`;
  if (!await isUserInGroup(Number(ALLOWED_CHAT_ID), userId)) {
    bot.sendMessage(chatId, 'You are not part of the allowed group.');
    return;
  }

  // Check if user already has a key by searching for their user ID in the VPN keys' names
  const existingKeys = await listVpnKeys();
  const existingKey = existingKeys.find(key => key.name === vpnKeyId);

  if (existingKey) {
    bot.sendMessage(chatId, `You already have a key: ${existingKey.accessUrl}`);
    return;
  }

  // Check if the total traffic limit has been reached
  if (totalTrafficUsed >= MAX_TRAFFIC_LIMIT) {
    bot.sendMessage(chatId, 'The total traffic limit for this month has been reached.');
    return;
  }

  // Create a new VPN key with the user's Telegram ID as the name
  try {
    const vpnKey = await createVpnKey(vpnKeyId);  // Use userId as the 'name'
    bot.sendMessage(chatId, `Your VPN key: ${vpnKey}`);
  } catch (error) {
    bot.sendMessage(chatId, 'Error creating VPN key.');
    console.error(error);
  }
}

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const username = msg.from?.username || 'Unknown';

  if (msg.chat.type === 'private') {
    // Ignore private messages if the user is not in the group
    if (!await isUserInGroup(Number(ALLOWED_CHAT_ID), userId)) {
      return;
    }
  }

  // When a user asks for a key
  if (msg.text?.toLowerCase() === '/getkey') {
    await assignVpnKey(userId, username, chatId);
  }
});
