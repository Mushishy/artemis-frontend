import { json } from '@sveltejs/kit';
import { downloadCtfdLogins } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { poolId } = await request.json();
		
		if (!poolId) {
			return json({ error: 'Pool ID is required' }, { status: 400 });
		}

		const loginData = await downloadCtfdLogins(poolId);
		
		return json({
			success: true,
			data: loginData
		});
	} catch (error) {
		console.error('Error downloading CTFd logins:', error);
		return json(
			{ error: 'Failed to download CTFd logins' },
			{ status: 500 }
		);
	}
};
