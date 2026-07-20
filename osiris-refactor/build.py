#!/usr/bin/env python3
"""
O.S.I.R.I.S. Refactor Extractor
Splits osiris-V4.html into a modular static app while preserving
byte-identical CSS/JS content wherever possible.
"""
import os
import re
from pathlib import Path

SRC = Path(__file__).parent / "osiris-V4.html"
OUT = Path(__file__).parent

# -------- read source --------
raw = SRC.read_text(encoding="utf-8")
lines = raw.split("\n")  # 1-based indexing by using lines[i-1]

def slice_lines(a, b):
    """Return lines a..b inclusive (1-based) joined with newlines."""
    return "\n".join(lines[a-1:b])

# ================================================================
# CSS EXTRACTION — preserve exact byte order
# Original stylesheet lives on lines 42..470 (inside <style>...</style>)
# Split by section boundaries (comment banners "01 //", "02 //", ... "09 //")
# ================================================================
# From our analysis:
#  01: 42-78
#  02: 80-209
#  03: 211-220
#  04: 222-240
#  05: 242-281
#  06: 283-341
#  07: 343-391
#  08: 393-425
#  09: 427-470
#
# We group so that concatenation (base + animations + components)
# reproduces the ORIGINAL cascade order (01..09) exactly.
#   base.css       = sections 01, 02, 03, 04     (42-240)
#   animations.css = section  05                 (242-281)
#   components.css = sections 06, 07, 08, 09     (283-470)

base_css       = slice_lines(42, 240)
animations_css = slice_lines(242, 281)
components_css = slice_lines(283, 470)

# ================================================================
# JS EXTRACTION — module by module.
# Each block below is a lossless slice of the original script.
# We only add ES-module `export` wrappers and `import` statements
# at the top; the *bodies* of every object literal / function stay
# byte-identical to the source.
# ================================================================
JS_BLOCKS = {
    # (start, end, name)  – 1-based inclusive
    "config":       (900, 960),   # CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS
    "narrator":     (966, 1044),  # const Narrator = { ... };
    "utils":        (1049, 1084), # const Utils = { ... };
    "dom":          (1086, 1090), # const DOM + const $ = id => DOM.get(id);
    "audio":        (1095, 1145), # const AudioEngine = { ... };
    "state":        (1150, 1224), # const State = { ... };
    "corruption":   (1229, 1251), # const Corruption = { ... };
    "purgatory":    (1253, 1267), # const Purgatory = { ... };
    "streak":       (1272, 1314), # const Streak = { ... };
    "gamification": (1319, 1369), # const Gamification = { ... };
    "logic":        (1374, 1516), # const Logic = { ... };
    "suggestions":  (1521, 1562), # const Suggestions = { ... };
    "ui":           (1567, 1813), # const UI = { ... };
    "reveal":       (1818, 1989), # const Reveal = { ... };
    "backup":       (1994, 2038), # const Backup = { ... };
    "canvasExport": (2040, 2100), # const CanvasExport = { ... };
    "bossHp":       (2105, 2145), # const BossHP = { ... };
    "shareURL":     (2150, 2204), # const ShareURL = { ... };
    "reorder":      (2212, 2251), # const Reorder = { ... };
    "trophyUi":     (2256, 2277), # const TrophyUI = { ... };
    # 2278..2330 -> bootstrap (runBoot + window.onload), handled separately
}

def block(name):
    a, b = JS_BLOCKS[name][0], JS_BLOCKS[name][1]
    return slice_lines(a, b)

# ---------- extract every JS block into a string dict ----------
js = {k: block(k) for k in JS_BLOCKS}

# runBoot + bootstrap tail (lines 2278..2330 inclusive)
bootstrap_tail = slice_lines(2278, 2330)

# ================================================================
# WRITE OUTPUT TREE
# ================================================================
def w(path, content):
    p = OUT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    print(f"  wrote {path}  ({len(content):>6} bytes)")

# ---------- CSS ----------
w("assets/css/base.css",       base_css)
w("assets/css/animations.css", animations_css)
w("assets/css/components.css", components_css)

# ---------- JS core ----------
w("js/core/config.js", f"""// O.S.I.R.I.S. — Configuration constants
// Extracted verbatim from osiris-V4.html (MOD 01)
{js['config']}

export {{ CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS }};
""")

