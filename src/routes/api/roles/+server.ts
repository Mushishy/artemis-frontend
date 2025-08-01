import { installRole, type InstallRoleRequest } from '$lib/api/roles.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const data: InstallRoleRequest = await request.json();
        
        if (data.action === 'install') {
            const result = await installRole(data);
            return json(result);
        } else {
            return json({ error: 'Invalid action. Only "install" is supported' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error with role operation:', error);
        return json({ error: 'Failed to perform role operation' }, { status: 500 });
    }
};
