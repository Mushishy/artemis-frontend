import { getTemplatesDisplay } from '$lib/api/roles.client';
import type { PageServerLoad } from './$types';
import type { TemplateDisplay } from '$lib/api/types';

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