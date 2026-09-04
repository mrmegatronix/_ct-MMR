const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

// Add oninput="updateDrawState()" to generic inputs
html = html.replace(/id="cfg-gen-min"[^>]*onchange="updateDrawState\(\)"/, 'id="cfg-gen-min" value="0" oninput="updateDrawState()" onchange="updateDrawState()"');
html = html.replace(/id="cfg-gen-max"[^>]*onchange="updateDrawState\(\)"/, 'id="cfg-gen-max" max="9999" value="9999" oninput="updateDrawState()" onchange="updateDrawState()"');
html = html.replace(/id="cfg-gen-prizes"[^>]*onchange="updateDrawState\(\)"/, 'id="cfg-gen-prizes" value="10" oninput="updateDrawState()" onchange="updateDrawState()"');

fs.writeFileSync('admin.html', html);
