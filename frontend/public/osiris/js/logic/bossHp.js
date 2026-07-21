// O.S.I.R.I.S. — Weekly Boss integrity (HP bar, dmg/heal accounting, weekly reset).
// Extracted verbatim from osiris-V4.html (MOD 13).
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from './state.js';
import { Gamification } from './gamification.js';

const BossHP = {
    ensureWeek() {
        const wk = Utils.getISOWeek(new Date());
        if (State.data.bossWeek !== wk) {
            State.data.bossWeek = wk; State.data.bossDmg = 0; State.data.bossHeal = 0;
        }
    },
    // Damage/heal are cumulative points; final integrity = clamp(maxHP - net) / maxHP
    registerDamage(pts) { this.ensureWeek(); State.data.bossDmg += pts; },
    registerHeal(pts)   { this.ensureWeek(); State.data.bossHeal += pts; },
    resetWeek() { State.data.bossWeek = Utils.getISOWeek(new Date()); State.data.bossDmg = 0; State.data.bossHeal = 0; },
    // Boss max HP scales with the subject's LEVEL / GRADE: the stronger you become,
    // the tougher the weekly Boss. Level 1 ≈ 200 HP, growth +40/level and +150/grade.
    maxHP() {
        const lvl = Gamification.fromXP(State.data.xp).level;
        const grade = Math.floor((Math.max(1, lvl) - 1) / 10); // 0..9
        return 200 + (lvl - 1) * 40 + grade * 150;
    },
    compute() {
        this.ensureWeek();
        const dmg = State.data.bossDmg, heal = State.data.bossHeal;
        const net = Math.max(0, dmg - heal);
        const maxHP = this.maxHP();
        const curHP = Math.max(0, maxHP - net);
        // Integrity: 100% at week start, drops as net damage approaches maxHP.
        const dmgPct = Math.min(100, Math.round((net / maxHP) * 100));
        const integrity = Math.max(0, Math.round((curHP / maxHP) * 100));
        return { dmg, heal, net, maxHP, curHP, dmgPct, integrity };
    },
    render() {
        const s = this.compute();
        const fill = $('boss-hp-fill'), txt = $('boss-hp-text'), det = $('boss-hp-detail'), wrap = $('boss-hp-wrap');
        if (!fill || !txt || !det || !wrap) return;
        const lvl = Gamification.fromXP(State.data.xp).level;
        fill.style.width = `${s.integrity}%`;
        txt.innerText = `${s.integrity}%`;
        det.innerText = `HP: ${s.curHP}/${s.maxHP} (LIV.${lvl}) // DMG: ${s.dmg} // HEAL: ${s.heal} // ${s.integrity <= 0 ? 'BOSS ABBATTUTO' : (s.integrity <= 25 ? 'CRITICO' : 'CICLO ATTIVO')}`;
        wrap.classList.toggle('crit', s.integrity > 0 && s.integrity <= 25);
        wrap.classList.toggle('dead', s.integrity <= 0);
    }
};

export { BossHP };
