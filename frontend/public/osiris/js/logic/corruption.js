// O.S.I.R.I.S. — CRT corruption FX driver (chromatic aberration + glitch band + shake).
// Extracted verbatim from osiris-V4.html (MOD 06).
import { AudioEngine } from '../core/audio.js';
import { $ } from '../core/dom.js';

const Corruption = {
    level: 0, target: 0, t: 0, running: false,
    set(target) {
        this.target = Math.max(0, Math.min(1, target));
        if (!this.running) { this.running = true; this.loop(); }
    },
    loop() {
        const overlay = $('corruption-overlay'), band = $('glitch-band');
        this.t += 0.016; this.level += (this.target - this.level) * 0.06;
        if (this.level > 0.004) {
            overlay.style.setProperty('--corr-op', this.level.toFixed(2)); overlay.classList.add('on');
            overlay.style.opacity = Math.min(0.9, this.level * 1.2);
            if (this.level > 0.35) band.classList.add('on'); else band.classList.remove('on');
            document.documentElement.style.setProperty('--chroma', `${(this.level * 8).toFixed(1)}px`);
            requestAnimationFrame(() => this.loop());
        } else {
            overlay.classList.remove('on'); overlay.style.opacity = 0; band.classList.remove('on');
            document.documentElement.style.setProperty('--chroma', '0px');
            document.querySelectorAll('.chroma-active').forEach(e => e.classList.remove('chroma-active'));
            this.level = 0; this.running = false;
        }
    }
};

export { Corruption };
