// edgeConfig.js
import { get } from '@vercel/edge-config';
export async function getEdgeConfigValue(key) {
    try {
        const value = await get(key);
        return value;
    } catch (error) {
        console.error(`Failed to get key "${key}" from Edge Config`, error);
        return null;
    }
}
