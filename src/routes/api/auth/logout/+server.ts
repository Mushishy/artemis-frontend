import { json, type RequestHandler } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/utils/jwt-auth';

export const POST: RequestHandler = async ({ cookies }) => {
    clearAuthCookie(cookies);
    
    return json({ success: true });
};