w("js/core/utils.js", f"""// O.S.I.R.I.S. — Pure utility helpers (dates, escaping, ISO weeks, vibrations)
// Extracted verbatim from osiris-V4.html (MOD 03)
import {{ CONFIG }} from './config.js';

{js['utils']}

export {{ Utils }};
""")

w("js/core/dom.js", f"""// O.S.I.R.I.S. — DOM element cache + $() shorthand
// Extracted verbatim from osiris-V4.html (MOD 03)
{js['dom']}

export {{ DOM, $ }};
""")

w("js/core/audio.js", f"""// O.S.I.R.I.S. — Web Audio synth engine (type/check/error/success/process/glitch/levelup)
// Extracted verbatim from osiris-V4.html (MOD 04)
{js['audio']}

export {{ AudioEngine }};
""")

# ---------- Storage layer (Phase 4) ----------
w("js/core/storage/StorageInterface.js", """// O.S.I.R.I.S. — Storage abstraction contract.
//
// All persistence must go through an adapter that implements this shape.
// Business logic (State, Backup, ShareURL) must never touch window.localStorage
// directly. Swapping backends (localStorage → Firebase → IndexedDB) then becomes
// a one-line change in app.js.
//
// Contract:
//   get(key)        -> string | null   (synchronous, mirrors localStorage.getItem)
//   set(key, value) -> void            (synchronous, mirrors localStorage.setItem)
//   remove(key)     -> void
//   backup(srcKey, backupKey)   -> void  copies srcKey to backupKey
//   restore(backupKey, dstKey)  -> string | null  copies backupKey to dstKey
//
// The current LocalStorageAdapter is intentionally synchronous to preserve
// the exact call semantics of the original inline code.

export class StorageInterface {
    get(_key)                 { throw new Error('StorageInterface.get not implemented'); }
    set(_key, _value)         { throw new Error('StorageInterface.set not implemented'); }
    remove(_key)              { throw new Error('StorageInterface.remove not implemented'); }
    backup(_src, _dst)        { throw new Error('StorageInterface.backup not implemented'); }
    restore(_backup, _dst)    { throw new Error('StorageInterface.restore not implemented'); }
}
""")

w("js/core/storage/LocalStorageAdapter.js", """// O.S.I.R.I.S. — Default storage adapter: browser localStorage.
// Mirrors the exact byte-for-byte behavior of the original inline calls.
import { StorageInterface } from './StorageInterface.js';

export class LocalStorageAdapter extends StorageInterface {
    get(key)          { return localStorage.getItem(key); }
    set(key, value)   { localStorage.setItem(key, value); }
    remove(key)       { localStorage.removeItem(key); }
    backup(src, dst)  {
        const v = localStorage.getItem(src);
        if (v !== null) localStorage.setItem(dst, v);
    }
    restore(backup, dst) {
        const v = localStorage.getItem(backup);
        if (v !== null) localStorage.setItem(dst, v);
        return v;
    }
}
""")

w("js/core/storage/FirebaseAdapter.js", """// O.S.I.R.I.S. — Firebase storage adapter (STUB).
//
// Present for architectural completeness. Not wired into the app.
// When you're ready to migrate:
//   1. Add firebase-app.js + firebase-firestore.js (or the modular v10 SDK) to index.html
//   2. Fill in the constructor with your Firebase config
//   3. Implement each method to read/write a per-user document
//   4. In js/app.js swap `new LocalStorageAdapter()` -> `new FirebaseAdapter(...)`.
//
// The adapter must remain synchronous OR you must make State.load/save async as well.
// See docs/firebase-migration.md for the full playbook.
import { StorageInterface } from './StorageInterface.js';

export class FirebaseAdapter extends StorageInterface {
    constructor(config /* { apiKey, projectId, userId, ... } */) {
        super();
        this._config = config || null;
        // TODO: initialize Firebase app + Firestore client here
    }
    get(_key)         { throw new Error('FirebaseAdapter.get: not implemented (stub)'); }
    set(_key, _value) { throw new Error('FirebaseAdapter.set: not implemented (stub)'); }
    remove(_key)      { throw new Error('FirebaseAdapter.remove: not implemented (stub)'); }
    backup(_s, _d)    { throw new Error('FirebaseAdapter.backup: not implemented (stub)'); }
    restore(_b, _d)   { throw new Error('FirebaseAdapter.restore: not implemented (stub)'); }
}
""")

