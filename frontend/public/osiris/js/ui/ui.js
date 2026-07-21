// O.S.I.R.I.S. — Rendering, modals, toasts, calendar, task list, reveal orchestration.
// Extracted verbatim from osiris-V4.html (MOD 11).
import { CONFIG, ACHIEVEMENTS } from '../core/config.js';
import { Utils }                from '../core/utils.js';
import { $ }                    from '../core/dom.js';
import { AudioEngine }          from '../core/audio.js';
import { State }                from '../logic/state.js';
import { Corruption }           from '../logic/corruption.js';
import { Purgatory }            from '../logic/purgatory.js';
import { Gamification }         from '../logic/gamification.js';
import { BossHP }               from '../logic/bossHp.js';
import { Streak }               from '../features/streak.js';
import { Suggestions }          from '../features/suggestions.js';

// Late-bound to break UI ↔ Logic / Reveal / Reorder circular imports.
let Logic = null, Reveal = null, Reorder = null, TrophyUI = null, Anomaly = null, ExtProtocol = null;
export function bindDeps(deps) {
    Logic = deps.Logic; Reveal = deps.Reveal; Reorder = deps.Reorder; TrophyUI = deps.TrophyUI;
    Anomaly = deps.Anomaly; ExtProtocol = deps.ExtProtocol;
}

