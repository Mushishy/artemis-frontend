import axios from 'axios';
import https from 'https';
import { ludusBaseUrl, ludusPort, ludusApiKey } from './settings';

// Configure axios with SSL certificate handling for self-signed certificates (server-side only)
const rolesServerClient = axios.create({
    baseURL: `${ludusBaseUrl}:${ludusPort}`,
    headers: {
        'X-API-KEY': ludusApiKey,
        'Content-Type': 'application/json'
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

export interface InstallRoleRequest {
    role: string;
    version: string;
    force: boolean;
    action: 'install';
    global: boolean;
}

export interface InstallCollectionRequest {
    collection: string;
    version: string;
    force: boolean;
}

export interface ApiResponse {
    message: string;
    success: boolean;
}

// Install a role (server-side only)
export async function installRole(request: InstallRoleRequest): Promise<ApiResponse> {
    try {
        const response = await rolesServerClient.post('/ansible/role', request);
        return response.data;
    } catch (error) {
        console.error('Error installing role:', error);
        throw new Error(`Failed to install role: ${error}`);
    }
}

// Install a collection (server-side only)
export async function installCollection(request: InstallCollectionRequest): Promise<ApiResponse> {
    try {
        const response = await rolesServerClient.post('/ansible/collection', request);
        return response.data;
    } catch (error) {
        console.error('Error installing collection:', error);
        throw new Error(`Failed to install collection: ${error}`);
    }
}

// Install role from files (server-side only)
export async function installRoleFromFile(file: File, force: boolean = false, global: boolean = true): Promise<ApiResponse> {
    try {
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

        const response = await rolesServerClient.put('/ansible/role/fromtar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error installing role from file:', error);
        throw new Error(`Failed to install role from file: ${error}`);
    }
}
