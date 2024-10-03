import { OutlineVPN } from 'outlinevpn-api';
import dotenv from 'dotenv';
import { User } from 'outlinevpn-api/dist/types';

dotenv.config();

const apiUrl = process.env.OUTLINE_API_URL || 'https://your-default-api-url.com';
const fingerprint = process.env.OUTLINE_API_FINGERPRINT || 'your-fingerprint';

const outlineVpn = new OutlineVPN({
  apiUrl: apiUrl,
  fingerprint: fingerprint,
});

// Create a new VPN key and store the Telegram user ID in the 'name' property
export async function createVpnKey(userId: string): Promise<string> {
  try {
    const key = await outlineVpn.createUser();
    await outlineVpn.renameUser(key.id, userId);
    return key.accessUrl;
  } catch (error) {
    console.error('Error creating VPN key:', error);
    throw new Error('Could not create VPN key.');
  }
}

// List all VPN keys and retrieve their 'name' properties
export async function listVpnKeys(): Promise<User[]> {
  try {
    return await outlineVpn.getUsers();
  } catch (error) {
    console.error('Error listing VPN keys:', error);
    throw new Error('Could not list VPN keys.');
  }
}

// Get traffic usage for a specific key
export async function getTrafficUsageForKey(keyId: string): Promise<number> {
  try {
    const key = await outlineVpn.getUser(keyId);
    return 123//key.usage.transferred / (1024 * 1024 * 1024);  // Convert from bytes to GB
  } catch (error) {
    console.error('Error fetching traffic usage:', error);
    throw new Error('Could not fetch traffic usage.');
  }
}
