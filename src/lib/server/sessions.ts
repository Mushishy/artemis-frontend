// Shared session storage for the authentication system
// This is used by both login and validate endpoints

export const activeSessions = new Map<string, { apiKey: string; expires: number }>();

// Clean up expired sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
        if (now > session.expires) {
            activeSessions.delete(sessionId);
        }
    }
}, 60000); // Clean up every minute