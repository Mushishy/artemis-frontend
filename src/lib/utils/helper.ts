// Function to create SVG arc path for pie chart (stroke-based, no fill)
export function createPieArc(percentage: number, radius: number = 40, centerX: number = 50, centerY: number = 50): string {
    if (percentage === 0) return '';
    if (percentage >= 100) {
        // Full circle
        return `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX + radius} ${centerY} A ${radius} ${radius} 0 1 1 ${centerX - radius} ${centerY}`;
    }
    
    const angle = (percentage / 100) * 2 * Math.PI;
    const x1 = centerX + radius * Math.cos(-Math.PI / 2);
    const y1 = centerY + radius * Math.sin(-Math.PI / 2);
    const x2 = centerX + radius * Math.cos(-Math.PI / 2 + angle);
    const y2 = centerY + radius * Math.sin(-Math.PI / 2 + angle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
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

// Transform usernames to clean format matching API pattern ^[A-Za-z0-9]{1,20}$
export function cleanUsername(username: string): string {
    return username
        .replace(/\s+/g, '')           // Remove all whitespace
        .replace(/[^a-zA-Z0-9]/g, '')  // Remove all non-alphanumeric characters
        .slice(0, 20);                 // Limit to 20 characters max
}

export function createLudusRole(item: any): LudusRole {
    return {
        Name: item.Name,
        Version: item.Version === '(unknown version)' ? 'custom' : item.Version,
        Type: item.Type,
        Global: item.Global
    };
}