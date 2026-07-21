// O.S.I.R.I.S. — Orchestrator: addTask, toggleTask, triggerJudgment, triggerBossJudgment, purge, prestige.
// Extracted verbatim from osiris-V4.html (MOD 09).
import { CONFIG }       from '../core/config.js';
import { Utils }        from '../core/utils.js';
import { $ }            from '../core/dom.js';
import { AudioEngine }  from '../core/audio.js';
import { State }        from './state.js';
import { Corruption }   from './corruption.js';
import { Purgatory }    from './purgatory.js';
import { Gamification } from './gamification.js';
import { BossHP }       from './bossHp.js';
import { Streak }       from '../features/streak.js';
import { Narrator }     from '../features/narrator.js';

// Late-bound to break UI ↔ Logic circular imports.
let UI = null, Reveal = null, Reorder = null;
export function bindUI(uiMod, revealMod, reorderMod) { UI = uiMod; Reveal = revealMod; Reorder = reorderMod; }

const Logic = {
    addTask(val) {
        if (!val) return;
        if (State.data.tasks.includes(val)) { AudioEngine.play('error'); Utils.triggerVibe(30); UI.popToast("PARAMETRO ETICO GIÀ ESISTENTE", true); return; }
        AudioEngine.play('type'); Utils.triggerVibe(10);
        State.data.tasks.unshift(val);
        $('action-input').value = '';
        State.save();
    },
    removeTask(idx, e) {
        e.stopPropagation(); AudioEngine.play('type'); Utils.triggerVibe(20);
        State.data.tasks.splice(idx, 1);
        UI.popToast("Elemento rimosso. Troppo difficile?", true);
        State.save();
    },
    toggleTask(task) {
        // Ignore the synthetic click fired right after a drag-and-drop reorder.
        // Se siamo in modalità spostamento, il click non deve completare il dovere.
        if (Reorder.active) return;
        if (State.activeDate !== Utils.todayStr()) { AudioEngine.play('error'); UI.popToast("STORICO IN SOLA LETTURA", true); return; }
        const h = State.data.history[State.activeDate];
        if (h.score !== null) return;
        
        if (h.comp.includes(task)) {
            State.pendingUncheckTask = task; AudioEngine.play('error'); Utils.triggerVibe([20, 20]);
            $('confessional-input').value = ''; UI.updateConfessionalCount();
            UI.fadeInModal('confessional-overlay');
        } else {
            AudioEngine.play('check'); Utils.triggerVibe(15);
            h.comp.push(task);
            BossHP.registerDamage(10);
            State.save();
        }
    },
    submitConfessional() {
        if (!State.pendingUncheckTask) return;
        AudioEngine.play('glitch'); Utils.triggerVibe([50, 50]);
        let h = State.data.history[State.activeDate];
        h.comp = h.comp.filter(t => t !== State.pendingUncheckTask);
        BossHP.registerHeal(5); // penalità: annullare un dovere cura il boss
        // Archivia la scusa nel registro (consultabile in seguito).
        const excuse = ($('confessional-input').value || '').trim();
        if (!Array.isArray(State.data.confessions)) State.data.confessions = [];
        State.data.confessions.unshift({
            date: State.activeDate,
            task: State.pendingUncheckTask,
            text: excuse,
            ts: Date.now()
        });
        State.pendingUncheckTask = null;
        UI.fadeOutModal('confessional-overlay');
        State.save(); UI.popToast("Rinuncia e scuse registrate. Vergognati.", true);
    },
    triggerJudgment() {
        if (State.activeDate !== Utils.todayStr()) return UI.popToast("CICLO ACCESSIBILE SOLO NELL'ODIERNO", true);
        if (State.data.tasks.length === 0) return UI.popToast("ERRORE: VETTORE ANALISI VUOTO", true);
        const h = State.data.history[State.activeDate];
        if (h.score !== null) return UI.popToast("VERDETTO GIÀ REGISTRATO.", true);
        if (State.data.targetTasks && State.data.tasks.length < State.data.targetTasks) {
            AudioEngine.play('error'); Utils.triggerVibe([100, 50, 100]);
            return UI.popToast(`SOVRACCARICO: REQ. ${State.data.targetTasks} DOVERI. NON ADAGIARTI.`, true);
        }

        const total = State.data.tasks.length, comp = State.data.tasks.filter(t => h.comp.includes(t)).length;
        const pct = Math.round((comp / total) * 100);
        
        UI.startProcessingOverlay(() => {
            State.data.history[State.activeDate].score = pct;
            State.data.lastJudged = State.activeDate;
            State.data.totalTasksCompleted += comp;
            State.data.totalTasksMissed += (total - comp);
            // Boss weekly damage/heal from daily result
            BossHP.registerHeal((total - comp) * 12); // ogni disertato cura il boss
            if (pct === 100) BossHP.registerDamage(25); // bonus giornata perfetta
            
            const wasInPurgatory = document.body.classList.contains('purgatorio-active');

            if (pct === 100) {
                State.data.streak++;
                if (State.data.streak > State.data.bestStreak) State.data.bestStreak = State.data.streak;
                if (State.data.streak > 0 && State.data.streak % 10 === 0) State.data.targetTasks = Math.max(State.data.targetTasks, State.data.tasks.length + 1);
                if (wasInPurgatory && !State.data.achievements.includes('purgatory_escape')) {
                    State.data.achievements.push('purgatory_escape');
                    setTimeout(() => UI.popAchievement('purgatory_escape'), 2000);
                }
            } else { State.data.streak = 0; }

            const xpBefore = State.data.xp;
            const lvlBefore = Gamification.fromXP(xpBefore);
            const xpGain = Gamification.computeSessionXP(pct, State.data.streak);
            State.data.xp += xpGain;
            const lvlAfter = Gamification.fromXP(State.data.xp);
            
            State.save();
            Gamification.checkAchievements();
            Reveal.startDaily(pct, comp, total, xpBefore, xpGain, lvlBefore, lvlAfter);
        });
    },
    triggerBossJudgment() {
        const pct = Utils.avgOverDays(7, State.data.history) || 0;
        UI.startProcessingOverlay(() => {
            // Directive 2: outcome combines weekly avg + accumulated HP damage
            const bossState = BossHP.compute();
            const combined = Math.round(pct * 0.5 + bossState.dmgPct * 0.5);
            const tier = Gamification.bossTier(combined);
            const wk = Utils.getISOWeek(new Date());
            State.data.bossHistory[wk] = { avg: pct, dmgPct: bossState.dmgPct, combined, outcome: tier.outcome, xpGain: tier.xp };
            State.data.lastBossWeek = wk;
            
            if (tier.outcome === 'mythic' && !State.data.achievements.includes('boss_mythic')) {
                State.data.achievements.push('boss_mythic');
                setTimeout(() => UI.popAchievement('boss_mythic'), 2000);
            }

            const xpBefore = State.data.xp;
            const lvlBefore = Gamification.fromXP(xpBefore);
            State.data.xp += tier.xp;
            const lvlAfter = Gamification.fromXP(State.data.xp);
            // Reset weekly HP after judgment
            BossHP.resetWeek();
            
            State.save();
            Gamification.checkAchievements();
            Reveal.startBoss(pct, tier, xpBefore, lvlBefore, lvlAfter);
        });
    },
    ascendPrestige() {
        AudioEngine.play('levelup'); Utils.triggerVibe([100, 100, 300]);
        State.data.prestige++;
        State.data.xp = 0;
        State.save();
        UI.closeVerdict();
        setTimeout(() => UI.popToast("ASCENSIONE COMPLETATA. IL CICLO RICOMINCIA."), 500);
        Gamification.checkAchievements();
    },
    confirmPurge() {
        AudioEngine.play('error'); Utils.triggerVibe([100, 100, 100]);
        State.data.tasks = []; State.data.history = {}; State.data.streak = 0; State.data.targetTasks = 1;
        State.data.confessions = [];
        State.save(); UI.closePurgeModal();
        UI.popToast("MEMORIA AZZERATA. TIPICO DI TE.", true);
    }
};

export { Logic };
