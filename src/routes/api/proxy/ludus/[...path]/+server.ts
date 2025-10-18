import { API_ENDPOINTS } from '$lib/api/settings/settings-client';
import { createProxyHandlers } from '$lib/api/settings/proxy';

const handlers = createProxyHandlers(API_ENDPOINTS.ludus.server);

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
export const PATCH = handlers.PATCH;