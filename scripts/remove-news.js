const fs = require('fs');

const tsx = fs.readFileSync('components/AlfaHome.tsx', 'utf8');
const tsxOut = tsx.replace(
  /\n      <section className="section news">[\s\S]*?\n      <\/section>\n/,
  '\n',
);
fs.writeFileSync('components/AlfaHome.tsx', tsxOut);

const html = fs.readFileSync('Alpha.html', 'utf8');
const htmlOut = html.replace(
  /<!-- NEWSLETTER -->[\s\S]*?<\/section>\n\n/,
  '',
);
fs.writeFileSync('Alpha.html', htmlOut);

console.log('removed news sections');
