const fs = require('fs');

for (const file of ['admin.html', 'remote.html']) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the single Congrats button with two: Winners Grid and Congrats Video
    content = content.replace(/<button class="btn" id="btn-congrats" onclick="setView\('congrats'\)"(.*?)>🎉 Congrats<\/button>/, 
    '<button class="btn" id="btn-congrats" onclick="setView(\'congrats\')" $1>🎉 Winners Grid</button>\n<button class="btn" id="btn-congrats-video" onclick="setView(\'congrats-video\')" $1 style="background: #ef4444; color: white;">🎬 Congrats Video</button>');
    
    // Some minor variation in HTML attributes might prevent replace, so I'll be more generic
    if (!content.includes('id="btn-congrats-video"')) {
        content = content.replace(/<button class="btn" id="btn-congrats"(.*?)>🎉 Congrats<\/button>/, 
        '<button class="btn" id="btn-congrats"$1>🎉 Winners Grid</button>\n<button class="btn" id="btn-congrats-video" onclick="setView(\'congrats-video\')"$1 style="background: #ef4444; color: white; border-color: #dc2626;">🎬 Congrats Video</button>');
    }
    
    fs.writeFileSync(file, content);
}
