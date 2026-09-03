const fs = require('fs');

function injectDialog(file) {
    let html = fs.readFileSync(file, 'utf8');
    
    // Add dialog HTML
    if (!html.includes('resume-dialog')) {
        html = html.replace('</body>', `
    <!-- Resume Draw Dialog -->
    <div id="resume-dialog" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:var(--bg); border: 2px solid var(--primary); padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px;">
            <h2 style="margin-top:0; color:var(--primary);">Draw In Progress</h2>
            <p>It looks like a draw was interrupted or hasn't finished yet.</p>
            <p>Would you like to continue the current draw, or archive it and start a new one with the current configuration?</p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                <button class="btn" onclick="document.getElementById('resume-dialog').style.display='none'" style="background: #3b82f6; border-color: #2563eb; color: white;">Continue Draw</button>
                <button class="btn" onclick="startNewDrawFromDialog()" style="background: #ef4444; border-color: #dc2626; color: white;">Start New Draw</button>
            </div>
        </div>
    </div>
    
    <script>
        function checkInProgressDraw() {
            if (!state || !state.draw) return;
            const evt = state.draw[state.draw.activeEvent || 'thursday'];
            if (!evt) return;
            
            // If there are drawn numbers, it's not finished, and it's not a manual draw
            if (evt.type !== 'manual' && (evt.drawnNumbers && evt.drawnNumbers.length > 0) && !evt.isConfirmedFinished) {
                document.getElementById('resume-dialog').style.display = 'flex';
            }
        }
        
        function startNewDrawFromDialog() {
            document.getElementById('resume-dialog').style.display = 'none';
            // Actually call resetDraw logic (we will update resetDraw to do archiving!)
            if (typeof resetDraw === 'function') resetDraw();
            else if (typeof bc !== 'undefined') bc.postMessage({ type: 'CMD', payload: 'reset_draw' }); // For remote to ask admin?
        }
        
        // Wait a second for state to load from FB/Local, then check
        setTimeout(checkInProgressDraw, 1500);
    </script>
</body>`);
    }
    
    fs.writeFileSync(file, html);
}

injectDialog('admin.html');
injectDialog('remote.html');
