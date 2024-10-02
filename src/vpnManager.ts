import { OutlineVPN } from 'outlinevpn-api';
import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.OUTLINE_API_URL || 'https://your-default-api-url.com';
const fingerprint = process.env.OUTLINE_API_FINGERPRINT || 'your-fingerprint';

const outlineVpn = new OutlineVPN({
  apiUrl: apiUrl,
  fingerprint: fingerprint,
});

// Create a new VPN key
export async function createVpnKey(): Promise<string> {
  try {
    const key = await outlineVpn.createUser();
    return key.accessUrl;
  } catch (error) {
    console.error('Error creating VPN key:', error);
    throw new Error('Could not create VPN key.');
  }
}

// List all VPN keys
export async function listVpnKeys(): Promise<string[]> {
  try {
    const keys = await outlineVpn.getUsers();
    return keys.map((key: any) => `${key.id}: ${key.accessUrl}`);
  } catch (error) {
    console.error('Error listing VPN keys:', error);
    throw new Error('Could not list VPN keys.');
  }
}

// Remove a VPN key
export async function removeVpnKey(keyId: string): Promise<void> {
  try {
    await outlineVpn.deleteUser(keyId);
  } catch (error) {
    console.error(`Error removing VPN key ${keyId}:`, error);
    throw new Error(`Could not remove VPN key ${keyId}.`);
  }
}

// Get info about a specific VPN key
export async function getKeyInfo(keyId: string): Promise<any> {
  try {
    const keyInfo = await outlineVpn.getUser(keyId);
    return keyInfo;
  } catch (error) {
    console.error(`Error fetching info for VPN key ${keyId}:`, error);
    throw new Error(`Could not fetch info for VPN key ${keyId}.`);
  }
}
