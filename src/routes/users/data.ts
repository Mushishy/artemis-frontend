export interface User {
    name: string;
    isAdmin: boolean;
    dateCreated: string;
    userID: string;
}

// Format date from ISO string to mm/dd/yyyy hh:mm format in UTC+2 timezone
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    // Convert to UTC+2 timezone
    const utcPlus2 = new Date(date.getTime() + (2 * 60 * 60 * 1000));
    
    const month = (utcPlus2.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = utcPlus2.getUTCDate().toString().padStart(2, '0');
    const year = utcPlus2.getUTCFullYear();
    const hours = utcPlus2.getUTCHours().toString().padStart(2, '0');
    const minutes = utcPlus2.getUTCMinutes().toString().padStart(2, '0');
    
    return `${month}/${day}/${year} ${hours}:${minutes}`;
}

// Download WireGuard configuration for a user (via server endpoint)
export async function downloadWireGuardConfig(userID: string): Promise<void> {
    const response = await fetch(`/api/wireguard?userID=${encodeURIComponent(userID)}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download WireGuard config: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${userID}.conf`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Delete a single user
export async function deleteUser(userID: string): Promise<void> {
    const response = await fetch(`/api/users/${encodeURIComponent(userID)}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
    }
}

// Delete multiple users
export async function deleteMultipleUsers(userIDs: string[]): Promise<void> {
    const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIDs }),
    });
    
    if (!response.ok) {
        throw new Error(`Failed to delete users: ${response.statusText}`);
    }
}

// Create a new user
export async function createUser(name: string, isAdmin: boolean): Promise<void> {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            isAdmin
        }),
    });
    
    if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`);
    }
}

// Add new admin user
export async function addAdmin(username: string): Promise<void> {
    // Generate userID by removing spaces and capitalizing
    const userID = username.replace(/\s+/g, '').toUpperCase();
    
    const response = await fetch('/api/users/add-admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: username,
            userID: userID,
            isAdmin: true
        }),
    });
    
    if (!response.ok) {
        throw new Error(`Failed to add admin user: ${response.statusText}`);
    }
}
