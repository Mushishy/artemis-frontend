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
