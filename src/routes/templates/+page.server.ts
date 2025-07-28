import { loadTemplates } from './data.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const templates = await loadTemplates();
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