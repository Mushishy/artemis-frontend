/**
 * Server-side roles/templates API functions
 * Uses server-api-client instead of the universal api-client
 */

import { getServerLudusClient } from './server-api-client';
import type { LudusRole, LudusTemplate, TemplateDisplay } from './types';
import { createLudusRole } from './types';

// ============================================================================
// TEMPLATES & ROLES RETRIEVAL
// ============================================================================

export async function getTemplates(): Promise<LudusTemplate[]> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get('/templates');
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
}

// Get formatted templates for display
export async function getTemplatesDisplay(): Promise<TemplateDisplay[]> {
    try {
        const response = await getTemplates();
        
        return response.map(item => ({
            name: item.name,
            status: item.built
        }));
    } catch (error) {
        console.error('Error loading formatted templates:', error);
        return [];
    }
}

export async function getAnsibleRoles(): Promise<LudusRole[]> {
    try {
        const ludusClient = getServerLudusClient();
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
    }
}

// Get normalized ansible roles for display
export async function getAnsibleRolesNormalized(): Promise<LudusRole[]> {
    try {
        const rawRoles = await getAnsibleRoles();
        return rawRoles.map(item => createLudusRole(item));
    } catch (error) {
        console.error('Error loading normalized roles:', error);
        return [];
    }
}