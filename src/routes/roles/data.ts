import { getAnsibleRoles } from "$lib/api/ludus.collections";

export interface Role {
    name: string;
    version: string;
    type: "role" | "collection";
    global: boolean;
}

// Load roles from API
export async function loadRoles(): Promise<Role[]> {
    try {
        const response = await getAnsibleRoles();
        
        return response.map(item => ({
            name: item.Name,
            version: item.Version === '(unknown version)' ? 'custom' : item.Version,
            type: item.Type as "role" | "collection",
            global: item.Global
        }));
    } catch (error) {
        console.error('Error loading roles:', error);
        return [];
    }
}