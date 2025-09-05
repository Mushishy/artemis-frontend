import { getTemplates } from "$lib/api/roles.client";

export interface Template {
    name: string;
    status: boolean;
}

// Load templates from API
export async function loadTemplates(): Promise<Template[]> {
    try {
        const response = await getTemplates();
        
        return response.map(item => ({
            name: item.name,
            status: item.built
        }));
    } catch (error) {
        console.error('Error loading templates:', error);
        return [];
    }
}