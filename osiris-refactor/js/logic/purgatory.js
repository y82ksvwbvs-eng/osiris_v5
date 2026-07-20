// O.S.I.R.I.S. — Purgatorio mode (3+ consecutive failed cycles).
// Extracted verbatim from osiris-V4.html (MOD 06).
import { CONFIG } from '../core/config.js';
import { State }  from './state.js';

const Purgatory = {
    evaluate() {
        const keys = Object.keys(State.data.history).filter(k => State.data.history[k].score !== null).sort().reverse();
        let consecutiveFail = 0;
        for (const k of keys) { if (State.data.history[k].score < 100) consecutiveFail++; else break; }
        const active = consecutiveFail >= CONFIG.PURGATORY_THRESHOLD;
        document.body.classList.toggle('purgatorio-active', active);
        
        if (active && Corruption.target < 0.25) Corruption.set(0.28);
        else if (!active) {
            const h = State.data.history[State.activeDate];
            if (!h || h.score === null || h.score === 100) Corruption.set(0);
        }
    }
};

export { Purgatory };
