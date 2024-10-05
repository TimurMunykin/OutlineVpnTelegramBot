//index.ts
import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";
import {
  createVpnKey,
  getTrafficUsageForKey,
  listVpnKeys,
  removeVpnKey,
} from "./vpnManager";

const token = process.env.TELEGRAM_BOT_TOKEN || "";
const bot = new TelegramBot(token, { polling: true });

const ALLOWED_CHAT_ID = process.env.ALLOWED_CHAT_ID;
const MAX_TRAFFIC_LIMIT = 200; // Total traffic limit (in GB)
const ADMIN_USER_ID = Number(process.env.ADMIN_USER_ID) || 123456789; // Replace with the actual admin ID
let totalTrafficUsed = 0; // Track traffic used by all users

console.log("Telegram bot started");

// Check if the user is in the allowed group
async function isUserInGroup(chatId: number, userId: number): Promise<boolean> {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    return chatMember.status !== "left" && chatMember.status !== "kicked";
  } catch (error) {
    console.error("Error checking chat membership:", error);
    return false;
  }
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const username = msg.from?.username || "User";

  showMainMenu(chatId, userId, username);
});

// Main menu
bot.onText(/\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const username = msg.from?.username || "User";

  showMainMenu(chatId, userId, username);
});

function showMainMenu(chatId: number, userId: number, username: string) {
  let buttons = [
    [{ text: "🔑 Get VPN Key" }],
    [{ text: "📊 Check Traffic" }],
    [{ text: "ℹ️ How to use key" }],
  ];

  // If the user is the admin, show additional admin buttons
  if (userId === ADMIN_USER_ID) {
    buttons.push([{ text: "🔑 List All VPN Keys (Admin)" }]);
  }

  bot.sendMessage(chatId, `📋 Main Menu:`, {
    reply_markup: {
      keyboard: buttons,
      resize_keyboard: true, // Resize the keyboard to fit the user's screen
      one_time_keyboard: false, // Make the keyboard persistent
    },
  });
}

// Handle button clicks (messages)
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id || 0;
  const username = msg.from?.username || "User";
  const text = msg.text;

  if (text === "🔑 Get VPN Key") {
    await assignVpnKey(userId, username, chatId);
    showMainMenu(chatId, userId, username);
  } else if (text === "📊 Check Traffic") {
    const existingKeys = await listVpnKeys();
    const userKey = existingKeys.find(
      (key) => key.name === `${username}_${userId}`
    );

    if (userKey) {
      const trafficUsage = await getTrafficUsageForKey(userKey.id);
      bot.sendMessage(chatId, `📊 Your traffic usage: ${trafficUsage} GB`);
    } else {
      bot.sendMessage(chatId, "You don’t have a VPN key yet.");
    }
    showMainMenu(chatId, userId, username);
  } else if (
    text === "🔑 List All VPN Keys (Admin)" &&
    userId === ADMIN_USER_ID
  ) {
    const allKeys = await listVpnKeys();
    bot.sendMessage(chatId, "🔑 List of all VPN keys:", {
      reply_markup: {
        inline_keyboard: allKeys.map((key) => [
          {
            text: `❌ Remove Key: ${key.name}`,
            callback_data: `remove_key_${key.id}`,
          },
        ]),
      },
    });
  } else if (text === "ℹ️ How to use key") {
    const existingKeys = await listVpnKeys();
    const userKey = existingKeys.find(
      (key) => key.name === `${username}_${userId}`
    );

    if (userKey) {
      const infoMessage = `Use this server to safely access the open internet:

1) Download and install the Outline app for your device:

- iOS: https://itunes.apple.com/app/outline-app/id1356177741
- MacOS: https://itunes.apple.com/app/outline-app/id1356178125
- Windows: https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe
- Linux: https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage
- Android: https://play.google.com/store/apps/details?id=org.outline.android.client
- Android alternative link: https://s3.amazonaws.com/outline-releases/client/android/stable/Outline-Client.apk

2) Here is your access key:
\`\`\`
${userKey.accessUrl}
\`\`\`
Please, copy this access key.

3) Open the Outline client app. If your access key is auto-detected, tap "Connect" and proceed. If your access key is not auto-detected, then paste it in the field, then tap "Connect" and proceed.

You're ready to use the open internet! To make sure you successfully connected to the server, try searching for "what is my ip" on Google Search. The IP address shown in Google should match the IP address in the Outline client.`;

      bot.sendMessage(chatId, infoMessage, { parse_mode: "Markdown" });
    } else {
      bot.sendMessage(chatId, "You don’t have a VPN key yet.");
    }
    showMainMenu(chatId, userId, username);
  }
});

// Assign VPN key to a user and store their Telegram user ID in the key's name
async function assignVpnKey(userId: number, username: string, chatId: number) {
  const vpnKeyId = `${username}_${userId}`;
  if (!(await isUserInGroup(Number(ALLOWED_CHAT_ID), userId))) {
    bot.sendMessage(chatId, "🚫 You are not part of the allowed group.");
    return;
  }

  const existingKeys = await listVpnKeys();
  const existingKey = existingKeys.find((key) => key.name === vpnKeyId);

  if (existingKey) {
    bot.sendMessage(
      chatId,
      `🔑 You already have a key:

\`\`\`
${existingKey.accessUrl}
\`\`\`
Please, copy this access key.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if (totalTrafficUsed >= MAX_TRAFFIC_LIMIT) {
    bot.sendMessage(
      chatId,
      "🚫 The total traffic limit for this month has been reached."
    );
    return;
  }

  try {
    const vpnKey = await createVpnKey(vpnKeyId);
    bot.sendMessage(
      chatId,
      `✅ Your VPN key has been created:

\`\`\`
${vpnKey}
\`\`\`
Please, copy this access key.`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    bot.sendMessage(chatId, "⚠️ Error creating VPN key.");
    console.error(error);
  }

  showMainMenu(chatId, userId, username);
}

// Handle callback queries (e.g., remove keys)
bot.on("callback_query", async (callbackQuery) => {
  const action = callbackQuery.data;
  const chatId = callbackQuery.message?.chat.id || 0;
  const userId = callbackQuery.from.id;

  if (action?.startsWith("remove_key_") && userId === ADMIN_USER_ID) {
    const keyId = action.replace("remove_key_", "");
    await removeVpnKey(keyId);
    bot.sendMessage(chatId, `✅ VPN key ${keyId} has been removed.`);
    showMainMenu(chatId, userId, callbackQuery.from.username || "Admin");
  }
});
