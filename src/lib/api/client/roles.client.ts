import { getLudusClient } from '../settings/api-client';
import type { InstallRoleRequest, InstallCollectionRequest, ApiResponse, LudusRole, LudusTemplate } from '../types';
import { convertZipToTar } from '$lib/utils/file-conversion';

const ludusClient = getLudusClient();

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

        let processedFile = file;
        
        // Convert ZIP to TAR if needed
        if (file.name.toLowerCase().endsWith('.zip')) {
            processedFile = await convertZipToTar(file);
        }

        // Remove .tar extension from filename for API compatibility
        let filename = processedFile.name;
        if (filename.endsWith('.tar')) {
            filename = filename.slice(0, -4);
        }
        
        const modifiedFile = new File([processedFile], filename, { type: processedFile.type });
        
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
