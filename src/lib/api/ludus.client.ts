import axios from 'axios';
import https from 'https';
import { ludusBaseUrl, ludusPort, ludusApiKey } from './settings';

// Configure axios with SSL certificate handling for self-signed certificates
const ludusClient = axios.create({
    baseURL: `${ludusBaseUrl}:${ludusPort}`,
    headers: {
        'X-API-KEY': ludusApiKey,
        'Content-Type': 'application/json'
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

export interface LudusTemplate {
    name: string;
    built: boolean;
}

export interface LudusRole {
    name: string;
    version: string;
    type: string;
    global: boolean;
}

// Get all templates
export async function getTemplates(): Promise<LudusTemplate[]> {
    try {
        const response = await ludusClient.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
}

// Get all ansible roles
export async function getAnsibleRoles(): Promise<LudusRole[]> {
    try {
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
    }
}
