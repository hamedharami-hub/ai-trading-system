import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemasDir = path.resolve(__dirname, '..', 'src', 'schemas');
const eventsDir = path.resolve(schemasDir, 'events');
const outputDir = path.resolve(__dirname, '..', 'src', 'generated');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Compiling JSON Schemas to TypeScript definitions...');

  const readJson = (file: string) => {
    const raw = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  };

  const primitivesPath = path.join(schemasDir, 'primitives.json');
  const primitivesSchema = readJson(primitivesPath);

  const envelopePath = path.join(schemasDir, 'envelope.json');
  const envelopeSchema = readJson(envelopePath);

  const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));
  const eventSchemas = eventFiles.map(f => {
    return {
      name: f,
      schema: readJson(path.join(eventsDir, f))
    };
  });

  const bannerComment = `/* eslint-disable */\n/**\n * AUTO-GENERATED FILE - DO NOT MODIFY MANUALLY.\n * Source: JSON Schema 2020-12 specifications in packages/contracts/src/schemas/\n * Generated at: ${new Date().toISOString()}\n */\n`;

  let fullTs = bannerComment;

  // Compile Primitives
  const primitivesTs = await compile(primitivesSchema, 'Primitives', {
    bannerComment: '',
    unreachableDefinitions: true,
    strictIndexSignatures: true
  });
  fullTs += '\n// ==================== PRIMITIVES ====================\n' + primitivesTs;

  // Compile Envelope
  const envelopeTs = await compile(envelopeSchema, 'EventEnvelope', {
    bannerComment: '',
    cwd: schemasDir,
    strictIndexSignatures: true
  });
  fullTs += '\n// ==================== EVENT ENVELOPE ====================\n' + envelopeTs;

  // Compile each Event Payload
  for (const item of eventSchemas) {
    const title = item.schema.title || path.basename(item.name, '.json');
    const eventTs = await compile(item.schema, title, {
      bannerComment: '',
      cwd: eventsDir,
      strictIndexSignatures: true
    });
    fullTs += `\n// ==================== ${title} ====================\n` + eventTs;
  }

  const outputPath = path.join(outputDir, 'types.ts');
  fs.writeFileSync(outputPath, fullTs, 'utf-8');
  console.log(`Generated types successfully written to ${outputPath}`);
}

run().catch((err) => {
  console.error('Error generating types:', err);
  process.exit(1);
});
