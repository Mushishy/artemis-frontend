import { getLudusClient } from './api-client';
import type { LudusTemplate, LudusRole, LudusLogResponse } from './types';

/**
 * Centralized Ludus API functions
 */

const ludusClient = getLudusClient();

/**
 * Get all Ludus templates
 */
export async function getTemplates(): Promise<LudusTemplate[]> {
    try {
        const response = await ludusClient.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
}

/**
 * Get all Ansible roles
 */
export async function getAnsibleRoles(): Promise<LudusRole[]> {
    try {
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
    }
}

/**
 * Get user logs
 */
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
