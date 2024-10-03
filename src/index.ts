import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import { createVpnKey, getTrafficUsageForKey, listVpnKeys, removeVpnKey } from './vpnManager';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new TelegramBot(token, { polling: true });

const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID;
const MAX_TRAFFIC_LIMIT = 200;  // Total traffic limit (in GB)
const ADMIN_USER_ID = Number(process.env.ADMIN_USER_ID) || 123456789;  // Replace with the actual admin ID
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

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const username = msg.from?.username || 'User';

  let buttons = [
    [{ text: '🔑 Get VPN Key', callback_data: 'get_key' }],
    [{ text: '📊 Check Traffic', callback_data: 'check_traffic' }],
  ];

  // If the user is the admin, show additional admin buttons
  console.log(userId)
  if (userId === ADMIN_USER_ID) {
    buttons.push([{ text: '🔑 List All VPN Keys (Admin)', callback_data: 'list_all_keys' }]);
  }

  bot.sendMessage(chatId, `👋 Welcome, ${username}!\nI’m here to help you manage your VPN keys.`, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
});


// Main menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📋 Main Menu:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔑 Get VPN Key', callback_data: 'get_key' }],
        [{ text: '📊 Check Traffic', callback_data: 'check_traffic' }],
        [{ text: '🛑 Remove Key', callback_data: 'remove_key' }]
      ],
    },
  });
});

// Handle button clicks (callback queries)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message?.chat.id || 0;
  const userId = callbackQuery.from.id;
  const username = callbackQuery.from.username || 'User';
  const action = callbackQuery.data;  // Button's callback data

  if (action === 'get_key') {
    await assignVpnKey(userId, username, chatId);
  } else if (action === 'check_traffic') {
    const existingKeys = await listVpnKeys();
    const userKey = existingKeys.find(key => key.name === `${username}_${userId}`);

    if (userKey) {
      const trafficUsage = await getTrafficUsageForKey(userKey.id);
      bot.sendMessage(chatId, `📊 Your traffic usage: ${trafficUsage} GB`);
    } else {
      bot.sendMessage(chatId, 'You don’t have a VPN key yet.');
    }
  } else if (action === 'list_all_keys' && userId === ADMIN_USER_ID) {
    // Only the admin can trigger this action
    const allKeys = await listVpnKeys();
    const keyButtons = allKeys.map(key => {
      return [{ text: `❌ Remove Key: ${key.name}`, callback_data: `remove_key_${key.id}` }];
    });

    bot.sendMessage(chatId, '🔑 List of all VPN keys:', {
      reply_markup: {
        inline_keyboard: keyButtons,
      },
    });
  } else if (action !== undefined && action.startsWith('remove_key_') && userId === ADMIN_USER_ID) {
    const keyId = action.replace('remove_key_', '');
    await removeVpnKey(keyId);
    bot.sendMessage(chatId, `✅ VPN key ${keyId} has been removed.`);
  }
});

// Assign VPN key to a user and store their Telegram user ID in the key's name
async function assignVpnKey(userId: number, username: string, chatId: number) {
  const vpnKeyId = `${username}_${userId}`;
  if (!await isUserInGroup(Number(ALLOWED_CHAT_ID), userId)) {
    bot.sendMessage(chatId, '🚫 You are not part of the allowed group.');
    return;
  }

  const existingKeys = await listVpnKeys();
  const existingKey = existingKeys.find(key => key.name === vpnKeyId);

  if (existingKey) {
    bot.sendMessage(chatId, `🔑 You already have a key:`);
    bot.sendMessage(chatId, `\`\`\`\n${existingKey.accessUrl}\n\`\`\``, { parse_mode: 'Markdown' });
    return;
  }

  if (totalTrafficUsed >= MAX_TRAFFIC_LIMIT) {
    bot.sendMessage(chatId, '🚫 The total traffic limit for this month has been reached.');
    return;
  }

  try {
    const vpnKey = await createVpnKey(vpnKeyId);
    bot.sendMessage(chatId, `✅ Your VPN key has been created:`);
    bot.sendMessage(chatId, `\`\`\`\n${vpnKey}\n\`\`\``, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '⚠️ Error creating VPN key.');
    console.error(error);
  }
}
