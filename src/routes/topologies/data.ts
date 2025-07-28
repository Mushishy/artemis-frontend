import { getTopology, createOrUpdateTopology, deleteTopology } from "$lib/api/topology.client";

export interface Topology {
    ID: string;
    Name: string;
    Created: string;
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

// Load topologies from API
export async function loadTopologies(): Promise<Topology[]> {
    try {
        const response = await getTopology();
        
        // Handle both single topology and array of topologies
        if (Array.isArray(response)) {
            return response.map(item => ({
                ID: item.topologyId,
                Name: item.topologyName,
                Created: formatDate(item.createdAt)
            }));
        } else if (response.topologyId) {
            return [{
                ID: response.topologyId,
                Name: response.topologyName,
                Created: formatDate(response.createdAt)
            }];
        }
        
        return [];
    } catch (error) {
        console.error('Error loading topologies:', error);
        return [];
    }
}

// Create or update topology
export async function uploadTopology(file: File, topologyId?: string) {
    try {
        return await createOrUpdateTopology(file, topologyId);
    } catch (error) {
        console.error('Error uploading topology:', error);
        throw error;
    }
}

// Download topology
export async function downloadTopology(topologyId: string): Promise<void> {
    try {
        const response = await getTopology(topologyId);
        if (response.topologyFile && response.topologyName) {
            // Decode base64 file content
            const binaryString = atob(response.topologyFile);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Create blob and download
            const blob = new Blob([bytes], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.topologyName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error downloading topology:', error);
        throw error;
    }
}

// Delete topology
export async function removeTopology(topologyId: string) {
    try {
        return await deleteTopology(topologyId);
    } catch (error) {
        console.error('Error deleting topology:', error);
        throw error;
    }
}
