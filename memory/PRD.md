# PRD — O.S.I.R.I.S.

## 1. Refactor iniziale (Modularizzazione)
Trasformato il monolite `osiris-V4.html` (2.332 righe) in un'app statica modulare in `/app/osiris-refactor/` (23 moduli ES + 3 CSS + 4 doc).
Contratto: comportamento e save invariati (`osiris_db_v3`, `osiris_db_v3_backup`, schema v3, migrazione preservata).

## 2. Weekly System Refactor (Behavioral Monitoring)
Sostituito il sistema Boss Battle con un modello sistemico di monitoraggio comportamentale, conforme alla filosofia O.S.I.R.I.S. (OS distopico che osserva/diagnostica/contiene).

### Scelte utente applicate
- **1a**: Corruption Index invertito (0% integrità → 100% crisi)
- **2c**: Effetti visivi + notifiche reali; nessun cambio di gameplay forzato (requisiti/randomizzazione esclusi)
- **3**: Chiavi DB `osiris_db_v3` invariate; solo campi additivi (`currentAnomaly`, `extProtocol`)
- **4B**: Achievement — ID interni preservati, label UI rinominate (niente "PRIMO SANGUE", "DEICIDA")
- **5a**: Bottone dedicato "▷ AVVIA PROTOCOLLO STRAORDINARIO"

### Vocabolario purgato
Boss / HP / Attacco / Danno / Vittoria / Sconfitta / Nemico / Combattimento / Mythic·Gold·Silver·Bronze → **Anomalia · Corruzione · Integrità · Stabilità · Contenimento · Protocollo · Diagnostico · Audit · Compliance · Osservazione**.

### Architettura (Config → Core → Logic → Features → UI, invariata)
File modificati:
- `js/core/config.js` — `ANOMALIES` (7), `CONTAINMENT_THRESHOLDS` (5), `EXT_PROTOCOL`, achievement rilabellati
- `js/logic/state.js` — campi additivi `currentAnomaly` / `extProtocol` (save-compat con v3)
- `js/logic/bossHp.js` — Corruption invertita (0→100), output diagnostico terminal-style, delega a `Containment`
- `js/logic/gamification.js` — `bossTier` con tag clinici ("CONTENIMENTO OTTIMALE"/"CONTENIMENTO FALLITO")
- `js/features/narrator.js` — riscritto: linguaggio clinico impersonale, niente celebrazione/vergogna
- `js/ui/ui.js` — banner Anomalia + metodi modal Extraordinary Protocol
- `js/ui/reveal.js` — verdict labels ("AUDIT SETTIMANALE" invece di "BOSS BATTLE")
- `index.html` — anomaly banner, Corruption panel rilabellato, bottone + modal Extraordinary
- `assets/css/components.css` — 5 stili di degrado (CP-01..CP-05: aberrazione, offuscamento, instabilità)
- `js/app.js` — wiring dei nuovi moduli

File creati:
- `js/logic/anomaly.js` — selezione deterministica settimanale (7 anomalie, rotazione ISO week)
- `js/logic/containment.js` — attivazione/disattivazione protocolli per soglia (deterministico, reversibile)
- `js/features/extraordinary.js` — Protocollo Straordinario 1×/settimana

### Preservato (mai modificato)
- XP, livelli, streak, task, statistiche, calendario
- Progressione, prestige, achievement (ID interni)
- Sistema di salvataggio, backup/import/export, ShareURL
- Purgatorio, boot terminal, audio engine
- Layout mobile, animazioni CRT, glitch, corruption FX

### Validato in-browser
- Anomalia ruota correttamente su 7 valori per settimana ISO ✓
- Corruption 0→100% invertito, delta Δ+/Δ- visibili ✓
- Containment CP-01..CP-05 attiva/disattiva `ct-N` sul body con notice ✓
- Effetti visivi CSS (aberrazione, offuscamento, instabilità bordi) applicati ✓
- Extraordinary Protocol: register → in-corso → resolve → applica delta a bossHeal/bossDmg ✓
- Nessun residuo di vocabolario RPG nella UI (`rpgLeaks: []`) ✓
- Save compat totale: `dbSchema=3`, chiavi `osiris_db_v3`/`osiris_db_v3_backup` invariate ✓
- Zero console error ✓

### Preview live
**https://osiris-modules.preview.emergentagent.com/osiris/**

### Backlog opzionale (P2)
- Report Weekly Review più strutturato (attualmente narrato via Narrator + verdict panels)
- Sezione "storico protocolli" per rileggere le sfide passate
- Effetti audio dedicati per attivazione soglia (attualmente riusa `AudioEngine.play('type')`)
