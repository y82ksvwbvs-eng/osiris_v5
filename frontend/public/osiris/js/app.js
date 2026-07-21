// O.S.I.R.I.S. — Application entry point.
//
// Init order (never reversed):
//   Config → Core (dom, utils, audio, storage) → Logic → Features → UI → Events → Render.
//
// Cross-module bindings are late-wired here to keep every module import DAG acyclic:
// modules that must call each other at *runtime* (e.g. UI ↔ Logic, Logic ↔ Reveal)
// receive their peers via bind* setters instead of via direct `import` cycles.
//
// Every symbol referenced from inline HTML `onclick="Foo.bar()"` attributes is
// re-exposed on `window` so behavior stays identical to the original single-file build.

import { CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS, ANOMALIES, CONTAINMENT_THRESHOLDS, EXT_PROTOCOL } from './core/config.js';
import { Utils }                from './core/utils.js';
import { DOM, $ }               from './core/dom.js';
import { AudioEngine }          from './core/audio.js';
import { LocalStorageAdapter, setStorage } from './core/storage/index.js';

import { State, bindUI as bindStateUI }      from './logic/state.js';
import { Corruption }                        from './logic/corruption.js';
import { Purgatory }                         from './logic/purgatory.js';
import { Gamification, bindUI as bindGamificationUI } from './logic/gamification.js';
import { BossHP, bindContainment as bindBossContainment } from './logic/bossHp.js';
import { Anomaly }                           from './logic/anomaly.js';
import { Containment, bindUI as bindContainmentUI } from './logic/containment.js';
import { Logic, bindUI as bindLogicUI }      from './logic/logic.js';

import { Narrator }                          from './features/narrator.js';
import { Streak }                            from './features/streak.js';
import { Suggestions, bindLogic as bindSuggestionsLogic } from './features/suggestions.js';
import { Backup,        bindUI as bindBackupUI, bindShareURL as bindBackupShareURL }   from './features/backup.js';
import { CanvasExport,  bindUI as bindCanvasUI }      from './features/canvasExport.js';
import { ShareURL,      bindUI as bindShareUI, bindBackup as bindShareBackup }        from './features/shareURL.js';
import { Reorder,       bindUI as bindReorderUI }     from './features/reorder.js';
import { TrophyUI,      bindUI as bindTrophyUI_UI }   from './features/trophyUi.js';
import { ExtProtocol,   bindUI as bindExtProtocolUI } from './features/extraordinary.js';

import { UI, bindDeps as bindUIDeps }        from './ui/ui.js';
import { Reveal, bindUI as bindRevealUI }    from './ui/reveal.js';
import { runBoot }                           from './ui/boot.js';

const App = {
    init() {
        // 1. Config is already imported.
        // 2. Core: DOM, utils, audio are stateless singletons.
        // 3. Storage: install the default adapter BEFORE any consumer reads state.
        setStorage(new LocalStorageAdapter());

        // 4. Late bindings — resolve the runtime graph without import cycles.
        bindStateUI(UI);
        bindLogicUI(UI, Reveal, Reorder);
        bindGamificationUI(UI);
        bindBossContainment(Containment);
        bindContainmentUI(UI);
        bindExtProtocolUI(UI);
        bindSuggestionsLogic(Logic);
        bindBackupUI(UI);
        bindBackupShareURL(ShareURL);
        bindCanvasUI(UI);
        bindShareUI(UI);
        bindShareBackup(Backup);
        bindReorderUI(UI);
        bindTrophyUI_UI(UI);
        bindRevealUI(UI);
        bindUIDeps({ Logic, Reveal, Reorder, TrophyUI, Anomaly, ExtProtocol });

        // 5. Expose everything referenced from inline `onclick=` HTML attributes.
        //    The original single-file build relied on script-scope globals; ES-module
        //    scope isolates them, so we re-attach the *exact* names to `window`.
        Object.assign(window, {
            CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS,
            ANOMALIES, CONTAINMENT_THRESHOLDS, EXT_PROTOCOL,
            Utils, DOM, $, AudioEngine,
            State, Corruption, Purgatory, Gamification, BossHP, Anomaly, Containment, Logic,
            Narrator, Streak, Suggestions, Backup, CanvasExport, ShareURL, Reorder, TrophyUI, ExtProtocol,
            UI, Reveal, runBoot
        });

        // 6. Boot the app exactly as the original inline `window.onload` did.
        this._boot();
    },

    _boot() {
        // -------- IMMEDIATE UI SYNC (Directive 1: no --.--.---- or ... at boot) --------
        (function syncDateTimeNow(){
            const d = new Date();
            const dd = String(d.getDate()).padStart(2,'0');
            const mm = String(d.getMonth()+1).padStart(2,'0');
            const yyyy = d.getFullYear();
            const dEl = $('date-display'); if (dEl) dEl.innerText = `${dd}.${mm}.${yyyy}`;
            const cEl = $('clock-display');
            const tick = () => {
                const n = new Date();
                const hh = String(n.getHours()).padStart(2,'0');
                const mi = String(n.getMinutes()).padStart(2,'0');
                const ss = String(n.getSeconds()).padStart(2,'0');
                if (cEl) cEl.innerText = `${hh}:${mi}:${ss}`;
                // Roll date at midnight
                const cur = `${String(n.getDate()).padStart(2,'0')}.${String(n.getMonth()+1).padStart(2,'0')}.${n.getFullYear()}`;
                if (dEl && dEl.innerText !== cur) dEl.innerText = cur;
            }; tick(); setInterval(tick, 1000);
            // Calendar label immediate (no "..." state)
            State.currentCalendarDate = new Date();
            const lbl = $('calendar-month-label');
            if (lbl) lbl.innerText = `${CONFIG.MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        })();

        $('action-form').addEventListener('submit', (e) => { e.preventDefault(); Logic.addTask($('action-input').value.trim().toUpperCase()); });
        setInterval(() => State.checkDayChange(), 30000);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') State.checkDayChange(); });
        window.addEventListener('focus', () => State.checkDayChange());

        // Directive 3: URL hash import prompt
        ShareURL.checkOnBoot();

        if (sessionStorage.getItem('osiris_booted')) {
            $('intro-overlay').classList.add('hidden'); $('main-content').classList.remove('opacity-0'); State.load();
        } else {
            $('intro-overlay').classList.remove('hidden'); $('intro-overlay').style.display = 'flex';
            $('enter-app-btn').addEventListener('click', () => {
                AudioEngine.play('type'); Utils.triggerVibe(15); $('intro-overlay').style.opacity = '0';
                setTimeout(() => { $('intro-overlay').style.display = 'none'; runBoot(); }, 500);
            });
        }
    }
};

// The original code booted from `window.onload`. Preserve that timing exactly.
if (document.readyState === 'complete') App.init();
else window.addEventListener('load', () => App.init());

export { App };
