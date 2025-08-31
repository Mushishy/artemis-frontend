import { downloadWireguardConfigs } from '$lib/api/dulus.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { poolId } = await request.json();
		
		if (!poolId) {
			return new Response('Pool ID is required', { status: 400 });
		}

		const zipBlob = await downloadWireguardConfigs(poolId);
		
		return new Response(zipBlob, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="wireguard_configs_${poolId}.zip"`
			}
		});
	} catch (error) {
		console.error('Error downloading Wireguard configs:', error);
		return new Response('Failed to download Wireguard configs', { status: 500 });
	}
};
