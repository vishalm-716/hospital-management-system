async function checkCSS() {
  try {
    const res = await fetch('http://localhost:3131/login');
    const html = await res.text();
    const cssLinks = html.match(/href="[^"]*\.css[^"]*"/g);
    console.log('CSS Links in HTML:', cssLinks);
    console.log('HTML head snippet:', html.substring(0, 1500));
  } catch(e) {
    console.log('Server not running, starting check later');
  }
}
checkCSS();
