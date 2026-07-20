// O.S.I.R.I.S. — Verdict reveal sequence (typewriter, count-up, staggered panels).
// Extracted verbatim from osiris-V4.html (MOD 11b).
import { Utils }       from '../core/utils.js';
import { $ }           from '../core/dom.js';
import { AudioEngine } from '../core/audio.js';
import { State }       from '../logic/state.js';
import { Gamification } from '../logic/gamification.js';
import { Narrator }    from '../features/narrator.js';

// Late-bound (Reveal → UI → Reveal).
let UI = null;
export function bindUI(u) { UI = u; }

const Reveal = {
    setupOverlay(isFail, colorHex, btnText) {
        const vo = $('verdict-overlay'), vw = $('verdict-window'), vc = $('verdict-score-container');
        const vBtn = $('verdict-close-btn'), vText = $('verdict-text'), vArea = $('verdict-action-area');
        
        vc.className = "mono-panel p-4 sm:p-10 w-full text-center border-4 mb-4 sm:mb-6 flex flex-col justify-center items-center bg-black relative overflow-hidden";
        vBtn.className = "btn-monolith w-full sm:w-auto px-6 sm:px-12 py-3.5 sm:py-5 text-[10px] sm:text-xs font-mono tracking-widest font-black flex-1";
        vArea.classList.add('opacity-0'); $('verdict-stats-panel').classList.remove('show');
        $('verdict-level-panel').classList.remove('show'); $('verdict-week-panel').classList.remove('show');
        vText.innerHTML = ''; $('verdict-score').innerText = '0%';
        ['stat-cell-done','stat-cell-missed','stat-cell-streak','stat-cell-avg7'].forEach(id => $(id).classList.remove('reveal'));
        
        if (!isFail) {
            $('verdict-score').className = `font-display font-black verdict-huge transition-colors duration-1000 relative z-10 text-[${colorHex}]`;
            $('verdict-score').style.color = colorHex;
            vc.style.borderColor = colorHex; $('verdict-text-box').style.borderColor = colorHex;
            vBtn.style.backgroundColor = colorHex; vBtn.style.borderColor = colorHex; vBtn.style.color = '#000';
            vBtn.innerText = btnText; Corruption.set(0);
        } else {
            $('verdict-score').className = "font-display font-black verdict-huge transition-colors duration-1000 relative z-10 text-monolith-blood text-aberration chroma-active";
            $('verdict-score').style.color = '';
            vc.style.borderColor = '#ff003c'; $('verdict-text-box').style.borderColor = '#ff003c';
            vBtn.style.backgroundColor = '#ff003c'; vBtn.style.borderColor = '#ff003c'; vBtn.style.color = '#fff';
            vBtn.innerText = btnText;
            document.body.classList.add('shake-active'); setTimeout(() => document.body.classList.remove('shake-active'), 650);
        }
        vo.style.display = 'block'; vo.classList.remove('hidden'); vo.scrollTop = 0;
        return { vo, vw, vText, vArea };
    },
    animateCountUp(el, from, to, dur, fmt, cb) {
        const start = performance.now();
        const frame = (t) => {
            const p = Math.min(1, (t - start) / dur), eased = 1 - Math.pow(1 - p, 3);
            el.innerText = fmt(Math.round(from + (to - from) * eased));
            if (p < 1) requestAnimationFrame(frame); else if (cb) cb();
        }; requestAnimationFrame(frame);
    },
    typeWriter(el, text, i, cb) {
        if (i === 0) el.innerHTML = '';
        if (i < text.length) { el.innerHTML += text.charAt(i); if(i%2===0) AudioEngine.play('type'); setTimeout(() => this.typeWriter(el, text, i+1, cb), 25); }
        else { el.innerHTML += '<span class="animate-pulse">_</span>'; if (cb) cb(); }
    },
    renderLevelCard(xpBef, xpGain, lvlBef, lvlAft) {
        const leveledUp = lvlAft.level > lvlBef.level;
        $('level-num').innerText = String(lvlBef.level).padStart(2, '0');
        $('level-name').innerText = Gamification.nameOf(lvlBef.level);
        const gb = Gamification.gradeOf(lvlBef.level);
        $('level-grade').innerText = gb.grade; $('level-tier-label').innerText = `${gb.grade} // ${gb.tier}`;
        $('level-xp-bar').style.transition = 'none';
        $('level-xp-bar').style.width = lvlBef.xpForNext > 0 ? `${(lvlBef.xpInLevel/lvlBef.xpForNext)*100}%` : '100%';
        $('level-xp-current').innerText = lvlBef.xpInLevel; $('level-xp-next').innerText = lvlBef.xpForNext > 0 ? lvlBef.xpForNext : 'MAX';
        const gc = xpGain >= 50 ? 'text-monolith-toxic' : (xpGain > 0 ? 'text-white' : 'text-monolith-blood');
        $('level-xp-gain').className = `mt-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest font-bold ${gc}`;
        $('level-xp-gain').innerText = `+${xpGain} XP`;

        setTimeout(() => {
            $('level-xp-bar').style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
            if (leveledUp) {
                $('level-xp-bar').style.width = '100%';
                setTimeout(() => {
                    const fl = $('levelup-flash'); fl.querySelector('.card').innerHTML = `LEVEL UP<br><span style="font-size:0.4em;letter-spacing:0.3em;color:#71717a">${Gamification.gradeOf(lvlAft.level).grade} // ${Gamification.nameOf(lvlAft.level)}</span>`;
                    fl.classList.add('on'); AudioEngine.play('levelup'); Utils.triggerVibe([50, 30, 50, 30, 150]);
                    setTimeout(() => fl.classList.remove('on'), 1200);
                }, 800);
                setTimeout(() => {
                    $('level-num').innerText = String(lvlAft.level).padStart(2, '0'); $('level-num').classList.add('level-up-flash');
                    $('level-name').innerText = Gamification.nameOf(lvlAft.level);
                    const ga = Gamification.gradeOf(lvlAft.level); $('level-grade').innerText = ga.grade; $('level-tier-label').innerText = `${ga.grade} // ${ga.tier}`;
                    $('level-xp-bar').style.transition = 'none'; $('level-xp-bar').style.width = '0%';
                    $('level-xp-current').innerText = '0'; $('level-xp-next').innerText = lvlAft.xpForNext > 0 ? lvlAft.xpForNext : 'MAX';
                    setTimeout(() => {
                        $('level-xp-bar').style.transition = 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
                        $('level-xp-bar').style.width = lvlAft.xpForNext > 0 ? `${(lvlAft.xpInLevel/lvlAft.xpForNext)*100}%` : '100%';
                        this.animateCountUp($('level-xp-current'), 0, lvlAft.xpInLevel, 900, v=>`${v}`);
                    }, 60);
                    setTimeout(() => $('level-num').classList.remove('level-up-flash'), 1000);
                }, 1600);
            } else {
                $('level-xp-bar').style.width = lvlAft.xpForNext > 0 ? `${(lvlAft.xpInLevel/lvlAft.xpForNext)*100}%` : '100%';
                this.animateCountUp($('level-xp-current'), lvlBef.xpInLevel, lvlAft.xpInLevel, 900, v=>`${v}`);
                AudioEngine.play('process');
            }
            $('prestige-action-wrap').classList.toggle('hidden', lvlAft.level < 100);
        }, 200);
    },
    renderWeekBars() {
        const wrap = $('week-bars'), days = Utils.last7DaysScores(State.data.history);
        wrap.innerHTML = days.map(d => {
            let cls = 'week-bar'; if (d.score === null) cls += ' empty'; else if (d.score === 100) cls += ' pos'; else cls += ' neg';
            if (d.isToday) cls += ' today';
            return `<div class="${cls}" data-h="${d.score === null ? 10 : Math.max(8, d.score)}"><div class="fill" style="height:0%"></div><div class="lbl">${d.dow}</div></div>`;
        }).join('');
        wrap.querySelectorAll('.week-bar').forEach((b, i) => setTimeout(() => { b.querySelector('.fill').style.height = `${b.getAttribute('data-h')}%`; AudioEngine.play('process'); }, i * 90));
    },
    
    startDaily(pct, comp, total, xpBef, xpGain, lvlBef, lvlAft) {
        const isFail = pct < 100;
        const color = isFail ? '#ff003c' : '#00ff66', btnText = isFail ? "INCASSA L'UMILIAZIONE" : "ACCETTA LA TREGUA";
        $('verdict-tag').innerText = 'RAPPORTO DI CONDOTTA PERSONALE';
        $('verdict-score-sub').innerText = `${comp}/${total} DOVERI`;
        
        // Setup labels specific for daily
        $('lbl-cell-done').innerText = 'Adempiuti'; $('lbl-cell-missed').innerText = 'Disertati';
        $('lbl-cell-streak').innerText = 'Catena'; $('lbl-cell-avg7').innerText = 'Media 7GG';

        const { vo, vw, vText, vArea } = this.setupOverlay(isFail, color, btnText);
        if (isFail) Corruption.set(0.5 + (1 - pct / 100) * 0.7);

        setTimeout(() => {
            vo.classList.remove('opacity-0'); vw.classList.remove('translate-y-8');
            AudioEngine.play(isFail ? 'error' : 'success'); Utils.triggerVibe(isFail ? [100,50,100,50,300] : [40,40,250]);
            
            this.animateCountUp($('verdict-score'), 0, pct, 700, v=>`${v}%`, () => AudioEngine.play(isFail ? 'glitch':'check'));
            
            setTimeout(() => {
                $('verdict-stats-panel').classList.add('show');
                const missed = total - comp, aw = Utils.avgOverDays(7, State.data.history);
                $('stat-cell-done').classList.toggle('pos', comp>0); $('stat-cell-missed').classList.toggle('neg', missed>0); $('stat-cell-streak').classList.toggle('pos', State.data.streak>0);
                const cells = [ { id: 'stat-cell-done', el:$('stat-done'), val: comp, fmt: v=>v }, { id: 'stat-cell-missed', el:$('stat-missed'), val: missed, fmt: v=>v },
                                { id: 'stat-cell-streak', el:$('stat-streak'), val: State.data.streak, fmt: v=>v }, { id: 'stat-cell-avg7', el:$('stat-avg7'), val: aw, fmt: v=>v===null?'--%':`${v}%` }];
                cells.forEach((c,i) => setTimeout(() => { $(c.id).classList.add('reveal'); AudioEngine.play('process'); if(c.val!==null) this.animateCountUp(c.el, 0, c.val, 500, c.fmt); else c.el.innerText='--%'; }, i*150));
            }, 900);
            
            setTimeout(() => { $('verdict-level-panel').classList.add('show'); this.renderLevelCard(xpBef, xpGain, lvlBef, lvlAft); }, 1900);
            setTimeout(() => { $('verdict-week-panel').classList.add('show'); this.renderWeekBars(); }, 3000);
            
            // USE THE NEW NARRATOR ENGINE based on level!
            setTimeout(() => { 
                const phrase = Narrator.getDailyPhrase(pct, lvlAft.level); 
                this.typeWriter(vText, phrase, 0, () => vArea.classList.remove('opacity-0')); 
            }, 3900);
        }, 150);
    },
    startBoss(pct, tier, xpBef, lvlBef, lvlAft) {
        const isFail = tier.outcome === 'defeat';
        const color = ['mythic','gold'].includes(tier.outcome) ? '#fbbf24' : (tier.outcome === 'silver' ? '#a1a1aa' : (isFail ? '#ff003c' : '#ffffff'));
        const btnText = isFail ? "INCASSA IL FIASCO" : "ACCETTA IL TROFEO";
        $('verdict-tag').innerText = `GIUDIZIO SETTIMANALE // BOSS BATTLE // ${tier.tag}`;
        $('verdict-score-sub').innerText = `MEDIA 7 GIORNI // BONUS: +${tier.xp} XP`;
        
        $('lbl-cell-done').innerText = '100% GG'; $('lbl-cell-missed').innerText = 'FALLIMENTI';
        $('lbl-cell-streak').innerText = 'GG PERSI'; $('lbl-cell-avg7').innerText = 'MEDIA 7GG';

        const { vo, vw, vText, vArea } = this.setupOverlay(isFail, color, btnText);
        if (isFail) Corruption.set(0.7); else if (tier.outcome==='silver'||tier.outcome==='bronze') Corruption.set(0.18);

        setTimeout(() => {
            vo.classList.remove('opacity-0'); vw.classList.remove('translate-y-8');
            AudioEngine.play(isFail ? 'error' : 'success'); Utils.triggerVibe(isFail ? [100,50,100,50,300] : [40,40,250]);
            this.animateCountUp($('verdict-score'), 0, pct, 800, v=>`${v}%`, () => AudioEngine.play(isFail ? 'glitch':'check'));
            
            setTimeout(() => {
                $('verdict-stats-panel').classList.add('show');
                const days = Utils.last7DaysScores(State.data.history);
                const wins = days.filter(d=>d.score===100).length, lost = days.filter(d=>d.score!==null && d.score<100).length, skip = days.filter(d=>d.score===null).length;
                $('stat-cell-done').classList.toggle('pos', wins>0); $('stat-cell-missed').classList.toggle('neg', lost>0); $('stat-cell-streak').classList.toggle('pos', State.data.streak>0);
                const cells = [ { id: 'stat-cell-done', el:$('stat-done'), val: wins, fmt: v=>v }, { id: 'stat-cell-missed', el:$('stat-missed'), val: lost, fmt: v=>v },
                                { id: 'stat-cell-streak', el:$('stat-streak'), val: skip, fmt: v=>v }, { id: 'stat-cell-avg7', el:$('stat-avg7'), val: pct, fmt: v=>`${v}%` }];
                cells.forEach((c,i) => setTimeout(() => { $(c.id).classList.add('reveal'); AudioEngine.play('process'); this.animateCountUp(c.el, 0, c.val, 500, c.fmt); }, i*150));
            }, 900);
            
            setTimeout(() => { $('verdict-level-panel').classList.add('show'); this.renderLevelCard(xpBef, tier.xp, lvlBef, lvlAft); }, 1900);
            setTimeout(() => { $('verdict-week-panel').classList.add('show'); this.renderWeekBars(); }, 3000);
            
            // USE THE NEW NARRATOR ENGINE for Boss!
            setTimeout(() => { 
                const phrase = Narrator.getBossPhrase(tier, pct, lvlAft.level);
                this.typeWriter(vText, phrase, 0, () => vArea.classList.remove('opacity-0')); 
            }, 3900);
        }, 150);
    }
};

export { Reveal };
