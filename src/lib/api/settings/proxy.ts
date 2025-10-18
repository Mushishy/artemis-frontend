import { json, type RequestHandler } from '@sveltejs/kit';
import axios from 'axios';
import https from 'https';

// Create axios instance with SSL verification disabled
const httpsAxios = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false
	})
});

export function createProxyHandler(targetUrl: string) {
	return async function handleProxy(params: Record<string, string>, url: URL, request: Request, method: string) {
		const path = params.path || '';
		const proxyUrl = `${targetUrl}/${path}${url.search}`;

		const headers: Record<string, string> = {};
		for (const [key, value] of request.headers.entries()) {
			if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
				headers[key] = value;
			}
		}

		try {
			const axiosConfig = {
				method: method.toLowerCase() as any,
				url: proxyUrl,
				headers,
				data: method !== 'GET' && method !== 'HEAD' ? await request.arrayBuffer() : undefined,
				validateStatus: () => true, // Don't throw on any status code
				responseType: 'text' as const,
			};

			const response = await httpsAxios(axiosConfig);

			const responseHeaders = new Headers();
			Object.entries(response.headers).forEach(([key, value]) => {
				if (!['content-encoding', 'content-length'].includes(key.toLowerCase()) && typeof value === 'string') {
					responseHeaders.set(key, value);
				}
			});

			// Handle responses that must not have a body (204, 304, etc.)
			const statusRequiresNoBody = response.status === 204 || 
										 response.status === 304 || 
										 response.status === 101;

			if (statusRequiresNoBody) {
				return new Response(null, {
					status: response.status,
					statusText: response.statusText,
					headers: responseHeaders
				});
			}

			// For all other responses, return the data
			return new Response(response.data, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders
			});
		} catch (error) {
			console.error('Proxy request failed:', error);
			return json({ error: 'Proxy request failed' }, { status: 500 });
		}
	};
}

export function createProxyHandlers(targetUrl: string) {
	const handleProxy = createProxyHandler(targetUrl);
	
	return {
		GET: (async ({ params, url, request }) => await handleProxy(params, url, request, 'GET')) as RequestHandler,
		POST: (async ({ params, url, request }) => await handleProxy(params, url, request, 'POST')) as RequestHandler,
		PUT: (async ({ params, url, request }) => await handleProxy(params, url, request, 'PUT')) as RequestHandler,
		DELETE: (async ({ params, url, request }) => await handleProxy(params, url, request, 'DELETE')) as RequestHandler,
		PATCH: (async ({ params, url, request }) => await handleProxy(params, url, request, 'PATCH')) as RequestHandler
	};
}
