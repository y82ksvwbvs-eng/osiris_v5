// O.S.I.R.I.S. — Boot terminal sequence (typewriter kernel log).
// Extracted verbatim from osiris-V4.html (bottom of MOD 17 / bootstrap).
import { $ }           from '../core/dom.js';
import { AudioEngine } from '../core/audio.js';
import { State }       from '../logic/state.js';

export function runBoot() {
    const s = $('boot-screen'), t = $('boot-text'); s.classList.remove('hidden'); s.style.display = 'flex';
    const lines = ["INIZIALIZZAZIONE KERNEL O.S.I.R.I.S. v3.0...", "CARICAMENTO MODULI DI CONTROLLO PSICOLOGICO [OK]", "MODULO AUDIO ELIMINATO: REQUISITO UTENTE SODDISFATTO", "VERIFICA INTEGRITÀ DEL SOGGETTO... [FALLITA: RILEVATA DEBOLEZZA]", "AVVIO INTERFACCIA OPERATIVA. PREPARARSI AL GIUDIZIO."];
    let i = 0;
    const typeLine = () => {
        if (i < lines.length) { t.innerHTML += lines[i++] + "<br>"; AudioEngine.play('process'); setTimeout(typeLine, 200 + Math.random() * 300); }
        else setTimeout(() => { s.style.opacity = '0'; $('main-content').classList.remove('opacity-0'); sessionStorage.setItem('osiris_booted', 'true'); setTimeout(() => { s.style.display = 'none'; State.load(); }, 400); }, 800);
    }; setTimeout(typeLine, 500);
}