w("js/core/storage/index.js", """// Storage barrel — a single import point for the storage layer.
export { StorageInterface }   from './StorageInterface.js';
export { LocalStorageAdapter } from './LocalStorageAdapter.js';
export { FirebaseAdapter }     from './FirebaseAdapter.js';

// Module-level singleton, wired in App.init() before any consumer touches it.
let _storage = null;
export function setStorage(adapter) { _storage = adapter; }
export function getStorage()        {
    if (!_storage) throw new Error('Storage not initialized. Call setStorage() in App.init().');
    return _storage;
}
""")

# ---------- Logic layer ----------
# State: rewrite the 5 direct localStorage calls to route through the Storage
# adapter. Everything else stays byte-identical.
state_src = js['state']
state_routed = state_src \
    .replace("localStorage.getItem(CONFIG.STORE_KEY)",  "Storage.get(CONFIG.STORE_KEY)") \
    .replace("localStorage.setItem(CONFIG.BACKUP_KEY, JSON.stringify(this.data))",
             "Storage.set(CONFIG.BACKUP_KEY, JSON.stringify(this.data))") \
    .replace("localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(this.data))",
             "Storage.set(CONFIG.STORE_KEY, JSON.stringify(this.data))") \
    .replace("localStorage.getItem(CONFIG.BACKUP_KEY)", "Storage.get(CONFIG.BACKUP_KEY)")

w("js/logic/state.js", f"""// O.S.I.R.I.S. — Persistent state, schema migration, day-change detection.
// Extracted verbatim from osiris-V4.html (MOD 05). localStorage direct
// access replaced with the Storage adapter (see js/core/storage/).
import {{ CONFIG }} from '../core/config.js';
import {{ Utils }}  from '../core/utils.js';
import {{ getStorage }} from '../core/storage/index.js';

// Late-bound so App.init() can register the adapter before load() runs.
const Storage = {{
    get(k)    {{ return getStorage().get(k); }},
    set(k, v) {{ getStorage().set(k, v); }}
}};

// UI is imported lazily to avoid a circular dependency (UI → State → UI).
let UI = null;
export function bindUI(uiModule) {{ UI = uiModule; }}

{state_routed}

export {{ State }};
""")

# Corruption + Purgatory share MOD 06 in the original — keep them together
w("js/logic/corruption.js", f"""// O.S.I.R.I.S. — CRT corruption FX driver (chromatic aberration + glitch band + shake).
// Extracted verbatim from osiris-V4.html (MOD 06).
import {{ AudioEngine }} from '../core/audio.js';

{js['corruption']}

export {{ Corruption }};
""")

w("js/logic/purgatory.js", f"""// O.S.I.R.I.S. — Purgatorio mode (3+ consecutive failed cycles).
// Extracted verbatim from osiris-V4.html (MOD 06).
import {{ CONFIG }} from '../core/config.js';
import {{ State }}  from './state.js';

{js['purgatory']}

export {{ Purgatory }};
""")

w("js/logic/gamification.js", f"""// O.S.I.R.I.S. — XP curve, level names, grades, prestige.
// Extracted verbatim from osiris-V4.html (MOD 08).
import {{ LEVEL_NAMES, GRADES }} from '../core/config.js';
import {{ State }} from './state.js';

{js['gamification']}

export {{ Gamification }};
""")

w("js/logic/bossHp.js", f"""// O.S.I.R.I.S. — Weekly Boss integrity (HP bar, dmg/heal accounting, weekly reset).
// Extracted verbatim from osiris-V4.html (MOD 13).
import {{ Utils }} from '../core/utils.js';
import {{ State }} from './state.js';

{js['bossHp']}

export {{ BossHP }};
""")

