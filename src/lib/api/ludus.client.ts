import axios from 'axios';
import https from 'https';
import { ludusBaseUrl, ludusPort, ludusApiKey } from './settings';

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

export interface LudusLogResponse {
    result: string;
    cursor: number;
}

export async function getUserLogs(userId: string, tail: number = 100, resumeline: number = 0): Promise<LudusLogResponse> {
    try {
        const response = await ludusClient.get('/range/logs', {
            params: {
                userID: userId,
                tail: tail,
                resumeline: resumeline
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user logs:', error);
        throw error;
    }
}

export async function getTemplates(): Promise<LudusTemplate[]> {
    try {
        const response = await ludusClient.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
}

export async function getAnsibleRoles(): Promise<LudusRole[]> {
    try {
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
    }
}
