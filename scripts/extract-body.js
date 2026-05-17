const fs = require('fs');
const html = fs.readFileSync('Alpha.html', 'utf8');
const start = html.indexOf('<body>') + 6;
const end = html.indexOf('<!-- Supabase -->');
let body = html.slice(start, end).trim();
body = body
  .replace(/\bclass=/g, 'className=')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\sonsubmit="[^"]*"/g, '')
  .replace(/src="assets\//g, 'src="/assets/')
  .replace(/src="uploads\//g, 'src="/uploads/')
  .replace(/<img([^>]*)\/>/g, '<img$1 />')
  .replace(/<span class="arrow"><\/span>/g, '<span className="arrow"></span>')
  .replace(/style="([^"]*)"/g, (_, s) => {
    const obj = s
      .split(';')
      .filter(Boolean)
      .map((pair) => {
        const [k, v] = pair.split(':').map((x) => x.trim());
        const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        let val = v;
        if (/^\d+$/.test(v)) val = Number(v);
        return `${key}: ${JSON.stringify(val)}`;
      })
      .join(', ');
    return `style={{ ${obj} }}`;
  });
fs.mkdirSync('components', { recursive: true });
fs.writeFileSync('components/_alfa-body-fragment.txt', body, 'utf8');
console.log('wrote fragment', body.length);