# Logic itself — the fat orchestrator. It references almost every feature.
w("js/logic/logic.js", f"""// O.S.I.R.I.S. — Orchestrator: addTask, toggleTask, triggerJudgment, triggerBossJudgment, purge, prestige.
// Extracted verbatim from osiris-V4.html (MOD 09).
import {{ CONFIG }}       from '../core/config.js';
import {{ Utils }}        from '../core/utils.js';
import {{ $ }}            from '../core/dom.js';
import {{ AudioEngine }}  from '../core/audio.js';
import {{ State }}        from './state.js';
import {{ Corruption }}   from './corruption.js';
import {{ Purgatory }}    from './purgatory.js';
import {{ Gamification }} from './gamification.js';
import {{ BossHP }}       from './bossHp.js';
import {{ Streak }}       from '../features/streak.js';
import {{ Narrator }}     from '../features/narrator.js';

// Late-bound to break UI ↔ Logic circular imports.
let UI = null, Reveal = null;
export function bindUI(uiMod, revealMod) {{ UI = uiMod; Reveal = revealMod; }}

{js['logic']}

export {{ Logic }};
""")

# ---------- Features ----------
w("js/features/narrator.js", f"""// O.S.I.R.I.S. — Narrator: level-aware verdict phrases (three tiers).
// Extracted verbatim from osiris-V4.html (MOD 02).
{js['narrator']}

export {{ Narrator }};
""")

w("js/features/streak.js", f"""// O.S.I.R.I.S. — Streak visualization tiers + best-streak persistence.
// Extracted verbatim from osiris-V4.html (MOD 07).
import {{ $ }}     from '../core/dom.js';
import {{ State }} from '../logic/state.js';

{js['streak']}

export {{ Streak }};
""")

w("js/features/suggestions.js", f"""// O.S.I.R.I.S. — Deterministic daily task suggestions (24h rotation).
// Extracted verbatim from osiris-V4.html (MOD 10).
import {{ TASK_SUGGESTIONS }} from '../core/config.js';
import {{ Utils }}            from '../core/utils.js';
import {{ $ }}                from '../core/dom.js';
import {{ AudioEngine }}      from '../core/audio.js';
import {{ State }}            from '../logic/state.js';

// Late-bound (Suggestions → Logic → Suggestions via inline handlers).
let Logic = null;
export function bindLogic(l) {{ Logic = l; }}

{js['suggestions']}

export {{ Suggestions }};
""")

w("js/features/backup.js", f"""// O.S.I.R.I.S. — Import / export archive (JSON file, base64 blob).
// Extracted verbatim from osiris-V4.html (MOD 12).
import {{ CONFIG }} from '../core/config.js';
import {{ Utils }}  from '../core/utils.js';
import {{ $ }}      from '../core/dom.js';
import {{ State }}  from '../logic/state.js';

// Late-bound (Backup → UI → Backup via inline handlers).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{js['backup']}

export {{ Backup }};
""")

w("js/features/canvasExport.js", f"""// O.S.I.R.I.S. — Verdict → PNG sigil (canvas rasterizer + Web Share).
// Extracted verbatim from osiris-V4.html (MOD 12).
import {{ $ }}     from '../core/dom.js';
import {{ State }} from '../logic/state.js';

// Late-bound (CanvasExport → UI → CanvasExport via inline handlers).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{js['canvasExport']}

export {{ CanvasExport }};
""")

# ShareURL rewrites the 1 direct localStorage.setItem to route through Storage.
shareURL_src = js['shareURL'].replace(
    "localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(State.data))",
    "getStorage().set(CONFIG.STORE_KEY, JSON.stringify(State.data))"
)
w("js/features/shareURL.js", f"""// O.S.I.R.I.S. — Cross-device transfer via URL hash (deflate + base64).
// Extracted verbatim from osiris-V4.html (MOD 14). Storage routed through adapter.
import {{ CONFIG }} from '../core/config.js';
import {{ $ }}      from '../core/dom.js';
import {{ State }}  from '../logic/state.js';
import {{ getStorage }} from '../core/storage/index.js';

// Late-bound (ShareURL → UI → ShareURL via inline handlers on modal buttons).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{shareURL_src}

export {{ ShareURL }};
""")

w("js/features/reorder.js", f"""// O.S.I.R.I.S. — Tap-to-select / tap-to-place task reordering.
// Extracted verbatim from osiris-V4.html (MOD 15).
import {{ AudioEngine }} from '../core/audio.js';
import {{ State }}       from '../logic/state.js';

// Late-bound (Reorder ↔ UI).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{js['reorder']}

export {{ Reorder }};
""")

