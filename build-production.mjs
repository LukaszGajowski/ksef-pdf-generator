import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

// Build server bundle
await esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/server/index.js',
  format: 'cjs',
  minify: false,
  sourcemap: true,
  logLevel: 'info',
});

// Create production package.json
const prodPackageJson = {
  name: 'ksef-pdf-generator',
  version: '1.0.0',
  private: true,
  main: 'index.js',
  scripts: {
    start: 'node index.js'
  },
  engines: {
    node: '>=22.12.0'
  }
};

const distDir = 'dist/server';
fs.writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify(prodPackageJson, null, 2)
);

// Create .env.example
const envExample = `# Port na którym nasłuchuje serwer
PORT=3000

# Środowisko
NODE_ENV=production
`;

fs.writeFileSync(path.join(distDir, '.env.example'), envExample);

console.log('\n✅ Production bundle created successfully in dist/server/');
console.log('\nPliki gotowe do deploymentu:');
console.log('  - dist/server/index.js         (główny plik aplikacji)');
console.log('  - dist/server/index.js.map     (source map)');
console.log('  - dist/server/package.json     (metadata)');
console.log('  - dist/server/.env.example     (przykładowa konfiguracja)');
console.log('\nSkopiuj zawartość dist/server/ na serwer i uruchom: node index.js');
