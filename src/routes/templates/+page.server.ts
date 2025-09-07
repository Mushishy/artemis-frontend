import { getTemplatesDisplay } from '$lib/api/roles.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const templates = await getTemplatesDisplay();
		return {
			templates
		};
	} catch (error) {
		console.error('Error loading templates:', error);
		return {
			templates: []
		};
	}
};