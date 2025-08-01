import axios from 'axios';

// Client that calls our own API routes (which then call ludus server-side)
const apiClient = axios.create({
    baseURL: '',  // Use same origin
    headers: {
        'Content-Type': 'application/json'
    }
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

// Install a role
export async function installRole(request: InstallRoleRequest): Promise<ApiResponse> {
    try {
        const response = await apiClient.post('/api/roles', request);
        return response.data;
    } catch (error) {
        console.error('Error installing role:', error);
        throw new Error(`Failed to install role: ${error}`);
    }
}

// Install a collection
export async function installCollection(request: InstallCollectionRequest): Promise<ApiResponse> {
    try {
        const response = await apiClient.post('/api/roles/collection', request);
        return response.data;
    } catch (error) {
        console.error('Error installing collection:', error);
        throw new Error(`Failed to install collection: ${error}`);
    }
}

// Install role from file
export async function installRoleFromFile(file: File, force: boolean = false, global: boolean = true): Promise<ApiResponse> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('force', force.toString());
        formData.append('global', global.toString());

        const response = await apiClient.put('/api/roles/fromtar', formData, {
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
