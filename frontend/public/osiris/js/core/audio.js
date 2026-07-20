// O.S.I.R.I.S. — Web Audio synth engine (type/check/error/success/process/glitch/levelup)
// Extracted verbatim from osiris-V4.html (MOD 04)
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    play(type) {
        try {
            this.init(); const now = this.ctx.currentTime;
            if (type === 'type') {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                o.type = 'square'; o.frequency.setValueAtTime(600, now); o.frequency.exponentialRampToValueAtTime(80, now + 0.05);
                g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05); o.start(now); o.stop(now + 0.05);
            } else if (type === 'check') {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now); o.frequency.setValueAtTime(300, now + 0.03);
                g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1); o.start(now); o.stop(now + 0.1);
            } else if (type === 'error') {
                const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), g = this.ctx.createGain();
                o1.connect(g); o2.connect(g); g.connect(this.ctx.destination);
                o1.type = 'sawtooth'; o1.frequency.setValueAtTime(80, now); o1.frequency.linearRampToValueAtTime(30, now + 0.8);
                o2.type = 'square'; o2.frequency.setValueAtTime(82, now); o2.frequency.linearRampToValueAtTime(31, now + 0.8);
                g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                o1.start(now); o2.start(now); o1.stop(now + 0.8); o2.stop(now + 0.8);
            } else if (type === 'success') {
                [220, 277.18, 329.63, 440].forEach((f, i) => {
                    const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                    o.type = 'square'; o.frequency.setValueAtTime(f, now + i * 0.1); g.gain.setValueAtTime(0.08, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5); o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.5);
                });
            } else if (type === 'process') {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                o.type = 'triangle'; o.frequency.setValueAtTime(100 + Math.random() * 1000, now);
                g.gain.setValueAtTime(0.03, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05); o.start(now); o.stop(now + 0.05);
            } else if (type === 'glitch') {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                o.type = 'sawtooth'; o.frequency.setValueAtTime(30 + Math.random() * 50, now);
                g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15); o.start(now); o.stop(now + 0.15);
            } else if (type === 'levelup') {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
                o.type = 'square'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
                g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.7); o.start(now); o.stop(now + 0.7);
                [440, 554.37, 659.25, 880].forEach((f, i) => {
                    const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain(); o2.connect(g2); g2.connect(this.ctx.destination);
                    o2.type = 'square'; o2.frequency.setValueAtTime(f, now + 0.2 + i * 0.08); g2.gain.setValueAtTime(0.06, now + 0.2 + i * 0.08);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + i * 0.08 + 0.4); o2.start(now + 0.2 + i * 0.08); o2.stop(now + 0.2 + i * 0.08 + 0.4);
                });
            }
        } catch(e) {}
    }
};

export { AudioEngine };
