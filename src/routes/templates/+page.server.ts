import { getTemplatesDisplay } from '$lib/api/server/roles.server';
import { requireAuth } from '$lib/utils/auth-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const apiKey = await requireAuth(event);
	
	try {
		const templates = await getTemplatesDisplay(apiKey);
		return {
			templates
		};
	} catch (error) {
		console.error('Error:', error);
		return {
			templates: []
		};
	}
};