const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') results = results.concat(walk(full));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(full);
    }
  });
  return results;
}

const files = walk('./src');
console.log('Total files checked:', files.length);

const issues = [];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    // Check for text-white or white text on light backgrounds
    if (l.includes('text-white') && (
      l.includes('bg-white') ||
      l.includes('bg-slate-50') ||
      l.includes('bg-slate-100') ||
      l.includes('bg-gray-50') ||
      l.includes('bg-card') ||
      l.includes('variant="outline"') ||
      l.includes('variant="ghost"') ||
      l.includes('variant="secondary"')
    )) {
      issues.push({ file: f, line: i + 1, issue: 'text-white on light background', text: l.trim() });
    }
    
    // Check for hardcoded white text in cards without dark background
    if (l.includes('text-white') && l.includes('Card') && !l.includes('bg-slate-900') && !l.includes('bg-slate-800') && !l.includes('login') && !l.includes('register') && !l.includes('card-dark')) {
      issues.push({ file: f, line: i + 1, issue: 'text-white in Card', text: l.trim() });
    }

    // Check for invisible text in tables
    if (l.includes('<td') && l.includes('text-white')) {
      issues.push({ file: f, line: i + 1, issue: 'text-white in table cell', text: l.trim() });
    }
    if (l.includes('<th') && l.includes('text-white')) {
      issues.push({ file: f, line: i + 1, issue: 'text-white in table header', text: l.trim() });
    }
  });
});

console.log('Found issues:', issues.length);
issues.forEach(iss => console.log(`[${iss.file}:${iss.line}] ${iss.issue}: ${iss.text}`));
