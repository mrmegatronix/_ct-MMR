const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>(.*?)<\/script>/s);
if (scriptMatch) {
    fs.writeFileSync('index_js.js', scriptMatch[1]);
    console.log("Extracted JS to index_js.js");
}
