// O.S.I.R.I.S. — Narrator (Behavioral Monitoring rewrite)
//
// The original Narrator produced RPG-style verdicts ("Boss", "codardo", "vittoria").
// Per the Weekly System refactor, all output is now clinical / impersonal / diagnostic:
//   - never congratulates
//   - never shames
//   - never uses second-person emotion
//   - describes the observed state as if the system were logging it
//
// Public API preserved:  Narrator.getDailyPhrase(pct, level)  and  Narrator.getBossPhrase(tier, pct, level)
// (Callers in logic.js / reveal.js are unchanged.)
const Narrator = {
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    // Daily diagnostic report — pct in [0,100], level in [1,100].
    // Level is included as context ("livello di osservazione") but never celebrated.
    getDailyPhrase(pct, level) {
        const isPerfect = pct === 100;

        if (level < 40) {
            if (isPerfect)  return this.pick([
                `Ciclo chiuso al 100%. Conformità osservata. Livello di osservazione ${level}. Sistema in attesa del prossimo ciclo.`,
                `Direttive completate integralmente. Nessuna deviazione rilevata. Il pattern richiede ulteriore verifica temporale.`,
                `Esecuzione conforme. Il sistema aggiorna il modello comportamentale del soggetto. Dati insufficienti per conclusioni stabili.`
            ]);
            if (pct >= 50) return this.pick([
                `Conformità parziale (${pct}%). Rilevata deviazione moderata. Livello ${level}. Verifica delle cause raccomandata.`,
                `Esecuzione incompleta. Il sistema registra un pattern di adempimento intermittente.`,
                `Direttive parzialmente evase. Indice di corruzione in aumento.`
            ]);
            return this.pick([
                `Conformità ${pct}%. Deviazione critica registrata. Livello ${level}. Il sistema aumenta la sensibilità di monitoraggio.`,
                `Esecuzione insufficiente. Pattern di elusione rilevato. Dati archiviati per l'audit settimanale.`,
                `Ciclo non conforme. Il sistema segnala aumento dell'indice di corruzione.`
            ]);
        }
        else if (level < 80) {
            if (isPerfect)  return this.pick([
                `Ciclo chiuso al 100%. Stabilità comportamentale confermata al livello ${level}. Nessuna azione correttiva richiesta.`,
                `Conformità totale. Il modello predittivo aggiorna la baseline del soggetto.`,
                `Esecuzione priva di deviazioni. Il sistema archivia la traccia come riferimento operativo.`
            ]);
            if (pct >= 50) return this.pick([
                `Conformità ${pct}%. Rilevata regressione rispetto alla baseline del livello ${level}. Analisi in corso.`,
                `Esecuzione discontinua. Il sistema flagga la sessione per revisione nell'audit settimanale.`,
                `Deviazione moderata rilevata. La corruzione settimanale è in crescita. Contenimento raccomandato.`
            ]);
            return this.pick([
                `Conformità ${pct}%. Deviazione significativa al livello ${level}. Il sistema attiva sorveglianza estesa.`,
                `Regressione critica registrata. La baseline del soggetto viene rivalutata.`,
                `Ciclo non conforme. Il sistema segnala pattern di elusione persistente.`
            ]);
        }
        else {
            if (isPerfect)  return this.pick([
                `Ciclo chiuso al 100%. Livello ${level}. Il sistema conferma un profilo comportamentale ad alta prevedibilità.`,
                `Conformità totale. Nessuna anomalia rilevata. Il modello predittivo resta stabile.`,
                `Esecuzione ottimale. L'archivio registra continuità comportamentale.`
            ]);
            if (pct >= 50) return this.pick([
                `Conformità ${pct}%. Deviazione rara al livello ${level}. Il sistema apre segnalazione diagnostica.`,
                `Regressione rilevata su profilo storicamente stabile. Il sistema effettua analisi delle cause.`,
                `Anomalia comportamentale in un profilo ad alta conformità. Corruzione in aumento.`
            ]);
            return this.pick([
                `Conformità ${pct}%. Deviazione critica su profilo ad alta stabilità. Il sistema riclassifica il soggetto.`,
                `Regressione severa registrata. Livello ${level}. Corruzione oltre soglia di attenzione.`,
                `Ciclo non conforme. Il sistema attiva rivalutazione del profilo di rischio.`
            ]);
        }
    },

    // Weekly Review phrase — replaces the boss-battle narrative.
    // `tier.outcome` is still used (mythic/gold/silver/bronze/defeat) for compat with
    // Gamification.bossTier(); we translate outcomes into clinical containment vocabulary.
    getBossPhrase(tier, pct, level) {
        const containment = {
            mythic:  'contenimento ottimale',
            gold:    'contenimento efficace',
            silver:  'contenimento parziale',
            bronze:  'contenimento marginale',
            defeat:  'contenimento fallito'
        }[tier.outcome] || 'contenimento indeterminato';

        if (level < 40) {
            if (['mythic','gold'].includes(tier.outcome))   return `Audit settimanale chiuso. Media di conformità ${pct}%. Esito: ${containment}. Livello di osservazione ${level}. Il sistema registra un pattern iniziale di adempimento.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Audit settimanale chiuso. Media di conformità ${pct}%. Esito: ${containment}. Il sistema segnala instabilità operativa.`;
            return `Audit settimanale chiuso. Media di conformità ${pct}%. Esito: ${containment}. Corruzione settimanale registrata. Modello di rischio aggiornato.`;
        } else if (level < 80) {
            if (['mythic','gold'].includes(tier.outcome))   return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Livello ${level}. Baseline del soggetto confermata.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Rilevata inconsistenza settimanale rispetto al profilo atteso.`;
            return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Regressione settimanale registrata. Rivalutazione della baseline in corso.`;
        } else {
            if (['mythic','gold'].includes(tier.outcome))   return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Livello ${level}. Il profilo del soggetto resta ad alta prevedibilità.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Anomalia rilevata su profilo storicamente stabile.`;
            return `Audit settimanale chiuso. Media ${pct}%. Esito: ${containment}. Deviazione severa rispetto alla baseline consolidata. Il sistema attiva rivalutazione del profilo di rischio.`;
        }
    }
};

export { Narrator };
