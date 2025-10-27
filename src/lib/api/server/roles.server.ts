import { createServerLudusClient } from '../settings/server-api-client';
import type { LudusRole, LudusTemplate, TemplateDisplay } from '../types';
import { createLudusRole } from '$lib/utils/helper';

export async function getTemplates(apiKey: string): Promise<LudusTemplate[]> {
    try {
        const ludusClient = createServerLudusClient(apiKey);
        const response = await ludusClient.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
}

export async function getTemplatesDisplay(apiKey: string): Promise<TemplateDisplay[]> {
    try {
        const response = await getTemplates(apiKey);
        
        return response.map(item => ({
            name: item.name,
            status: item.built
        }));
    } catch (error) {
        console.error('Error loading formatted templates:', error);
        return [];
    }
}

export async function getAnsibleRoles(apiKey: string): Promise<LudusRole[]> {
    try {
        const ludusClient = createServerLudusClient(apiKey);
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
    }
}

export async function getAnsibleRolesNormalized(apiKey: string): Promise<LudusRole[]> {
    try {
        const rawRoles = await getAnsibleRoles(apiKey);
        return rawRoles.map(item => createLudusRole(item));
    } catch (error) {
        console.error('Error loading normalized roles:', error);
        return [];
    }
}