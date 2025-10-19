import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
    // Clear all auth cookies
    cookies.delete('session_id', { path: '/' });
    cookies.delete('api_key', { path: '/' });
    
    return json({ success: true });
};