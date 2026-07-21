// O.S.I.R.I.S. — Cross-device transfer via URL hash (deflate + base64).
// Extracted verbatim from osiris-V4.html (MOD 14). Storage routed through adapter.
import { CONFIG } from '../core/config.js';
import { $ }      from '../core/dom.js';
import { AudioEngine } from '../core/audio.js';
import { State }  from '../logic/state.js';
import { getStorage } from '../core/storage/index.js';

// Late-bound (ShareURL → UI and ShareURL ↔ Backup peer cycle).
let UI = null, Backup = null;
export function bindUI(u) { UI = u; }
export function bindBackup(b) { Backup = b; }

const ShareURL = {
    build() {
        // Compact essential state — no ISO junk
        const payload = {
            v: CONFIG.SCHEMA_VERSION, t: State.data.tasks, h: State.data.history,
            s: State.data.streak, bs: State.data.bestStreak, tg: State.data.targetTasks,
            xp: State.data.xp, pr: State.data.prestige, ac: State.data.achievements,
            tc: State.data.totalTasksCompleted, tm: State.data.totalTasksMissed,
            lj: State.data.lastJudged, lbw: State.data.lastBossWeek, bh: State.data.bossHistory,
            bw: State.data.bossWeek, bd: State.data.bossDmg, bhl: State.data.bossHeal,
            cf: State.data.confessions
        };
        const b64 = Backup.b64e(JSON.stringify(payload));
        const url = `${location.origin}${location.pathname}#state=${b64}`;
        return url;
    },
    async copy() {
        try {
            const u = this.build(); await navigator.clipboard.writeText(u);
            AudioEngine.play('success'); UI.popToast("URL COPIATO. INCOLLA SU DESKTOP.");
        } catch(e) {
            const u = this.build();
            $('backup-paste-area').value = u; $('backup-paste-area').select();
            UI.popToast("URL SOTTO — COPIA MANUALMENTE.", true);
        }
    },
    checkOnBoot() {
        const m = location.hash.match(/#state=([^&]+)/);
        if (!m) return;
        try {
            const payload = JSON.parse(Backup.b64d(m[1]));
            if (payload.v !== CONFIG.SCHEMA_VERSION) throw new Error('schema');
            const ok = confirm("Rilevato stato esterno nell'URL.\nSovrascrivere la memoria locale?");
            if (ok) {
                State.data = {
                    schemaVersion: CONFIG.SCHEMA_VERSION,
                    tasks: payload.t || [], history: payload.h || {},
                    streak: payload.s || 0, bestStreak: payload.bs || 0,
                    lastJudged: payload.lj || null, targetTasks: payload.tg || 1,
                    xp: payload.xp || 0, lastBossWeek: payload.lbw || null, bossHistory: payload.bh || {},
                    achievements: payload.ac || [], prestige: payload.pr || 0,
                    totalTasksCompleted: payload.tc || 0, totalTasksMissed: payload.tm || 0,
                    bossWeek: payload.bw || null, bossDmg: payload.bd || 0, bossHeal: payload.bhl || 0,
                    confessions: Array.isArray(payload.cf) ? payload.cf : []
                };
                getStorage().set(CONFIG.STORE_KEY, JSON.stringify(State.data));
                UI.popToast("STATO IMPORTATO DA URL.");
            }
        } catch(e) { UI.popToast("URL CORROTTO. IGNORATO.", true); }
        finally {
            // Clear the hash so re-open doesn't re-prompt
            history.replaceState(null, '', location.pathname + location.search);
        }
    }
};

export { ShareURL };
