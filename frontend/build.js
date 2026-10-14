const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const src = path.join(__dirname, 'public');
const dest = path.join(__dirname, 'dist');

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });

esbuild.buildSync({
  entryPoints: [path.join(src, 'app.js')],
  bundle: true,
  minify: true,
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(dest, 'app.js')
});

console.log('Frontend build complete.');
