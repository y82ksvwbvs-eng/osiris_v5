// O.S.I.R.I.S. — Extraordinary Protocol.
//
// Once per ISO week the subject may declare one Extraordinary Protocol — a
// self-defined behavioral challenge captured as free-form text. The protocol
// is resolvable at any point during the same week:
//   • success  → subtracts `EXT_PROTOCOL.SUCCESS_CONTAINMENT` points from bossDmg
//                (i.e. lowers the Corruption Index)
//   • failure  → adds `EXT_PROTOCOL.FAILURE_DEVIATION` points to bossDmg
//                (i.e. raises the Corruption Index, moderate penalty)
//
// Progression (XP, streak, tasks, achievements) is *never* modified — per the
// non-negotiable "Preserve Existing Systems" clause. Only the weekly corruption
// raw is nudged.
//
// State layout (additive, save-compat with v3):
//   State.data.extProtocol = { week, text, resolved, success } | null
//
// Public API:
//   ExtProtocol.canStart()       → boolean (no active protocol this week)
//   ExtProtocol.start(text)      → creates the protocol for the current ISO week
//   ExtProtocol.resolve(success) → closes the protocol, applies the delta
//   ExtProtocol.current()        → returns the current protocol (or null)
import { EXT_PROTOCOL } from '../core/config.js';
import { Utils } from '../core/utils.js';
import { State } from '../logic/state.js';
import { BossHP } from '../logic/bossHp.js';
import { Gamification } from '../logic/gamification.js';

// Late-bound to keep the module import graph acyclic.
let UI = null;
export function bindUI(u) { UI = u; }

const ExtProtocol = {
    _week() { return Utils.getISOWeek(new Date()); },

    current() {
        const p = State.data.extProtocol;
        if (!p) return null;
        // Any protocol from a previous week is treated as archived history — the
        // caller may still access it via State.data.extProtocol for reporting.
        return (p.week === this._week()) ? p : null;
    },

    canStart() {
        const p = this.current();
        return !p || p.resolved === true;
    },

    start(text) {
        if (!this.canStart()) {
            if (UI) UI.popToast('Protocollo Straordinario già attivo per questo ciclo settimanale.', true);
            return false;
        }
        const t = (text || '').trim().toUpperCase();
        if (!t) {
            if (UI) UI.popToast('Definisci una sfida comportamentale valida.', true);
            return false;
        }
        State.data.extProtocol = { week: this._week(), text: t, resolved: false, success: null };
        State.save();
        if (UI) UI.popToast(`Protocollo Straordinario registrato. Verifica entro il ciclo settimanale.`);
        return true;
    },

    resolve(success) {
        const p = this.current();
        if (!p || p.resolved) return false;
        p.resolved = true;
        p.success  = !!success;
        if (p.success) {
            BossHP.registerHeal(EXT_PROTOCOL.SUCCESS_CONTAINMENT);
            // Extension 01 // ghost_protocol tracker — count consecutive successes.
            State.data.extConsecutiveWins = (State.data.extConsecutiveWins || 0) + 1;
        } else {
            BossHP.registerDamage(EXT_PROTOCOL.FAILURE_DEVIATION);
            State.data.extConsecutiveWins = 0;
        }
        State.save();
        if (UI) {
            UI.popToast(p.success
                ? `Protocollo Straordinario completato. Contenimento ${EXT_PROTOCOL.SUCCESS_CONTAINMENT} pt registrato.`
                : `Protocollo Straordinario fallito. Deviazione ${EXT_PROTOCOL.FAILURE_DEVIATION} pt registrata.`,
                !p.success);
        }
        // Reuse the central achievement checker so ghost_protocol (and any future
        // ext-driven unlock) fires without duplicating logic in this module.
        Gamification.checkAchievements();
        return true;
    }
};

export { ExtProtocol };
