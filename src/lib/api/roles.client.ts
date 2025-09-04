import { getLudusClient } from './api-client';
import type { InstallRoleRequest, InstallCollectionRequest, ApiResponse } from './types';

// Get the Ludus client
const rolesLudusClient = getLudusClient();

// Install a role via client-side API call
export async function installRole(request: InstallRoleRequest): Promise<ApiResponse> {
    try {
        const response = await rolesLudusClient.post('/ansible/role', request);
        return response.data;
    } catch (error) {
        console.error('Error installing role:', error);
        throw error;
    }
}

// Install a collection via client-side API call
export async function installCollection(request: InstallCollectionRequest): Promise<ApiResponse> {
    try {
        const response = await rolesLudusClient.post('/ansible/collection', request);
        return response.data;
    } catch (error) {
        console.error('Error installing collection:', error);
        throw error;
    }
}

// Install role from file via client-side API call
export async function installRoleFromFile(file: File, force: boolean = false, global: boolean = true): Promise<ApiResponse> {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Remove .tar extension from filename
        let filename = file.name;
        if (filename.endsWith('.tar')) {
            filename = filename.slice(0, -4);
        }
        
        // Create a new file with the modified name
        const modifiedFile = new File([file], filename, { type: file.type });
        
        const formData = new FormData();
        formData.append('file', modifiedFile);
        formData.append('force', force.toString());
        formData.append('global', global.toString());

        const response = await rolesLudusClient.put('/ansible/role/fromtar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error installing role from file:', error);
        throw error;
    }
}
