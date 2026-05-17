const fs = require('fs');
const html = fs.readFileSync('Alpha.html', 'utf8');
const m = html.match(/<style>([\s\S]*?)<\/style>/);
if (!m) throw new Error('no style block');
fs.mkdirSync('app', { recursive: true });
fs.writeFileSync('app/globals.css', m[1].trim(), 'utf8');
console.log('extracted', m[1].length, 'chars');
