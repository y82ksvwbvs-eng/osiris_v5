// O.S.I.R.I.S. — Persistent state, schema migration, day-change detection.
// Extracted verbatim from osiris-V4.html (MOD 05). localStorage direct
// access replaced with the Storage adapter (see js/core/storage/).
import { CONFIG } from '../core/config.js';
import { Utils }  from '../core/utils.js';
import { getStorage } from '../core/storage/index.js';

// Late-bound so App.init() can register the adapter before load() runs.
const Storage = {
    get(k)    { return getStorage().get(k); },
    set(k, v) { getStorage().set(k, v); }
};

// UI is imported lazily to avoid a circular dependency (UI → State → UI).
let UI = null;
export function bindUI(uiModule) { UI = uiModule; }

const State = {
    data: {
        schemaVersion: CONFIG.SCHEMA_VERSION, tasks: [], history: {}, streak: 0, bestStreak: 0,
        lastJudged: null, targetTasks: 1, xp: 0, lastBossWeek: null, bossHistory: {},
        achievements: [], prestige: 0, totalTasksCompleted: 0, totalTasksMissed: 0,
        bossWeek: null, bossDmg: 0, bossHeal: 0, confessions: [],
        // Behavioral Monitoring model — additive, save-compat with any v3 payload.
        currentAnomaly: null,   // { week, id }  — refreshed every Monday by Anomaly.current()
        extProtocol:    null    // { week, text, resolved, success } — Extraordinary Protocol per ISO week
    },
    activeDate: Utils.todayStr(),
    currentCalendarDate: new Date(),
    pendingUncheckTask: null,

    load() {
        try {
            const raw = Storage.get(CONFIG.STORE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                this.migrate(parsed);
            }
        } catch(e) {
            console.warn("Corrupted save, attempting backup restore...");
            this.restoreBackup();
        }
        if (!this.data.history[this.activeDate]) this.data.history[this.activeDate] = { comp: [], score: null };
        this.checkDayChange();
        // CRITICAL FIX: always render the full interface after loading state.
        // Previously the UI only rendered when save() ran (i.e. on a day-change),
        // so returning same-day users saw an empty task list, empty calendar
        // (only the weekday header row) and no weekly Boss on Sunday.
        UI.renderAll();
    },
    migrate(old) {
        const v = old.schemaVersion || 1;
        this.data = { ...this.data, ...old, schemaVersion: CONFIG.SCHEMA_VERSION };
        if (v < 3) {
            if (!this.data.achievements) this.data.achievements = [];
            if (typeof this.data.prestige !== 'number') this.data.prestige = 0;
            if (typeof this.data.totalTasksCompleted !== 'number') this.data.totalTasksCompleted = 0;
            if (typeof this.data.totalTasksMissed !== 'number') this.data.totalTasksMissed = 0;
            if (typeof this.data.xp !== 'number') this.data.xp = 0;
            if (typeof this.data.bossDmg !== 'number') this.data.bossDmg = 0;
            if (typeof this.data.bossHeal !== 'number') this.data.bossHeal = 0;
            if (typeof this.data.bossWeek !== 'string' && this.data.bossWeek !== null) this.data.bossWeek = null;
        }
        if (!Array.isArray(this.data.confessions)) this.data.confessions = [];
        // Behavioral Monitoring additive fields — safe defaults for any v3 save.
        if (typeof this.data.currentAnomaly === 'undefined') this.data.currentAnomaly = null;
        if (typeof this.data.extProtocol    === 'undefined') this.data.extProtocol    = null;
    },
    save() {
        Storage.set(CONFIG.BACKUP_KEY, JSON.stringify(this.data)); // Safe write
        Storage.set(CONFIG.STORE_KEY, JSON.stringify(this.data));
        UI.renderAll();
    },
    restoreBackup() {
        try {
            const b = Storage.get(CONFIG.BACKUP_KEY);
            if (b) { this.migrate(JSON.parse(b)); UI.popToast("RIPRISTINO DA BACKUP INTERNO.", true); }
        } catch(e) { UI.popToast("ERRORE FATALE STORAGE.", true); }
    },
    checkDayChange() {
        const today = Utils.todayStr();
        if (this.activeDate !== today) {
            this.activeDate = today;
            if (!this.data.history[today]) this.data.history[today] = { comp: [], score: null };
            
            // Streak broken check
            if (this.data.lastJudged) {
                const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                const yStr = Utils.dateToStr(yesterday);
                const yData = this.data.history[yStr];
                if (!yData || yData.score !== 100) {
                    if (this.data.lastJudged !== this.activeDate) this.data.streak = 0;
                }
            }
            this.save();
        }
    }
};

export { State };
