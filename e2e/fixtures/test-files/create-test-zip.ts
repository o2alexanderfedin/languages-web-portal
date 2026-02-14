/**
 * Generate test ZIP file for E2E upload testing
 * Creates sample.zip with a simple C++ file
 */
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputPath = resolve(__dirname, 'sample.zip');

// Create write stream
const output = createWriteStream(outputPath);

// Create archiver instance with compression
const archive = archiver('zip', {
  zlib: { level: 6 }, // Compression level
});

// Pipe archive to output file
archive.pipe(output);

// Add test C++ file content
const cppContent = `#include <stdio.h>
int main() {
    printf("Hello from test\\n");
    return 0;
}
`;

archive.append(cppContent, { name: 'main.cpp' });

// Finalize the archive
await archive.finalize();

// Wait for stream to finish
await new Promise((resolve, reject) => {
  output.on('close', () => {
    console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
    resolve(undefined);
  });
  output.on('error', reject);
  archive.on('error', reject);
});
