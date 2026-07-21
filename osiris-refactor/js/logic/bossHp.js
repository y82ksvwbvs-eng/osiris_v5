// O.S.I.R.I.S. — Weekly Integrity + Corruption Index (Behavioral Monitoring refactor).
//
// File & export names preserved for minimum diff (`BossHP` kept as the module
// identity throughout the codebase). Semantically this module now computes:
//
//   corruption% = clamp( (rawDeviation - rawContainment) / maxCapacity, 0..1 ) * 100
//     ↑
//     starts at 0% (integrity perfect), rises with failed cycles (0..100).
//
// The internal state fields (`bossWeek`, `bossDmg`, `bossHeal`) are unchanged so
// save-compat with v3 payloads is preserved. Only their *interpretation* changed:
//     bossDmg  = weekly deviation raw    (corruption points accumulated)
//     bossHeal = weekly containment raw  (points reclaimed via successful cycles)
//
// UI is rendered as a diagnostic terminal read-out — no HP/battle vocabulary.
import { Utils } from '../core/utils.js';
import { $ } from '../core/dom.js';
import { State } from './state.js';
import { Gamification } from './gamification.js';

// Late-bound: Containment listens to compute() and can activate protocols downstream.
// Kept optional so BossHP remains usable if Containment is unavailable.
let Containment = null;
export function bindContainment(c) { Containment = c; }

const BossHP = {
    ensureWeek() {
        const wk = Utils.getISOWeek(new Date());
        if (State.data.bossWeek !== wk) {
            State.data.bossWeek = wk; State.data.bossDmg = 0; State.data.bossHeal = 0;
        }
    },
    // Deviation and containment are *cumulative* weekly points.
    registerDamage(pts) { this.ensureWeek(); State.data.bossDmg += pts; },
    registerHeal(pts)   { this.ensureWeek(); State.data.bossHeal += pts; },
    resetWeek() { State.data.bossWeek = Utils.getISOWeek(new Date()); State.data.bossDmg = 0; State.data.bossHeal = 0; },

    // Weekly capacity scales with the subject's LEVEL / GRADE: the higher your
    // observation level, the wider the tolerance band — but also the more
    // ground you can lose. Level 1 ≈ 200 points, growth +40/level and +150/grade.
    maxHP() {
        const lvl = Gamification.fromXP(State.data.xp).level;
        const grade = Math.floor((Math.max(1, lvl) - 1) / 10); // 0..9
        return 200 + (lvl - 1) * 40 + grade * 150;
    },

    // Diagnostic snapshot. `corruption` (0..100) is the *primary* metric.
    // `integrity` (0..100) is exposed for compat with any legacy caller — it's
    // simply `100 - corruption`.
    compute() {
        this.ensureWeek();
        const dev = State.data.bossDmg, cont = State.data.bossHeal;
        const net = Math.max(0, dev - cont);
        const cap = this.maxHP();
        const remaining = Math.max(0, cap - net);
        const corruption = Math.min(100, Math.round((net / cap) * 100));
        const integrity  = Math.max(0, Math.round((remaining / cap) * 100));
        return { dev, cont, net, cap, remaining, corruption, integrity,
                 // legacy aliases for any residual reader (safe to remove later):
                 dmg: dev, heal: cont, maxHP: cap, curHP: remaining, dmgPct: corruption };
    },

    // Renders the weekly integrity panel as a terminal-style diagnostic.
    // Visual metric = Integrity (100% → 0%, drains with failure — intuitive "life-bar" reading).
    // Internal metric = Corruption (0% → 100%, drives Containment Protocol thresholds).
    render() {
        const s = this.compute();
        const fill = $('boss-hp-fill'), txt = $('boss-hp-text'), det = $('boss-hp-detail'), wrap = $('boss-hp-wrap');
        if (!fill || !txt || !det || !wrap) return;
        const lvl = Gamification.fromXP(State.data.xp).level;

        // Fill bar visualizes INTEGRITY: full at 100% (stable), drains toward 0%.
        fill.style.width = `${s.integrity}%`;
        txt.innerText = `${s.integrity}%`;
        // STATO mirrors the Corruption band (which is what actually controls CP protocols),
        // so the label degrades in lockstep with the CP-01..CP-05 thresholds.
        const status = (s.corruption >= 95) ? 'CONTENIMENTO CRITICO'
                     : (s.corruption >= 80) ? 'INSTABILITÀ'
                     : (s.corruption >= 60) ? 'MONITORAGGIO ESTESO'
                     : (s.corruption >= 40) ? 'DEVIAZIONE MODERATA'
                     : (s.corruption >= 20) ? 'AVVISO DIAGNOSTICO'
                     :                        'PROFILO STABILE';
        det.innerText = `INT: ${s.integrity}%  //  CORR: ${s.corruption}%  //  Δ+: ${s.dev}  //  Δ-: ${s.cont}  //  CAP: ${s.cap}  //  LIV.${lvl}  //  STATO: ${status}`;
        // CSS hooks continue to react to the Corruption band (so effects intensify
        // as the bar drains).  `crit` = corruption ≥80%; `dead` = corruption maxed.
        wrap.classList.toggle('crit', s.corruption >= 80 && s.corruption < 100);
        wrap.classList.toggle('dead', s.corruption >= 100);

        // Notify Containment so threshold protocols can (de)activate.
        if (Containment) Containment.apply(s.corruption);
    }
};

export { BossHP };
