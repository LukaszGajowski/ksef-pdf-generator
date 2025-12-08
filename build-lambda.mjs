import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/lambda.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/lambda/index.js',
  format: 'cjs',
  external: ['aws-sdk'],
  minify: true,
  sourcemap: true,
  logLevel: 'info',
});

console.log('✅ Lambda bundle created successfully in dist/lambda/');
