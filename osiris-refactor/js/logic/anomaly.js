// O.S.I.R.I.S. — Behavioral Anomaly system.
//
// Every Monday the system deterministically selects one Anomaly from the catalog
// (js/core/config.js → ANOMALIES). The selection is a pure function of the ISO
// week number, so the same week always yields the same anomaly across devices
// (matches the deterministic philosophy of Containment Protocols).
//
// The Anomaly is *never* an enemy, character or living entity. It's a diagnostic
// label attached to the current observation window.
//
// Public API:
//   Anomaly.forWeek(isoWeek)     → catalog entry deterministic by week
//   Anomaly.current()            → returns the anomaly for the *current* ISO week,
//                                  persisting it into State.data.currentAnomaly.
//   Anomaly.render()             → paints the anomaly label into #anomaly-code /
//                                  #anomaly-name / #anomaly-desc in the DOM.
import { ANOMALIES } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from './state.js';

const Anomaly = {
    forWeek(isoWeek) {
        // getISOWeek() returns a compact string like "2026-W30" — extract the
        // numeric week for deterministic modular selection across the catalog.
        const m = String(isoWeek || '').match(/W(\d+)/);
        const n = m ? parseInt(m[1], 10) : 0;
        const idx = ((n | 0) % ANOMALIES.length + ANOMALIES.length) % ANOMALIES.length;
        return ANOMALIES[idx];
    },
    current() {
        const wk = Utils.getISOWeek(new Date());
        const cur = this.forWeek(wk);
        // Persist week + id so the UI can show "AN-03 rilevata da lunedì" style copy
        // and so exports/backups carry the anomaly context.
        if (!State.data.currentAnomaly || State.data.currentAnomaly.week !== wk) {
            State.data.currentAnomaly = { week: wk, id: cur.id };
        }
        return cur;
    },
    render() {
        const cur = this.current();
        const code = $('anomaly-code'), name = $('anomaly-name'), desc = $('anomaly-desc');
        if (code) code.innerText = cur.code;
        if (name) name.innerText = cur.name;
        if (desc) desc.innerText = cur.desc;
    }
};

export { Anomaly };
