import { getAnsibleRoles } from "$lib/api/roles.client";
import type { LudusRole } from "$lib/api/types";
import { createLudusRole } from "$lib/api/types";

// Load roles from API - returns normalized role data
export async function loadRoles(): Promise<LudusRole[]> {
    try {
        const rawRoles = await getAnsibleRoles();
        return rawRoles.map(item => createLudusRole(item));
    } catch (error) {
        console.error('Error loading roles:', error);
        return [];
    }
}