w("js/features/trophyUi.js", f"""// O.S.I.R.I.S. — Trophies modal open/close + progress bar.
// Extracted verbatim from osiris-V4.html (MOD 16).
import {{ AudioEngine }} from '../core/audio.js';

// Late-bound (TrophyUI → UI → TrophyUI).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{js['trophyUi']}

export {{ TrophyUI }};
""")

# ---------- UI ----------
w("js/ui/ui.js", f"""// O.S.I.R.I.S. — Rendering, modals, toasts, calendar, task list, reveal orchestration.
// Extracted verbatim from osiris-V4.html (MOD 11).
import {{ CONFIG, ACHIEVEMENTS }} from '../core/config.js';
import {{ Utils }}                from '../core/utils.js';
import {{ $ }}                    from '../core/dom.js';
import {{ AudioEngine }}          from '../core/audio.js';
import {{ State }}                from '../logic/state.js';
import {{ Corruption }}           from '../logic/corruption.js';
import {{ Purgatory }}            from '../logic/purgatory.js';
import {{ Gamification }}         from '../logic/gamification.js';
import {{ BossHP }}               from '../logic/bossHp.js';
import {{ Streak }}               from '../features/streak.js';
import {{ Suggestions }}          from '../features/suggestions.js';

// Late-bound to break UI ↔ Logic / Reveal / Reorder circular imports.
let Logic = null, Reveal = null, Reorder = null, TrophyUI = null;
export function bindDeps(deps) {{ Logic = deps.Logic; Reveal = deps.Reveal; Reorder = deps.Reorder; TrophyUI = deps.TrophyUI; }}

{js['ui']}

export {{ UI }};
""")

w("js/ui/reveal.js", f"""// O.S.I.R.I.S. — Verdict reveal sequence (typewriter, count-up, staggered panels).
// Extracted verbatim from osiris-V4.html (MOD 11b).
import {{ Utils }}       from '../core/utils.js';
import {{ $ }}           from '../core/dom.js';
import {{ AudioEngine }} from '../core/audio.js';
import {{ State }}       from '../logic/state.js';
import {{ Gamification }} from '../logic/gamification.js';
import {{ Narrator }}    from '../features/narrator.js';

// Late-bound (Reveal → UI → Reveal).
let UI = null;
export function bindUI(u) {{ UI = u; }}

{js['reveal']}

export {{ Reveal }};
""")

w("js/ui/boot.js", f"""// O.S.I.R.I.S. — Boot terminal sequence (typewriter kernel log).
// Extracted verbatim from osiris-V4.html (bottom of MOD 17 / bootstrap).
import {{ $ }}           from '../core/dom.js';
import {{ AudioEngine }} from '../core/audio.js';
import {{ State }}       from '../logic/state.js';

export function runBoot() {{
    const s = $('boot-screen'), t = $('boot-text'); s.classList.remove('hidden'); s.style.display = 'flex';
    const lines = ["INIZIALIZZAZIONE KERNEL O.S.I.R.I.S. v3.0...", "CARICAMENTO MODULI DI CONTROLLO PSICOLOGICO [OK]", "MODULO AUDIO ELIMINATO: REQUISITO UTENTE SODDISFATTO", "VERIFICA INTEGRITÀ DEL SOGGETTO... [FALLITA: RILEVATA DEBOLEZZA]", "AVVIO INTERFACCIA OPERATIVA. PREPARARSI AL GIUDIZIO."];
    let i = 0;
    const typeLine = () => {{
        if (i < lines.length) {{ t.innerHTML += lines[i++] + "<br>"; AudioEngine.play('process'); setTimeout(typeLine, 200 + Math.random() * 300); }}
        else setTimeout(() => {{ s.style.opacity = '0'; $('main-content').classList.remove('opacity-0'); sessionStorage.setItem('osiris_booted', 'true'); setTimeout(() => {{ s.style.display = 'none'; State.load(); }}, 400); }}, 800);
    }}; setTimeout(typeLine, 500);
}}
""")

