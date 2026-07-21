// O.S.I.R.I.S. — Trophies modal open/close + progress bar.
// Extracted verbatim from osiris-V4.html (MOD 16).
import { AudioEngine } from '../core/audio.js';
import { ACHIEVEMENTS } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from '../logic/state.js';

// Late-bound (TrophyUI → UI → TrophyUI).
let UI = null;
export function bindUI(u) { UI = u; }

const TrophyUI = {
    open() {
        AudioEngine.play('success'); Utils.triggerVibe(20);
        const d = State.data;
        const total = ACHIEVEMENTS.length;
        const unlocked = ACHIEVEMENTS.filter(a => d.achievements.includes(a.id)).length;
        $('trophy-total-count').innerText = total;
        $('trophy-unlocked-count').innerText = unlocked;
        $('trophy-progress-bar').style.width = `${Math.round((unlocked/Math.max(1,total))*100)}%`;
        $('trophies-grid').innerHTML = ACHIEVEMENTS.map(a => {
            const un = d.achievements.includes(a.id);
            return `<div class="trophy-card ${un ? 'unlocked' : ''}">
                <div class="trophy-icon">${un ? a.icon : '🔒'}</div>
                <div class="trophy-title">${un ? a.title : '???'}</div>
                <div class="trophy-desc">${a.desc}</div>
                <div class="font-mono text-[8px] mt-1 tracking-widest ${un ? '' : 'text-monolith-textDim'}" style="${un ? 'color:#fbbf24' : ''}">${un ? '★ SBLOCCATO' : '// BLOCCATO'}</div>
            </div>`;
        }).join('');
        UI.fadeInModal('trophies-modal');
    },
    close() { AudioEngine.play('type'); UI.fadeOutModal('trophies-modal'); }
};

export { TrophyUI };