const UI = {
    renderAll() {
        const d = State.data, hData = d.history[State.activeDate] || { comp: [], score: null };
        const total = d.tasks.length, comp = d.tasks.filter(t => hData.comp.includes(t)).length;
        const pct = total === 0 ? 0 : Math.round((comp / total) * 100);

        $('streak-counter').innerText = d.streak; $('best-streak').innerText = d.bestStreak;
        Streak.apply();
        $('progress-text').innerText = `${pct}% [${comp}/${total}]`; $('progress-bar-fill').style.width = `${pct}%`;
        
        if (d.prestige > 0) { $('prestige-badge').innerText = `P${d.prestige}`; $('prestige-badge').classList.remove('hidden'); }
        
        const trgLabel = $('target-task-display'), trgCount = $('target-task-count');
        if (d.targetTasks && d.tasks.length < d.targetTasks) { trgLabel.classList.remove('hidden'); trgCount.innerText = d.targetTasks; } 
        else trgLabel.classList.add('hidden');

        const aw = Utils.avgOverDays(7, d.history), am = Utils.avgOverDays(30, d.history);
        $('avg-week').innerText = aw === null ? '--%' : `${aw}%`; $('avg-month').innerText = am === null ? '--%' : `${am}%`;

        const appBody = $('app-body'), statusPixel = $('status-pixel');
        appBody.classList.remove('state-neutral', 'state-error', 'state-success');
        statusPixel.className = "w-2.5 h-2.5 rounded-none animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)] flex-shrink-0 ";
        
        if (hData.score !== null) {
            if (hData.score === 100) { appBody.classList.add('state-success'); statusPixel.classList.add('bg-monolith-toxic', 'shadow-monolith-toxic'); }
            else { appBody.classList.add('state-error'); statusPixel.classList.add('bg-monolith-blood', 'shadow-monolith-blood'); }
        } else { appBody.classList.add('state-neutral'); statusPixel.classList.add('bg-white'); }

        this.renderTasks(hData);
        this.renderCalendar();
        Suggestions.render();
        Purgatory.evaluate();
        BossHP.render();
        // Behavioral Monitoring: refresh the weekly Anomaly banner every render.
        if (Anomaly) Anomaly.render();
        
        // Boss vs Daily Toggle
        const canFightBoss = Utils.isSunday() && State.data.lastBossWeek !== Utils.getISOWeek(new Date());
        $('boss-battle-wrap').classList.toggle('on', canFightBoss);
        $('daily-judgment-wrap').classList.toggle('off', canFightBoss);
        
        if(canFightBoss) {
            const bPct = Utils.avgOverDays(7, d.history) || 0;
            const bTier = Gamification.bossTier(bPct);
            $('btn-boss-main').className = `btn-boss ${bTier.css}`;
        }
    },
    renderTasks(hData) {
        const list = $('task-list'), isJudged = hData.score !== null;
        if (State.data.tasks.length === 0) {
            list.innerHTML = `<div class="font-mono text-[10px] sm:text-xs text-monolith-textDim italic py-10 text-center border-2 border-dashed border-monolith-border uppercase tracking-widest">MEMORIA SOGGETTO VUOTA. INSERIRE DIRETTIVA.</div>`;
            return;
        }
        const reorder = Reorder.active;
        list.innerHTML = State.data.tasks.map((task, i) => {
            const isDone = hData.comp.includes(task);
            let podClass = `task-pod flex items-center justify-between p-3 sm:p-4 border-2 transition-all duration-200 ${isDone ? 'completed opacity-50 border-monolith-textDim bg-[#0a0a0c]' : 'bg-[#050505] border-monolith-border hover:border-white'}`;
            let textClass = `font-mono text-[11px] sm:text-xs font-bold uppercase transition-colors tracking-wide ${isDone ? 'text-monolith-textDim line-through' : 'text-white'}`;
            if (isJudged) {
                podClass += " pointer-events-none ";
                podClass += hData.score === 100 ? " border-monolith-toxic bg-monolith-toxicDim/10" : " border-monolith-blood bg-monolith-bloodDim/10";
            }
            // Reorder (tap-to-move) visual states
            if (reorder) {
                if (i === Reorder.srcIdx) podClass += " reorder-src ";
                else podClass += " reorder-target ";
            }
            const handleActive = (reorder && i === Reorder.srcIdx);
            return `<div class="${podClass} select-none" data-index="${i}" onclick="UI.onTaskClick(${i}, event)">
                <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    ${!isJudged ? `<span class="drag-handle text-[12px] sm:text-[14px] flex-shrink-0 ${handleActive ? 'reorder-handle-on' : ''}" onclick="Reorder.handle(${i}, event)" title="Sposta questo dovere">▚▚</span>` : ''}
                    <div class="brutal-check flex-shrink-0"></div>
                    <span class="${textClass} break-words line-clamp-2 pr-2">${Utils.escapeHTML(task)}</span>
                </div>
                ${(!isJudged && !reorder) ? `<button onclick="Logic.removeTask(${i}, event)" class="px-2 sm:px-3 py-2 text-[9px] text-monolith-textDim hover:text-monolith-blood transition-all font-bold shrink-0 border border-transparent hover:border-monolith-blood bg-[#000] font-mono tracking-widest">DEL</button>` : ''}
                ${(reorder && i !== Reorder.srcIdx) ? `<span class="reorder-drop-tag font-mono text-[8px] font-black tracking-widest shrink-0">▸ QUI</span>` : ''}
            </div>`;
        }).join('');
        // Move-mode hint banner
        if (reorder) {
            const hint = document.createElement('div');
            hint.className = 'reorder-hint font-mono text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-center';
            hint.innerHTML = '▚ MODALITÀ SPOSTAMENTO ATTIVA // TOCCA LA DESTINAZIONE // TOCCA DI NUOVO PER ANNULLARE';
            list.insertBefore(hint, list.firstChild);
        }
    },
    onTaskClick(i, e) {
        // In move-mode a click on a pod places the selected duty; otherwise it toggles.
        if (Reorder.active) { Reorder.place(i); return; }
        Logic.toggleTask(State.data.tasks[i]);
    },
    startDrag(e, idx) { Reorder.handle(idx, e); }, // compat shim (kept intentionally: single entry-point for reorder)
    renderCalendar() {
        const d = State.currentCalendarDate, m = d.getMonth(), y = d.getFullYear();
        $('calendar-month-label').innerText = `${CONFIG.MONTHS[m]} ${y}`;
        // Only play the staggered entrance when the visible month actually changes,
        // otherwise it would replay on every task toggle (annoying + wasteful).
        const calKey = `${y}-${m}`;
        const animate = this._lastCalKey !== calKey;
        this._lastCalKey = calKey;
        const firstDow = new Date(y, m, 1).getDay(), offset = firstDow === 0 ? 6 : firstDow - 1, total = new Date(y, m + 1, 0).getDate();
        const grid = $('calendar-grid'); let html = '';
        let perfect = 0, failed = 0, scoreSum = 0, scoreCount = 0, cellIdx = 0;
        for (let i = 0; i < offset; i++) html += '<div class="aspect-square opacity-0 pointer-events-none"></div>';
        for (let g = 1; g <= total; g++) {
            const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(g).padStart(2,'0')}`;
            const h = State.data.history[ds], sc = h ? h.score : null;
            let cls = `relative aspect-square flex items-center justify-center transition-all cursor-pointer font-bold border-2 rounded-none font-mono text-[10px] sm:text-[12px] ${animate ? 'cal-cell ' : ''}`;
            if (ds === State.activeDate) cls += "border-white bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)] ";
            else if (ds === Utils.todayStr()) cls += "border-dashed border-monolith-textDim text-white hover:bg-monolith-panel ";
            else cls += "border-transparent text-monolith-textDim hover:text-white hover:bg-monolith-panel ";
            let dot = '';
            if (sc !== null) {
                cls += sc === 100 ? "border-monolith-toxic bg-monolith-toxicDim text-monolith-toxic " : "border-monolith-blood bg-monolith-bloodDim text-monolith-blood ";
                scoreSum += sc; scoreCount++;
                if (sc === 100) { perfect++; dot = '<span class="cal-dot" style="background:#00ff66;box-shadow:0 0 6px #00ff66"></span>'; }
                else { failed++; dot = '<span class="cal-dot" style="background:#ff003c;box-shadow:0 0 6px #ff003c"></span>'; }
            }
            const delayStyle = animate ? ` style="animation-delay:${Math.min(cellIdx * 12, 260)}ms"` : '';
            cellIdx++;
            html += `<div onclick="UI.onCalendarClick('${ds}')" class="${cls}"${delayStyle} title="${ds}${sc!==null?' // '+sc+'%':''}">${g}${dot}</div>`;
        }
        grid.innerHTML = html;
        const sp = $('cal-stat-perfect'), sf = $('cal-stat-failed'), sa = $('cal-stat-avg');
        if (sp) sp.innerText = perfect;
        if (sf) sf.innerText = failed;
        if (sa) sa.innerText = scoreCount ? Math.round(scoreSum / scoreCount) + '%' : '--%';
    },
    changeMonth(dir) {
        AudioEngine.play('type'); Utils.triggerVibe(10);
        const g = $('calendar-grid'); g.classList.remove('calendar-transition'); void g.offsetWidth; g.classList.add('calendar-transition');
        State.currentCalendarDate.setMonth(State.currentCalendarDate.getMonth() + dir);
        this.renderCalendar();
    },
    onCalendarClick(ds) {
        const h = State.data.history[ds];
        if (h && h.score !== null) return this.openDayDetail(ds);
        AudioEngine.play('type'); State.activeDate = ds; $('date-display').innerText = ds.replace(/-/g, '.');
        this.renderAll();
    },
    openDayDetail(ds) {
        const h = State.data.history[ds]; AudioEngine.play(h.score === 100 ? 'check' : 'glitch');
        $('detail-date').innerText = ds.replace(/-/g, '.');
        const scEl = $('detail-score'); scEl.innerText = `${h.score}%`;
        scEl.className = "font-display font-black text-4xl sm:text-5xl tracking-tighter " + (h.score === 100 ? 'text-monolith-toxic' : 'text-monolith-blood text-aberration');
        const bx = $('detail-tasks');
        if (!h.comp || h.comp.length === 0) bx.innerHTML = `<div class="font-mono text-[10px] text-monolith-blood uppercase font-bold py-6 text-center border-2 border-dashed border-monolith-blood tracking-widest bg-monolith-bloodDim/20">NESSUN DOVERE COMPILATO. TOTALE RESA.</div>`;
        else bx.innerHTML = h.comp.map(t => `<div class="flex items-center gap-4 border-2 border-monolith-border p-3 bg-black"><span class="text-monolith-toxic text-[12px]">■</span><span class="font-mono text-[10px] text-white uppercase font-bold break-words line-clamp-2 tracking-wide">${Utils.escapeHTML(t)}</span></div>`).join('');
        this.fadeInModal('detail-overlay');
    },
    closeDetail() { AudioEngine.play('type'); this.fadeOutModal('detail-overlay'); },
    
    /* Modals & Toasts */
    fadeInModal(id) { const m = $(id); m.classList.remove('hidden'); m.style.display = 'flex'; setTimeout(() => m.classList.remove('opacity-0'), 10); },
    fadeOutModal(id, cb) { const m = $(id); m.classList.add('opacity-0'); setTimeout(() => { m.style.display = 'none'; m.classList.add('hidden'); if(cb) cb(); }, 200); },

    // Achievement Expansion 01 // exploration tracker.
    // Adds `sectionId` to State.data.sectionsExplored (dedup) and re-runs the
    // central achievement checker so `explorer` can unlock at the exact moment
    // the last required section is opened. This is the single write point for
    // the exploration set — every open* modal method routes through here.
    trackExploration(sectionId) {
        const d = State.data;
        if (!Array.isArray(d.sectionsExplored)) d.sectionsExplored = [];
        if (d.sectionsExplored.includes(sectionId)) return;
        d.sectionsExplored.push(sectionId);
        State.save();
        Gamification.checkAchievements();
    },
    openPurgeModal() { AudioEngine.play('error'); Utils.triggerVibe([30, 30]); this.fadeInModal('purge-modal'); },
    closePurgeModal() { AudioEngine.play('type'); this.fadeOutModal('purge-modal'); },
    openBackupModal() { AudioEngine.play('check'); Utils.triggerVibe(15); $('backup-paste-area').value = ''; this.trackExploration('backup'); this.fadeInModal('backup-modal'); },
    closeBackupModal() { AudioEngine.play('type'); this.fadeOutModal('backup-modal'); },

    // Extraordinary Protocol (Behavioral Monitoring add-on).
    // Rendering rule: if a protocol is already open for this ISO week (not yet
    // resolved), show the "in corso" panel with resolve buttons; otherwise show
    // the free-form input for a new challenge.
    openExtProtocolModal() {
        AudioEngine.play('check'); Utils.triggerVibe(15);
        if (!ExtProtocol) return;
        this.trackExploration('ext_protocol');
        const cur = ExtProtocol.current();
        const bodyInput = $('ext-protocol-body'), bodyActive = $('ext-protocol-active');
        if (cur && !cur.resolved) {
            bodyInput.classList.add('hidden'); bodyActive.classList.remove('hidden');
            $('ext-protocol-active-text').innerText = cur.text;
        } else {
            bodyActive.classList.add('hidden'); bodyInput.classList.remove('hidden');
            $('ext-protocol-input').value = '';
        }
        this.fadeInModal('ext-protocol-modal');
    },
    closeExtProtocolModal() { AudioEngine.play('type'); this.fadeOutModal('ext-protocol-modal'); },
    submitExtProtocol() {
        if (!ExtProtocol) return;
        const text = $('ext-protocol-input').value;
        if (ExtProtocol.start(text)) { this.closeExtProtocolModal(); }
    },
    resolveExtProtocol(success) {
        if (!ExtProtocol) return;
        if (ExtProtocol.resolve(success)) { this.closeExtProtocolModal(); }
    },
    updateConfessionalCount() {
        const l = $('confessional-input').value.trim().length, cnt = $('confessional-count'), btn = $('confessional-submit');
        cnt.innerText = `${l} / 50`;
        if(l>=50) { cnt.classList.replace('text-monolith-blood','text-monolith-toxic'); btn.disabled=false; }
        else { cnt.classList.replace('text-monolith-toxic','text-monolith-blood'); btn.disabled=true; }
    },
    closeConfessional() { AudioEngine.play('type'); State.pendingUncheckTask = null; this.fadeOutModal('confessional-overlay'); },
    
    popToast(msg, isError = false) {
        const c = $('toast-container'), t = document.createElement('div');
        const b = isError ? 'border-monolith-blood text-monolith-blood bg-monolith-bloodDim/40' : 'border-white text-white bg-black/90';
        t.className = `border-2 ${b} backdrop-blur-sm px-4 sm:px-5 py-3 sm:py-4 text-[10px] sm:text-xs font-mono font-bold shadow-[6px_6px_0px_rgba(0,0,0,0.8)] transform translate-x-[120%] transition-transform duration-300 flex items-center gap-3 max-w-[280px] tracking-widest`;
        t.innerHTML = `<span class="animate-pulse">>></span><span></span>`; c.appendChild(t);
        requestAnimationFrame(() => t.classList.remove('translate-x-[120%]'));
        const span = t.querySelector('span:last-child'); let i = 0;
        const intv = setInterval(() => { if (i < msg.length) span.innerText += msg.charAt(i++); else clearInterval(intv); }, 15);
        setTimeout(() => { t.classList.add('translate-x-[120%]'); setTimeout(() => t.remove(), 400); }, 4000);
    },
    // Achievement System v2 // minimal system notification.
    // Spec: single per unlock, <1s total, minimal animation, no flashing, no replay.
    // A `Set` on this method dedupes across the session — if checkAchievements runs
    // repeatedly and (paranoia) re-invokes popAchievement for the same id, we still
    // display the notice exactly once. The rarity tints the top border only; no
    // pulsing, no glow-in animation, no icon bounce — a plain terminal ticker.
    popAchievement(id) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return;
        this._achShown = this._achShown || new Set();
        if (this._achShown.has(id)) return;
        this._achShown.add(id);

        const rarity  = ach.rarity || 'common';
        const c = $('toast-container');
        const t = document.createElement('div');
        t.setAttribute('role', 'status');
        t.className = `ach-notice ach-rar-${rarity}`;
        t.innerHTML =
            `<div class="ach-notice-head">OBIETTIVO SBLOCCATO</div>` +
            `<div class="ach-notice-body"><span class="ach-notice-icon">${ach.icon}</span><span class="ach-notice-title">${ach.title}</span></div>`;
        c.appendChild(t);
        // Single short beep. No re-play.
        AudioEngine.play('success');
        // Total on-screen time ≈ 900ms: 120ms in + 620ms hold + 160ms out.
        requestAnimationFrame(() => t.classList.add('in'));
        setTimeout(() => { t.classList.remove('in'); t.classList.add('out'); }, 740);
        setTimeout(() => t.remove(), 940);
    },

    openStatsModal() {
        AudioEngine.play('check');
        this.trackExploration('stats');
        const d = State.data, hVals = Object.values(d.history).filter(x => x.score !== null);
        $('st-days').innerText = hVals.length;
        $('st-perfect').innerText = hVals.filter(x => x.score === 100).length;
        $('st-failed').innerText = hVals.filter(x => x.score < 100).length;
        $('st-avg').innerText = hVals.length ? Math.round(hVals.reduce((a,b)=>a+b.score,0)/hVals.length) + '%' : '0%';
        $('st-t-done').innerText = d.totalTasksCompleted;
        $('st-t-miss').innerText = d.totalTasksMissed;
        $('st-best-streak').innerText = d.bestStreak;
        $('st-prestige').innerText = d.prestige;
        this.fadeInModal('stats-modal');
    },
    openTrophiesModal() { this.trackExploration('trophies'); TrophyUI.open(); },
    closeTrophiesModal() { TrophyUI.close(); },
    openConfessionsModal() {
        AudioEngine.play('glitch'); Utils.triggerVibe([20, 20]);
        this.trackExploration('confessions');
        const list = $('confessions-list'), cnt = $('confessions-count');
        const arr = Array.isArray(State.data.confessions) ? State.data.confessions : [];
        cnt.innerText = arr.length;
        if (arr.length === 0) {
            list.innerHTML = `<div class="font-mono text-[10px] sm:text-xs text-monolith-toxic uppercase font-bold py-10 text-center border-2 border-dashed border-monolith-toxic tracking-widest bg-monolith-toxicDim/10">NESSUNA SCUSA REGISTRATA. RARO SEGNO DI DIGNITÀ.</div>`;
        } else {
            list.innerHTML = arr.map(c => {
                const d = new Date(c.ts || Date.now());
                const when = `${(c.date || Utils.dateToStr(d)).replace(/-/g,'.')} // ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                return `<div class="border-2 border-monolith-blood bg-monolith-bloodDim/10 p-3 sm:p-4">
                    <div class="flex justify-between items-start gap-3 border-b border-monolith-blood/40 pb-2 mb-2">
                        <span class="font-mono text-[9px] sm:text-[10px] text-monolith-blood font-black uppercase tracking-widest break-words">DOVERE: ${Utils.escapeHTML(c.task || '—')}</span>
                        <span class="font-mono text-[8px] sm:text-[9px] text-monolith-textDim font-bold tracking-widest whitespace-nowrap shrink-0">${when}</span>
                    </div>
                    <p class="font-mono text-[10px] sm:text-[11px] text-white leading-relaxed tracking-wide break-words">"${Utils.escapeHTML(c.text || '')}"</p>
                </div>`;
            }).join('');
        }
        this.fadeInModal('confessions-modal');
    },
    closeConfessionsModal() { AudioEngine.play('type'); this.fadeOutModal('confessions-modal'); },
    closeStatsModal() { AudioEngine.play('type'); this.fadeOutModal('stats-modal'); },

    startProcessingOverlay(cb) {
        const o = $('processing-overlay'), logs = $('terminal-logs'), bar = $('load-bar'), pct = $('load-pct');
        o.classList.remove('hidden'); o.style.display = 'block'; setTimeout(() => o.classList.remove('opacity-0'), 10);
        logs.innerHTML = ''; bar.style.width = '0%'; pct.innerText = '0%';
        const phrases = ["> ESTRAZIONE PARAMETRI...", "> COMPILAZIONE STORICO...", "> CALCOLO CODARDIA...", "> CALCOLO LIVELLO...", "> SINTESI CHIRURGICA...", "> SINTESI VERDETTO..."];
        let step = 0, prog = 0; const intv = setInterval(() => AudioEngine.play('process'), 120);
        const adv = () => {
            prog += Math.random() * 18; if (prog > 100) prog = 100;
            bar.style.width = `${prog}%`; pct.innerText = `${Math.floor(prog)}%`;
            if (step < phrases.length && prog > (step * 25)) { const el = document.createElement('div'); el.innerText = phrases[step++]; logs.appendChild(el); }
            if (prog === 100) { clearInterval(intv); setTimeout(() => { o.classList.add('opacity-0'); setTimeout(() => { o.style.display = 'none'; cb(); }, 400); }, 600); } 
            else setTimeout(adv, 100 + Math.random() * 150);
        }; adv();
    },
    closeVerdict() {
        AudioEngine.play('type'); const vo = $('verdict-overlay'), vw = $('verdict-window');
        vo.classList.add('opacity-0'); vw.classList.add('translate-y-8');
        const h = State.data.history[State.activeDate];
        if (h && h.score !== null && h.score < 100) Corruption.set(0.15); else Corruption.set(0);
        setTimeout(() => { vo.style.display = 'none'; $('verdict-text').innerHTML = ''; }, 700);
    }
};

export { UI };
