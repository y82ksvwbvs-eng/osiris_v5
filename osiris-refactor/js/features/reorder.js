// O.S.I.R.I.S. — Tap-to-select / tap-to-place task reordering.
// Extracted verbatim from osiris-V4.html (MOD 15).
import { AudioEngine } from '../core/audio.js';
import { Utils }       from '../core/utils.js';
import { State }       from '../logic/state.js';

// Late-bound (Reorder ↔ UI).
let UI = null;
export function bindUI(u) { UI = u; }

const Reorder = {
    active: false,
    srcIdx: -1,
    // Click sulla maniglia ▚: seleziona / annulla / (se già attivo su un'altra) sposta.
    handle(i, e) {
        if (e) { e.stopPropagation(); e.preventDefault && e.preventDefault(); }
        // Storico in sola lettura: nessun riordino consentito.
        const h = State.data.history[State.activeDate];
        if (h && h.score !== null) return;
        if (this.active) {
            if (i === this.srcIdx) { this.cancel(); return; } // stessa maniglia -> annulla
            this.place(i); return;                            // altra maniglia -> sposta qui
        }
        this.start(i);
    },
    start(i) {
        this.active = true; this.srcIdx = i;
        AudioEngine.play('type'); Utils.triggerVibe(15);
        UI.renderTasks(State.data.history[State.activeDate] || { comp: [], score: null });
    },
    place(tgt) {
        if (!this.active) return;
        const from = this.srcIdx;
        this.active = false; this.srcIdx = -1;
        if (tgt !== from && from > -1 && tgt > -1) {
            const item = State.data.tasks.splice(from, 1)[0];
            State.data.tasks.splice(tgt, 0, item);
            AudioEngine.play('check'); Utils.triggerVibe(20);
            State.save(); // persiste il nuovo ordine + re-render pulito
        } else {
            AudioEngine.play('type');
            UI.renderTasks(State.data.history[State.activeDate] || { comp: [], score: null });
        }
    },
    cancel() {
        this.active = false; this.srcIdx = -1;
        AudioEngine.play('type'); Utils.triggerVibe(10);
        UI.renderTasks(State.data.history[State.activeDate] || { comp: [], score: null });
    }
};

export { Reorder };
