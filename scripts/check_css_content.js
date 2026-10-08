async function checkCSSContent() {
  try {
    const pageRes = await fetch('http://localhost:3131/login');
    const html = await pageRes.text();
    const cssMatch = html.match(/href="([^"]*\.css[^"]*)"/);
    if (!cssMatch) { console.log('No CSS link found'); return; }
    
    const cssUrl = 'http://localhost:3131' + decodeURIComponent(cssMatch[1]);
    console.log('Fetching CSS:', cssUrl);
    const cssRes = await fetch(cssUrl);
    const css = await cssRes.text();
    console.log('CSS Length:', css.length);
    console.log('CSS first 2000 chars:', css.substring(0, 2000));
  } catch(e) {
    console.error('Error:', e.message);
  }
}
checkCSSContent();
