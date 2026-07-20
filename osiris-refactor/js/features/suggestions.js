// O.S.I.R.I.S. — Deterministic daily task suggestions (24h rotation).
// Extracted verbatim from osiris-V4.html (MOD 10).
import { TASK_SUGGESTIONS } from '../core/config.js';
import { Utils }            from '../core/utils.js';
import { $ }                from '../core/dom.js';
import { AudioEngine }      from '../core/audio.js';
import { State }            from '../logic/state.js';

// Late-bound (Suggestions → Logic → Suggestions via inline handlers).
let Logic = null;
export function bindLogic(l) { Logic = l; }

const Suggestions = {
    COUNT: 3,          // ne proponiamo 3 (>= 2 richiesti)
    rerollOffset: 0,   // consente all'utente di chiedere un altro set
    dayIndex() {
        // Giorni trascorsi dall'epoch in ORA LOCALE (cambia a mezzanotte locale).
        const d = new Date();
        const local = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.floor(local / 86400000);
    },
    daily() {
        const pool = TASK_SUGGESTIONS, n = pool.length;
        const base = (this.dayIndex() * this.COUNT + this.rerollOffset * this.COUNT);
        const out = [];
        for (let k = 0; k < this.COUNT && k < n; k++) out.push(pool[((base + k) % n + n) % n]);
        return out;
    },
    render() {
        const box = $('suggestions-list'); if (!box) return;
        const today = Utils.todayStr();
        const h = State.data.history[today] || { comp: [] };
        const isJudged = h.score !== null;
        const wrap = $('suggestions-wrap');
        // Nascondi il pannello se la giornata è già stata giudicata (sola lettura).
        if (wrap) wrap.style.display = isJudged ? 'none' : '';
        if (isJudged) { box.innerHTML = ''; return; }
        box.innerHTML = this.daily().map(t => {
            const already = State.data.tasks.includes(t);
            return `<button type="button" class="suggest-chip ${already ? 'added' : ''}" ${already ? 'disabled' : ''} onclick="Suggestions.add('${t.replace(/'/g, "\\'")}')" data-testid="suggest-chip">
                <span class="plus">${already ? '✓' : '+'}</span><span>${Utils.escapeHTML(t)}</span>
            </button>`;
        }).join('');
    },
    add(t) {
        if (State.data.tasks.includes(t)) return;
        Logic.addTask(t); // addTask salva e ridisegna (inclusi i suggerimenti)
    },
    reroll() {
        this.rerollOffset++;
        AudioEngine.play('type'); Utils.triggerVibe(10);
        this.render();
    }
};

export { Suggestions };
