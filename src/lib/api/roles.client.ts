import { getLudusClient } from './api-client';
import type { InstallRoleRequest, InstallCollectionRequest, ApiResponse, LudusRole, LudusTemplate, TemplateDisplay } from './types';
import { createLudusRole } from './types';

const ludusClient = getLudusClient();

// ============================================================================
// TEMPLATES & ROLES RETRIEVAL
// ============================================================================

export async function getTemplates(): Promise<LudusTemplate[]> {
    try {
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

// ============================================================================
// ROLES & COLLECTIONS INSTALLATION
// ============================================================================

export async function installRole(request: InstallRoleRequest): Promise<ApiResponse> {
    try {
        const response = await ludusClient.post('/ansible/role', request);
        return response.data;
    } catch (error) {
        console.error('Error installing role:', error);
        throw error;
    }
}

export async function installCollection(request: InstallCollectionRequest): Promise<ApiResponse> {
    try {
        const response = await ludusClient.post('/ansible/collection', request);
        return response.data;
    } catch (error) {
        console.error('Error installing collection:', error);
        throw error;
    }
}

export async function installRoleFromFile(file: File, force: boolean = false, global: boolean = true): Promise<ApiResponse> {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Remove .tar extension from filename for API compatibility
        let filename = file.name;
        if (filename.endsWith('.tar')) {
            filename = filename.slice(0, -4);
        }
        
        const modifiedFile = new File([file], filename, { type: file.type });
        
        const formData = new FormData();
        formData.append('file', modifiedFile);
        formData.append('force', force.toString());
        formData.append('global', global.toString());

        const response = await ludusClient.put('/ansible/role/fromtar', formData, {
            headers: { 
                // Don't set Content-Type - let axios/browser set it with boundary
                'Content-Type': undefined 
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error installing role from file:', error);
        throw error;
    }
}
