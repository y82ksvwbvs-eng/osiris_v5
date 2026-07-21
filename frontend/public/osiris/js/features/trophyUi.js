// O.S.I.R.I.S. — Trophies modal (Achievement System v2).
//
// Renders the archive with:
//   • rarity badges (common / rare / epic / legendary)
//   • hidden achievements masked until unlocked ("PROTOCOLLO CLASSIFICATO")
//   • unlock date + XP reward on unlocked cards
//   • state filters (all / unlocked / locked / hidden)
//   • category filters (discipline / consistency / progression / system / secret)
//   • progress line "N / M // pct%" and progress bar
//
// The filter state is kept on the #trophy-filters container (data-active-state /
// data-active-category attributes) — no external module state, no persistence.
// This keeps the filter behavior scoped to the modal lifecycle: closing and
// reopening the modal always resets to "all / all".
import { AudioEngine } from '../core/audio.js';
import { ACHIEVEMENTS } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from '../logic/state.js';

// Late-bound (TrophyUI → UI → TrophyUI).
let UI = null;
export function bindUI(u) { UI = u; }

const RARITY_LABEL = { common: 'COMUNE', rare: 'RARO', epic: 'EPICO', legendary: 'LEGGENDARIO' };
const CAT_LABEL    = { discipline: 'DISCIPLINA', consistency: 'COSTANZA', progression: 'PROGRESSIONE', system: 'SISTEMA', secret: 'CLASSIFICATO' };

// Format an ISO date into the terminal-style dd.mm.yyyy // hh:mm shown on cards.
function _formatUnlockDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yy} // ${hh}:${mi}`;
}

const TrophyUI = {
    open() {
        AudioEngine.play('success'); Utils.triggerVibe(20);
        const d = State.data;
        const total = ACHIEVEMENTS.length;
        const unlocked = ACHIEVEMENTS.filter(a => d.achievements.includes(a.id)).length;
        const pct = Math.round((unlocked / Math.max(1, total)) * 100);
        $('trophy-total-count').innerText = total;
        $('trophy-unlocked-count').innerText = unlocked;
        $('trophy-progress-bar').style.width = `${pct}%`;
        const pctEl = $('trophy-progress-pct'); if (pctEl) pctEl.innerText = `// ${pct}%`;

        // Reset filters every time the modal opens (progressive UX: no sticky state).
        const bar = $('trophy-filters');
        if (bar) {
            bar.setAttribute('data-active-state', 'all');
            bar.setAttribute('data-active-category', 'all');
            bar.querySelectorAll('[data-filter-state]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter-state') === 'all'));
            bar.querySelectorAll('[data-filter-cat]').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter-cat') === 'all'));
            // Wire the chips exactly once — the button set is static in the DOM.
            if (!bar._wired) {
                bar.addEventListener('click', (ev) => {
                    const btn = ev.target.closest('[data-filter-state],[data-filter-cat]');
                    if (!btn) return;
                    AudioEngine.play('type');
                    if (btn.hasAttribute('data-filter-state')) {
                        bar.setAttribute('data-active-state', btn.getAttribute('data-filter-state'));
                        bar.querySelectorAll('[data-filter-state]').forEach(b => b.classList.toggle('active', b === btn));
                    } else {
                        bar.setAttribute('data-active-category', btn.getAttribute('data-filter-cat'));
                        bar.querySelectorAll('[data-filter-cat]').forEach(b => b.classList.toggle('active', b === btn));
                    }
                    TrophyUI._renderGrid();
                });
                bar._wired = true;
            }
        }
        this._renderGrid();
        UI.fadeInModal('trophies-modal');
    },

    _renderGrid() {
        const d = State.data;
        const bar = $('trophy-filters');
        const st  = bar ? bar.getAttribute('data-active-state')    : 'all';
        const cat = bar ? bar.getAttribute('data-active-category') : 'all';

        const visible = ACHIEVEMENTS.filter(a => {
            const un = d.achievements.includes(a.id);
            const catMatch = (cat === 'all') || ((a.category || 'progression') === cat);
            let stMatch = true;
            if (st === 'unlocked') stMatch = un;
            else if (st === 'locked')   stMatch = !un;
            else if (st === 'hidden')   stMatch = !!a.hidden;
            return catMatch && stMatch;
        });

        const grid  = $('trophies-grid');
        const empty = $('trophies-empty');
        if (visible.length === 0) {
            grid.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        grid.innerHTML = visible.map(a => {
            const un = d.achievements.includes(a.id);
            const rarity = a.rarity || 'common';
            const category = a.category || 'progression';
            const rarityCls = `rar-${rarity}`;
            const isHidden  = !!a.hidden;
            // Hidden entries stay masked until unlocked (spec: "CLASSIFIED PROTOCOL" style).
            const displayTitle = un ? a.title : (isHidden ? 'PROTOCOLLO CLASSIFICATO' : a.title);
            const displayDesc  = un ? a.desc  : (isHidden ? 'Condizioni di sblocco classificate.' : a.desc);
            const displayIcon  = un ? a.icon  : (isHidden ? '⛨' : '🔒');
            const unlockDate   = un ? _formatUnlockDate(d.achievementUnlocks && d.achievementUnlocks[a.id]) : null;
            const xpBadge = (typeof a.xp === 'number' && a.xp > 0)
                ? `<span class="trophy-xp-badge">+${a.xp} XP</span>`
                : '';
            const details = un
                ? `<div class="trophy-details">
                       <span class="trophy-unlocked-date">SBLOCCATO IL ${unlockDate}</span>
                       ${xpBadge}
                   </div>`
                : '';
            return `<div class="trophy-card ${un ? 'unlocked' : ''} ${rarityCls}" data-cat="${category}">
                <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="trophy-rarity font-mono text-[8px] tracking-widest font-black">${RARITY_LABEL[rarity]}</span>
                    <span class="trophy-cat font-mono text-[8px] tracking-widest text-monolith-textDim">${isHidden && !un ? '// CLASSIFICATO' : `// ${CAT_LABEL[category]}`}</span>
                </div>
                <div class="trophy-icon">${displayIcon}</div>
                <div class="trophy-title">${displayTitle}</div>
                <div class="trophy-desc">${displayDesc}</div>
                ${details}
                <div class="font-mono text-[8px] mt-1 tracking-widest ${un ? '' : 'text-monolith-textDim'}" style="${un ? 'color:#fbbf24' : ''}">${un ? '★ SBLOCCATO' : '// BLOCCATO'}</div>
            </div>`;
        }).join('');
    },

    close() { AudioEngine.play('type'); UI.fadeOutModal('trophies-modal'); }
};

export { TrophyUI };
