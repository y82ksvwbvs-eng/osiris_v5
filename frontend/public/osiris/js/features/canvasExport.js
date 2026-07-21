// O.S.I.R.I.S. — Verdict → PNG sigil (canvas rasterizer + Web Share).
// Extracted verbatim from osiris-V4.html (MOD 12).
import { $ }     from '../core/dom.js';
import { Utils } from '../core/utils.js';
import { AudioEngine } from '../core/audio.js';
import { State } from '../logic/state.js';

// Late-bound (CanvasExport → UI → CanvasExport via inline handlers).
let UI = null;
export function bindUI(u) { UI = u; }

const CanvasExport = {
    async sharePNG() {
        AudioEngine.play('process'); Utils.triggerVibe(30);
        try {
            const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
            const score = $('verdict-score').innerText, sub = $('verdict-score-sub').innerText, lvlNum = $('level-num').innerText;
            const lvlName = $('level-name').innerText, grade = $('level-grade').innerText, tag = $('verdict-tag').innerText;
            const pct = parseInt(score) || 0, isFail = pct < 100 && !tag.includes('MYTHIC') && !tag.includes('GOLD') && !tag.includes('SILVER');
            const color = tag.includes('MYTHIC') || tag.includes('GOLD') ? '#fbbf24' : (tag.includes('SILVER') ? '#a1a1aa' : (isFail ? '#ff003c' : '#00ff66'));

            ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(0,0,0,0.28)'; for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 3);
            
            ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.strokeRect(40, 40, W - 80, H - 80);
            ctx.lineWidth = 4; [[80,80],[W-80,80],[80,H-80],[W-80,H-80]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.stroke(); });
            
            ctx.fillStyle = '#ffffff'; ctx.font = '900 90px "Syncopate", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('OSIRIS.', W/2, 220);
            ctx.fillStyle = '#71717a'; ctx.font = '700 24px "JetBrains Mono", monospace'; ctx.fillText(tag.length > 55 ? tag.slice(0,55)+'...' : tag, W/2, 280);
            ctx.strokeStyle = '#27272a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, 340); ctx.lineTo(W - 120, 340); ctx.stroke();
            
            ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.strokeRect(120, 400, W - 240, 460);
            ctx.fillStyle = '#71717a'; ctx.font = '700 22px "JetBrains Mono", monospace'; ctx.fillText('INDICE DI SUCCESSO', W/2, 460);
            ctx.fillStyle = color; ctx.font = '900 280px "Syncopate", sans-serif';
            if (isFail) { ctx.fillStyle='rgba(255,0,60,0.6)'; ctx.fillText(score, W/2-8, 720); ctx.fillStyle='rgba(0,255,102,0.5)'; ctx.fillText(score, W/2+8, 720); ctx.fillStyle=color; }
            ctx.fillText(score, W/2, 720);
            ctx.fillStyle = '#71717a'; ctx.font = '700 24px "JetBrains Mono", monospace'; ctx.fillText(sub, W/2, 820);
            
            ctx.strokeStyle = '#27272a'; ctx.lineWidth = 4; ctx.strokeRect(120, 920, W - 240, 320);
            ctx.fillStyle = '#71717a'; ctx.font = '700 20px "JetBrains Mono", monospace'; ctx.textAlign = 'left'; ctx.fillText('LIVELLO', 160, 980); ctx.textAlign = 'right'; ctx.fillText('GRADO', W - 160, 980);
            ctx.fillStyle = '#ffffff'; ctx.font = '900 140px "Syncopate", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(lvlNum, 160, 1110);
            
            ctx.textAlign = 'right'; ctx.font = '900 32px "Syncopate", sans-serif'; const gm = ctx.measureText(grade);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(W-160-gm.width-30, 1075, gm.width+30, 50);
            ctx.fillStyle = '#ffffff'; ctx.fillText(grade, W - 175, 1112);
            
            ctx.textAlign = 'center'; ctx.font = '900 38px "JetBrains Mono", monospace'; ctx.fillText(lvlName.slice(0,30), W/2, 1180);
            ctx.font = '700 20px "JetBrains Mono", monospace'; ctx.fillStyle = '#71717a'; ctx.fillText($('level-tier-label').innerText, W/2, 1220);
            
            ctx.beginPath(); ctx.moveTo(120, 1360); ctx.lineTo(W - 120, 1360); ctx.stroke();
            const dstr = Utils.todayStr().replace(/-/g,'.');
            ctx.fillStyle = '#71717a'; ctx.font = '700 22px "JetBrains Mono", monospace'; ctx.fillText(`SIGILLATO IL ${dstr}`, W/2, 1440);
            ctx.fillStyle = '#ffffff'; ctx.font = '900 70px "Syncopate", sans-serif'; ctx.fillText('DOVERE COMPILATO', W/2, 1580);
            ctx.font = '900 42px "Syncopate", sans-serif'; ctx.fillStyle = color; ctx.fillText('DAL PROTOCOLLO O.S.I.R.I.S.', W/2, 1650);
            
            ctx.fillStyle = '#52525b'; ctx.font = '700 18px "JetBrains Mono", monospace'; ctx.fillText('// TERMINALE DI VALUTAZIONE //', W/2, 1780);
            const idHash = State.data.bestStreak.toString(16).padStart(3,'0').toUpperCase() + '-' + State.data.xp.toString(16).padStart(4,'0').toUpperCase();
            ctx.fillText(`ID: ${idHash}`, W/2, 1820);

            const blob = await new Promise(r => c.toBlob(r, 'image/png', 0.92));
            const file = new File([blob], `osiris_verdetto_${dstr}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'OSIRIS', text: `Indice ${score} — Livello ${lvlNum}: ${lvlName}.`});
                AudioEngine.play('success');
            } else {
                const u = URL.createObjectURL(blob), a = document.createElement('a');
                a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(u), 5000); AudioEngine.play('check'); UI.popToast("FILE SCARICATO.");
            }
        } catch(e) { AudioEngine.play('error'); UI.popToast("ERRORE SIGILLO.", true); }
    }
};

export { CanvasExport };
