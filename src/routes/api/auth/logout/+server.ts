import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
    // Clear all JWT auth cookies (API key is in JWT, not cookies!)
    cookies.delete('access_token', { path: '/' });
    cookies.delete('refresh_token', { path: '/' });
    
    return json({ success: true });
};