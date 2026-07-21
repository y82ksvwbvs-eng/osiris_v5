// O.S.I.R.I.S. — XP curve, level names, grades, prestige.
// Extracted verbatim from osiris-V4.html (MOD 08).
import { LEVEL_NAMES, GRADES } from '../core/config.js';
import { State } from './state.js';

// Late-bound (Gamification → UI via checkAchievements → popAchievement toast).
let UI = null;
export function bindUI(u) { UI = u; }

const Gamification = {
    MAX_LVL: 100,
    xpForLevelUp(lvl) { return 100 + Math.max(0, lvl - 1) * 50; },
    fromXP(totalXP) {
        let lvl = 1, acc = 0;
        while (lvl < this.MAX_LVL) {
            const need = this.xpForLevelUp(lvl);
            if (acc + need > totalXP) break;
            acc += need; lvl++;
        }
        return { level: lvl, xpInLevel: totalXP - acc, xpForNext: (lvl >= this.MAX_LVL ? 0 : this.xpForLevelUp(lvl)) };
    },
    nameOf(lvl) { return LEVEL_NAMES[Math.min(this.MAX_LVL, Math.max(1, lvl)) - 1]; },
    gradeOf(lvl) { return GRADES[Math.min(9, Math.floor((Math.max(1, lvl) - 1) / 10))]; },
    computeSessionXP(pct, streak) {
        if (pct === 100) return 100 + Math.min(200, (streak || 0) * 5);
        if (pct >= 50) return Math.round(pct * 0.5);
        return Math.round(pct * 0.15);
    },
    
    // Weekly Review outcome tier — labels are now clinical / containment-oriented
    // (no RPG vocabulary). Function name and outcome IDs preserved for save-compat.
    bossTier(pct) {
        if (pct >= 90) return { outcome: 'mythic', xp: 500, tag: "AN-W // CONTENIMENTO OTTIMALE",       css: 'tier-mythic' };
        if (pct >= 75) return { outcome: 'gold',   xp: 300, tag: "AN-W // CONTENIMENTO EFFICACE",      css: 'tier-gold' };
        if (pct >= 60) return { outcome: 'silver', xp: 200, tag: "AN-W // CONTENIMENTO PARZIALE",      css: 'tier-silver' };
        if (pct >= 45) return { outcome: 'bronze', xp: 100, tag: "AN-W // CONTENIMENTO MARGINALE",     css: 'tier-bronze' };
        return                 { outcome: 'defeat', xp: 0,  tag: "AN-W // CONTENIMENTO FALLITO",       css: '' };
    },

    // Achievements
    checkAchievements() {
        const d = State.data;
        const unlocks = [];
        const unlock = (id) => { if (!d.achievements.includes(id)) { d.achievements.push(id); unlocks.push(id); } };

        if (Object.keys(d.history).filter(k => d.history[k].score !== null).length > 0) unlock('first_blood');
        if (d.bestStreak >= 7) unlock('streak_7');
        if (d.bestStreak >= 30) unlock('streak_30');
        if (d.totalTasksCompleted >= 100) unlock('total_100_tasks');
        if (d.totalTasksCompleted >= 500) unlock('total_500_tasks');
        
        const lvl = this.fromXP(d.xp).level;
        if (lvl >= 50) unlock('level_50');
        if (d.prestige > 0) unlock('prestige_1');

        if (unlocks.length > 0) {
            State.save();
            unlocks.forEach((id, i) => setTimeout(() => UI.popAchievement(id), i * 1500));
        }
    }
};

export { Gamification };
