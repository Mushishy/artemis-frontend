import { getLudusClient } from './api-client';
import type { InstallRoleRequest, InstallCollectionRequest, ApiResponse, LudusRole, LudusTemplate } from './types';

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

export async function getAnsibleRoles(): Promise<LudusRole[]> {
    try {
        const response = await ludusClient.get('/ansible');
        return response.data;
    } catch (error) {
        console.error('Error fetching ansible roles:', error);
        throw error;
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
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error('Error installing role from file:', error);
        throw error;
    }
}
