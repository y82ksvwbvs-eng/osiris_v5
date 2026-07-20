// O.S.I.R.I.S. — Streak visualization tiers + best-streak persistence.
// Extracted verbatim from osiris-V4.html (MOD 07).
import { $ }     from '../core/dom.js';
import { State } from '../logic/state.js';

const Streak = {
    lastTier: -1, lastVal: -1,
    // Milestone tiers: 0-2 · 3 · 7 · 15 · 30 · 50 · 100 · 365 · 1000
    tierOf(n) {
        if (n >= 1000) return 8; if (n >= 365) return 7; if (n >= 100) return 6;
        if (n >= 50) return 5;  if (n >= 30) return 4;  if (n >= 15) return 3;
        if (n >= 7) return 2;   if (n >= 3) return 1;   return 0;
    },
    badge(tier) {
        // [label, css-class] — only shown from tier 4 upward
        switch (tier) {
            case 4: return ['▲ 30', 'streak-badge-gold'];
            case 5: return ['◆ 50', 'streak-badge-purple'];
            case 6: return ['♛ 100', 'streak-badge-legend'];
            case 7: return ['☀ 365', 'streak-badge-legend'];
            case 8: return ['∞ 1000', 'streak-badge-legend'];
            default: return null;
        }
    },
    apply() {
        const n = State.data.streak || 0;
        const tier = this.tierOf(n);
        const el = $('streak-counter');
        if (el) {
            el.className = `text-sm sm:text-base font-black streak-t${tier}`;
            // Celebrate crossing into a new (higher) tier.
            if (tier > this.lastTier && this.lastTier !== -1) {
                el.classList.add('streak-flash');
                setTimeout(() => el.classList.remove('streak-flash'), 800);
                Utils.triggerVibe([30, 30, 60]);
            }
        }
        const b = $('streak-badge');
        if (b) {
            const info = this.badge(tier);
            if (info) { b.className = `${info[1]}`; b.innerText = info[0]; b.classList.remove('hidden'); }
            else { b.classList.add('hidden'); b.innerText = ''; }
        }
        document.body.classList.toggle('streak-legend', tier >= 7);
        document.body.classList.toggle('streak-myth', tier >= 8);
        this.lastTier = tier; this.lastVal = n;
    }
};

export { Streak };