# ---------- app.js entry ----------
w("js/app.js", """// O.S.I.R.I.S. — Application entry point.
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

import { CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS } from './core/config.js';
import { Utils }                from './core/utils.js';
import { DOM, $ }               from './core/dom.js';
import { AudioEngine }          from './core/audio.js';
import { LocalStorageAdapter, setStorage } from './core/storage/index.js';

import { State, bindUI as bindStateUI }      from './logic/state.js';
import { Corruption }                        from './logic/corruption.js';
import { Purgatory }                         from './logic/purgatory.js';
import { Gamification }                      from './logic/gamification.js';
import { BossHP }                            from './logic/bossHp.js';
import { Logic, bindUI as bindLogicUI }      from './logic/logic.js';

import { Narrator }                          from './features/narrator.js';
import { Streak }                            from './features/streak.js';
import { Suggestions, bindLogic as bindSuggestionsLogic } from './features/suggestions.js';
import { Backup,        bindUI as bindBackupUI }      from './features/backup.js';
import { CanvasExport,  bindUI as bindCanvasUI }      from './features/canvasExport.js';
import { ShareURL,      bindUI as bindShareUI }       from './features/shareURL.js';
import { Reorder,       bindUI as bindReorderUI }     from './features/reorder.js';
import { TrophyUI,      bindUI as bindTrophyUI_UI }   from './features/trophyUi.js';

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
        bindLogicUI(UI, Reveal);
        bindSuggestionsLogic(Logic);
        bindBackupUI(UI);
        bindCanvasUI(UI);
        bindShareUI(UI);
        bindReorderUI(UI);
        bindTrophyUI_UI(UI);
        bindRevealUI(UI);
        bindUIDeps({ Logic, Reveal, Reorder, TrophyUI });

        // 5. Expose everything referenced from inline `onclick=` HTML attributes.
        //    The original single-file build relied on script-scope globals; ES-module
        //    scope isolates them, so we re-attach the *exact* names to `window`.
        Object.assign(window, {
            CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS,
            Utils, DOM, $, AudioEngine,
            State, Corruption, Purgatory, Gamification, BossHP, Logic,
            Narrator, Streak, Suggestions, Backup, CanvasExport, ShareURL, Reorder, TrophyUI,
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
""")

# ================================================================
# INDEX.HTML — markup only. Everything between the original <style>...</style>
# is replaced by <link rel="stylesheet"> tags and everything between the
# original <script>...</script> (MODs 01..17 + bootstrap) becomes a single
# <script type="module" src="./js/app.js"></script>. All markup is preserved
# BYTE-IDENTICALLY between the closing </script> at line 40 and the opening
# <script> at line 894 (the body).
# ================================================================
# Line 1..11:   <!DOCTYPE>...<link fonts>
# Line 12..40:  tailwind.config <script>  ← keep
# Line 41..471: <style>...</style>         ← REPLACE with 3 <link> tags
# Line 472:     </head>
# Line 473..893:<body ...>...</body-inner> (markup)
# Line 894..2331: <script>...</script>     ← REPLACE with 1 module <script>
# Line 2332:    (cloudflare tracking iframe) ← DROP (not part of app)
# Line 2333:    </html>

head_top   = slice_lines(1, 40)          # doctype → tailwind config
body_html  = slice_lines(472, 893)       # </head> through closing modal + toast container
# NOTE: line 893 is a blank line before `<!-- SCRIPTS // LOGIC -->` comment at 891.
# We must NOT include the original SCRIPTS comment banner. Let's verify by
# reading 891-894 range… (890-894 shown earlier).
# Line 891: <!-- ============================================================
# Line 892:    SCRIPTS // LOGIC
# Line 893: ============================================================ -->
# Line 894: <script>
# So slice_lines(472, 890) gives us everything up to and including the closing
# </div> for the toast container (line 889) plus the blank line 890.
body_html = slice_lines(472, 890)

index_html = f"""{head_top}
    <!-- Extracted styles (Phase 1). Load order reproduces the original cascade (sections 01→09). -->
    <link rel="stylesheet" href="./assets/css/base.css">
    <link rel="stylesheet" href="./assets/css/animations.css">
    <link rel="stylesheet" href="./assets/css/components.css">
</head>
{body_html}

<!-- ============================================================
   SCRIPTS // ES-MODULE ENTRY (Phase 9)
============================================================ -->
<script type="module" src="./js/app.js"></script>
</body>
</html>
"""
w("index.html", index_html)

# .nojekyll — recommended for GitHub Pages so it serves the js/ folder.
w(".nojekyll", "")

print("\n✔ Extraction complete.")
