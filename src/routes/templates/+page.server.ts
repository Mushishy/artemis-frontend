import { templates } from './data.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		templates
	};
};