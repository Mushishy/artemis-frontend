import { json } from '@sveltejs/kit';
import { downloadTopology } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { topologyId } = await request.json();
		
		if (!topologyId) {
			return json({ error: 'Topology ID is required' }, { status: 400 });
		}

		const result = await downloadTopology(topologyId);
		
		return json({
			success: true,
			data: result
		});
	} catch (error) {
		console.error('Error downloading topology:', error);
		return json(
			{ error: 'Failed to download topology' },
			{ status: 500 }
		);
	}
};
