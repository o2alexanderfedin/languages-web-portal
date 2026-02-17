/**
 * Generate test fixture files for E2E upload testing.
 *
 * Creates:
 * - invalid.txt  — plain text file (not a ZIP)
 * - invalid.jpg  — fake JPEG file (invalid type for upload)
 * - empty.zip    — valid but empty ZIP archive
 * - no-extension — copy of sample.zip bytes without .zip extension
 *
 * Skips sample.zip generation if it already exists (handled by create-test-zip.ts).
 */
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dir = __dirname;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createEmptyZip(outputPath: string): Promise<void> {
  return new Promise((res, rej) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 1 } });

    archive.pipe(output);

    output.on('close', () => {
      console.log(`Created ${outputPath} (${archive.pointer()} bytes)`);
      res();
    });
    output.on('error', rej);
    archive.on('error', rej);

    // Finalize with no entries — produces a valid empty ZIP
    archive.finalize();
  });
}

// ---------------------------------------------------------------------------
// invalid.txt
// ---------------------------------------------------------------------------

const invalidTxtPath = resolve(dir, 'invalid.txt');
writeFileSync(invalidTxtPath, 'This is not a ZIP file');
console.log(`Created ${invalidTxtPath}`);

// ---------------------------------------------------------------------------
// invalid.jpg  (JPEG magic bytes + garbage data)
// ---------------------------------------------------------------------------

const invalidJpgPath = resolve(dir, 'invalid.jpg');
const jpegMagic = Buffer.from([0xff, 0xd8, 0xff]);
const garbage = Buffer.alloc(64, 0xab);
writeFileSync(invalidJpgPath, Buffer.concat([jpegMagic, garbage]));
console.log(`Created ${invalidJpgPath}`);

// ---------------------------------------------------------------------------
// empty.zip
// ---------------------------------------------------------------------------

const emptyZipPath = resolve(dir, 'empty.zip');
await createEmptyZip(emptyZipPath);

// ---------------------------------------------------------------------------
// no-extension  (copy of sample.zip bytes, no .zip extension)
// ---------------------------------------------------------------------------

const sampleZipPath = resolve(dir, 'sample.zip');
const noExtensionPath = resolve(dir, 'no-extension');

if (existsSync(sampleZipPath)) {
  const sampleBytes = readFileSync(sampleZipPath);
  writeFileSync(noExtensionPath, sampleBytes);
  console.log(`Created ${noExtensionPath} (${sampleBytes.length} bytes)`);
} else {
  // sample.zip not available; write minimal ZIP magic bytes as placeholder
  const zipMagic = Buffer.from([0x50, 0x4b, 0x05, 0x06, ...Array(18).fill(0)]);
  writeFileSync(noExtensionPath, zipMagic);
  console.log(`Created ${noExtensionPath} (placeholder, sample.zip not found)`);
}

console.log('All fixture files created successfully.');
