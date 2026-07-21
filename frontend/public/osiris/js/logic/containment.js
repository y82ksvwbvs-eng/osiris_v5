// O.S.I.R.I.S. — Containment Protocols.
//
// Deterministic, threshold-triggered diagnostic responses to rising corruption.
// Per user choice (option 2c): protocols emit *visual + notification* effects only.
// No forced gameplay changes (no minimum-task bumps, no task-order randomization).
// The single exception is CP-05 (soglia 95%), which slightly reduces XP efficiency
// via CONTAINMENT_XP_MULT — the spec explicitly authorizes this as it's "slight
// XP efficiency reduction", not a random punishment.
//
// Rules enforced here:
//   - deterministic (only reads corruption %, no randomness)
//   - predictable (thresholds are static)
//   - temporary (falls back automatically as corruption drops)
//   - reversible (removing all `ct-N` body classes fully restores UI)
//   - never punishes without explanation (each activation emits a toast notice)
//
// Public API:
//   Containment.apply(corrPct)  → activates the highest matching protocol,
//                                 toggles body classes, notifies on transitions.
//   Containment.active()        → returns the currently active protocol (or null).
//   Containment.xpMultiplier()  → 1.0 unless CP-05 is active.
import { CONTAINMENT_THRESHOLDS, CONTAINMENT_XP_MULT } from '../core/config.js';

// Late-bound so this module has no static dependency on UI (which lives downstream).
let UI = null;
export function bindUI(u) { UI = u; }

const Containment = {
    _last: null,               // code of the last-notified protocol (avoids toast spam)
    _current: null,            // full descriptor of the currently active protocol
    _cssClasses: CONTAINMENT_THRESHOLDS.map(t => t.css),

    // Return the highest threshold matching `pct` (or null if below all).
    _match(pct) {
        let hit = null;
        for (const t of CONTAINMENT_THRESHOLDS) if (pct >= t.pct) hit = t;
        return hit;
    },

    apply(corrPct) {
        const hit = this._match(corrPct);
        // Wipe every threshold class first, then re-apply only the active one.
        // This keeps the transitions clean even when the corruption drops.
        document.body.classList.remove(...this._cssClasses);
        if (hit) document.body.classList.add(hit.css);

        // Emit a toast only on transition to a *new* protocol (up or down).
        const nextCode = hit ? hit.code : null;
        if (nextCode !== this._last) {
            if (hit && UI && typeof UI.popToast === 'function') UI.popToast(hit.notice);
            else if (!hit && this._last && UI && typeof UI.popToast === 'function') {
                UI.popToast('Tutti i protocolli di contenimento disattivati. Sistema stabile.');
            }
            this._last = nextCode;
        }
        this._current = hit;
        return hit;
    },

    active() { return this._current; },

    xpMultiplier() {
        const cur = this._current;
        if (!cur) return 1.0;
        return CONTAINMENT_XP_MULT[cur.code] ?? 1.0;
    }
};

export { Containment };
