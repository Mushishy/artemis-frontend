import { json } from '@sveltejs/kit';
import { fetchCtfdData } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { poolId } = await request.json();
		
		if (!poolId) {
			return json({ error: 'Pool ID is required' }, { status: 400 });
		}

		await fetchCtfdData(poolId);
		
		return json({
			success: true,
			message: 'CTFd data fetched successfully'
		});
	} catch (error) {
		console.error('Error fetching CTFd data:', error);
		return json(
			{ error: 'Failed to fetch CTFd data' },
			{ status: 500 }
		);
	}
};
