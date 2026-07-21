// O.S.I.R.I.S. — Trophies modal open/close + progress bar.
// Extracted from osiris-V4.html (MOD 16) and extended by the Achievement Expansion
// to render rarity badges + XP rewards + hidden achievement masking.
//
// Rarity → CSS class mapping (defined in components.css § 11):
//   'common'    → .rar-common      (white)
//   'rare'      → .rar-rare        (cyan)
//   'epic'      → .rar-epic        (amber)
//   'legendary' → .rar-legendary   (toxic red)
// Missing / undefined rarity is rendered as 'common' — this preserves the layout
// for the legacy achievements which don't carry the field.
import { AudioEngine } from '../core/audio.js';
import { ACHIEVEMENTS } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from '../logic/state.js';

// Late-bound (TrophyUI → UI → TrophyUI).
let UI = null;
export function bindUI(u) { UI = u; }

const RARITY_LABEL = {
    common:    'COMUNE',
    rare:      'RARO',
    epic:      'EPICO',
    legendary: 'LEGGENDARIO'
};

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
            const rarity = a.rarity || 'common';
            const rarityCls = `rar-${rarity}`;
            // Hidden achievements stay masked until unlocked. Once unlocked they
            // reveal exactly like any other trophy — no separate display state needed.
            const displayTitle = un ? a.title : (a.hidden ? '???'                 : '???');
            const displayDesc  = un ? a.desc  : (a.hidden ? '// PROTOCOLLO CLASSIFICATO. CRITERI DI SBLOCCO OSCURATI.' : a.desc);
            const displayIcon  = un ? a.icon  : (a.hidden ? '⛨' : '🔒');
            const xpLine = (un && typeof a.xp === 'number' && a.xp > 0)
                ? `<div class="font-mono text-[8px] mt-1 tracking-widest text-monolith-textDim">+${a.xp} XP</div>`
                : '';
            return `<div class="trophy-card ${un ? 'unlocked' : ''} ${rarityCls}">
                <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="trophy-rarity font-mono text-[8px] tracking-widest font-black">${RARITY_LABEL[rarity]}</span>
                    ${un ? `<span class="font-mono text-[8px] tracking-widest text-monolith-textDim">${a.hidden ? '⛨ NASCOSTO' : ''}</span>` : ''}
                </div>
                <div class="trophy-icon">${displayIcon}</div>
                <div class="trophy-title">${displayTitle}</div>
                <div class="trophy-desc">${displayDesc}</div>
                ${xpLine}
                <div class="font-mono text-[8px] mt-1 tracking-widest ${un ? '' : 'text-monolith-textDim'}" style="${un ? 'color:#fbbf24' : ''}">${un ? '★ SBLOCCATO' : '// BLOCCATO'}</div>
            </div>`;
        }).join('');
        UI.fadeInModal('trophies-modal');
    },
    close() { AudioEngine.play('type'); UI.fadeOutModal('trophies-modal'); }
};

export { TrophyUI };
