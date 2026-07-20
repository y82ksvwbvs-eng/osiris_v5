// O.S.I.R.I.S. — Pure utility helpers (dates, escaping, ISO weeks, vibrations)
// Extracted verbatim from osiris-V4.html (MOD 03)
import { CONFIG } from './config.js';

const Utils = {
    todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },
    dateToStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },
    escapeHTML(str) { return String(str).replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag)); },
    getISOWeek(d) {
        const t = new Date(d.valueOf());
        const dayNum = (d.getDay() + 6) % 7;
        t.setDate(t.getDate() - dayNum + 3);
        const firstThursday = t.valueOf();
        t.setMonth(0, 1);
        if (t.getDay() !== 4) t.setMonth(0, 1 + ((4 - t.getDay()) + 7) % 7);
        const weekNum = 1 + Math.ceil((firstThursday - t) / 604800000);
        return `${d.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
    },
    isSunday(d = new Date()) { return d.getDay() === 0; },
    triggerVibe(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); },
    avgOverDays(n, history) {
        const scores = [];
        for (let i = 0; i < n; i++) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const h = history[this.dateToStr(d)];
            if (h && h.score !== null) scores.push(h.score);
        }
        return scores.length === 0 ? null : Math.round(scores.reduce((a,b) => a + b, 0) / scores.length);
    },
    last7DaysScores(history) {
        const out = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = this.dateToStr(d);
            const h = history[ds];
            out.push({ date: ds, score: (h && h.score !== null) ? h.score : null, dow: CONFIG.DOW[(d.getDay() + 6) % 7], isToday: ds === this.todayStr() });
        }
        return out;
    }
};

export { Utils };
