import { unzip } from 'fflate';

/**
 * Convert ZIP file to TAR format in memory
 * Filters out problematic macOS files and creates proper TAR structure
 */
export async function convertZipToTar(zipFile: File): Promise<File> {
    try {
        // Read ZIP file
        const zipArrayBuffer = await zipFile.arrayBuffer();
        const zipData = new Uint8Array(zipArrayBuffer);
        
        // Extract ZIP contents
        const extracted = await new Promise<{[path: string]: Uint8Array}>((resolve, reject) => {
            unzip(zipData, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        
        // Filter out problematic files and folders
        const filteredFiles: {[path: string]: Uint8Array} = {};
        
        for (const [path, content] of Object.entries(extracted)) {
            // Skip macOS metadata files and folders
            if (path.includes('__MACOSX') || 
                path.includes('.DS_Store') || 
                path.startsWith('._') ||
                path.includes('/.DS_Store') ||
                path.includes('/._')) {
                continue;
            }
            
            // Skip empty files that might cause issues
            if (content.length === 0 && !path.endsWith('/')) {
                continue;
            }
            
            // Skip directory entries (they end with /)
            if (path.endsWith('/')) {
                continue;
            }
            
            filteredFiles[path] = content;
        }
        
        if (Object.keys(filteredFiles).length === 0) {
            throw new Error('No valid files found in ZIP archive after filtering');
        }
        
        // Create TAR file manually (simple TAR format)
        const tarChunks: Uint8Array[] = [];
        
        for (const [path, content] of Object.entries(filteredFiles)) {
            // Normalize path (remove leading slash if present)
            let normalizedPath = path.startsWith('/') ? path.slice(1) : path;
            
            const pathBytes = new TextEncoder().encode(normalizedPath);
            
            // Handle long filenames using GNU tar extended format
            if (pathBytes.length >= 100) {
                console.log(`Long path detected (${pathBytes.length} chars): ${normalizedPath}`);
                
                // Create GNU long filename header
                const longNameHeader = new Uint8Array(512);
                const longNameContent = new TextEncoder().encode(normalizedPath);
                
                // GNU long filename marker
                longNameHeader.set(new TextEncoder().encode('././@LongLink'), 0);
                longNameHeader.set(new TextEncoder().encode('0000000'), 100); // mode
                longNameHeader.set(new TextEncoder().encode('0000000'), 108); // uid
                longNameHeader.set(new TextEncoder().encode('0000000'), 116); // gid
                
                // Size of the long filename
                const longNameSizeOctal = longNameContent.length.toString(8).padStart(11, '0') + ' ';
                longNameHeader.set(new TextEncoder().encode(longNameSizeOctal), 124);
                
                // Modification time
                const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + ' ';
                longNameHeader.set(new TextEncoder().encode(mtime), 136);
                
                // Checksum placeholder
                longNameHeader.set(new TextEncoder().encode('        '), 148);
                
                // Type flag for GNU long filename
                longNameHeader[156] = 0x4C; // 'L'
                
                // Calculate checksum for long name header
                let longNameChecksum = 0;
                for (let i = 0; i < 512; i++) {
                    longNameChecksum += longNameHeader[i];
                }
                const longNameChecksumOctal = longNameChecksum.toString(8).padStart(6, '0') + '\0 ';
                longNameHeader.set(new TextEncoder().encode(longNameChecksumOctal), 148);
                
                // Add long name header and content
                tarChunks.push(longNameHeader);
                tarChunks.push(longNameContent);
                
                // Pad long name content to 512-byte boundary
                const longNamePadding = 512 - (longNameContent.length % 512);
                if (longNamePadding < 512) {
                    tarChunks.push(new Uint8Array(longNamePadding));
                }
            }
            
            // Create regular TAR header (512 bytes)
            const header = new Uint8Array(512);
            
            // For long paths, use a truncated version in the regular header
            if (pathBytes.length >= 100) {
                // Use last part of path or a placeholder
                const shortPath = normalizedPath.length > 99 ? normalizedPath.slice(-99) : normalizedPath;
                header.set(new TextEncoder().encode(shortPath).slice(0, 100));
            } else {
                header.set(pathBytes); // filename (max 100 chars)
            }
            
            // File mode (octal 644)
            const mode = '0000644';
            header.set(new TextEncoder().encode(mode), 100);
            
            // Owner and group ID (0)
            header.set(new TextEncoder().encode('0000000'), 108);
            header.set(new TextEncoder().encode('0000000'), 116);
            
            // File size (octal)
            const sizeOctal = content.length.toString(8).padStart(11, '0') + ' ';
            header.set(new TextEncoder().encode(sizeOctal), 124);
            
            // Modification time (current time in octal)
            const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + ' ';
            header.set(new TextEncoder().encode(mtime), 136);
            
            // Checksum placeholder (8 spaces)
            header.set(new TextEncoder().encode('        '), 148);
            
            // File type (regular file)
            header[156] = 0x30; // '0'
            
            // Calculate checksum
            let checksum = 0;
            for (let i = 0; i < 512; i++) {
                checksum += header[i];
            }
            
            // Write checksum back to header
            const checksumOctal = checksum.toString(8).padStart(6, '0') + '\0 ';
            header.set(new TextEncoder().encode(checksumOctal), 148);
            
            tarChunks.push(header);
            tarChunks.push(content);
            
            // Pad to 512-byte boundary
            const padding = 512 - (content.length % 512);
            if (padding < 512) {
                tarChunks.push(new Uint8Array(padding));
            }
        }
        
        // Add two zero blocks at the end
        tarChunks.push(new Uint8Array(512));
        tarChunks.push(new Uint8Array(512));
        
        // Combine all chunks
        const totalLength = tarChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const tarData = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of tarChunks) {
            tarData.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Create filename
        let filename = zipFile.name;
        if (filename.endsWith('.zip')) {
            filename = filename.slice(0, -4) + '.tar';
        } else {
            filename += '.tar';
        }
        
        return new File([tarData], filename, { type: 'application/x-tar' });
        
    } catch (error) {
        console.error('Error converting ZIP to TAR:', error);
        throw new Error('Failed to convert ZIP file to TAR format');
    }
}