import { installRoleFromFile } from '$lib/api/roles.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const force = formData.get('force') === 'true';
        const global = formData.get('global') === 'true';
        
        if (!file) {
            return json({ error: 'File is required' }, { status: 400 });
        }
        
        const result = await installRoleFromFile(file, force, global);
        return json(result);
    } catch (error) {
        console.error('Error installing role from file:', error);
        return json({ error: 'Failed to install role from file' }, { status: 500 });
    }
};
