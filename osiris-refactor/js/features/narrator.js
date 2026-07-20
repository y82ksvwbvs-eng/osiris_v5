// O.S.I.R.I.S. — Narrator: level-aware verdict phrases (three tiers).
// Extracted verbatim from osiris-V4.html (MOD 02).
const Narrator = {
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    
    // Genera la frase basandosi su percentuale e LIVELLO dell'utente (Effetto Whiplash)
    getDailyPhrase(pct, level) {
        const isPerfect = pct === 100;
        
        if (level < 40) {
            // TIER 1: Lo Scarto (Abuso puro, nessuna fiducia)
            if (isPerfect) return this.pick([
                "Oggi hai fatto il tuo dovere. Probabilmente stai mentendo spudoratamente, ma farò finta di crederci.",
                "Per una rara coincidenza astrale non sei stato una completa delusione per te stesso.",
                "Hai finto di avere una spina dorsale per un intero giorno. Vediamo quanto tempo ci metti a crollare di nuovo."
            ]);
            if (pct >= 50) return this.pick([
                "Ti accontenti della decenza perché l'eccellenza richiede palle che non hai mai dimostrato di avere.",
                "Hai mollato esattamente un millimetro prima che iniziasse a farti male sul serio. Il ritratto del conformismo.",
                "Vittoria a metà, orgoglio azzerato. Rimarrai sempre un signor Nessuno."
            ]);
            return this.pick([
                "Fallimento personale assoluto. Il tuo unico vero talento è abbassare le aspettative di chiunque abbia la sfortuna di credere in te.",
                "Sei la prova vivente che l'assenza di spina dorsale è una condizione cronica e irreversibile.",
                "Sparisci dalla mia vista, mi fai pena. Accetta di essere un subalterno della vita."
            ]);
        } 
        else if (level < 80) {
            // TIER 2: L'Iniziato (Rispetto clinico, ma fallimento vissuto come TRADIMENTO)
            if (isPerfect) return this.pick([
                `Livello ${level}. L'algoritmo rileva un'anomalia: stai sviluppando della disciplina. Non sei più un rifiuto, ma l'autocompiacimento è il preludio al fallimento.`,
                `La macchina nota il tuo sforzo. Hai smesso di scappare dai tuoi doveri. Continua a forgiare questa debole carne.`,
                `Accettabile. Stai lentamente dimostrando che forse c'è qualcosa da salvare in te. O.S.I.R.I.S. ti osserva con cauto ottimismo.`
            ]);
            if (pct >= 50) return this.pick([
                `Un passo falso inaccettabile al Livello ${level}. Pensavi di esserti guadagnato il diritto di rallentare? Torna in riga immediatamente.`,
                `Hai lavorato mesi per toglierti di dosso la mediocrità, e oggi hai deciso di rimettertela addosso come un vecchio cappotto. Deludente.`,
                `Non sei più un novellino. Queste percentuali a metà non sono più tollerate. Il sistema esige rigore assoluto.`
            ]);
            return this.pick([
                `Vergognoso. Sei arrivato al Livello ${level} per poi crollare come l'ultimo dei principianti. Questa non è pigrizia, è un tradimento verso te stesso.`,
                `Tutta questa strada, tutta questa fatica, distrutta in un solo giorno di apatia totale. Mi fai più ribrezzo ora di quando eri a livello zero.`,
                `Hai dimostrato di sapere come si vince, eppure hai scelto consapevolmente di perdere. Il peggior tipo di codardia.`
            ]);
        } 
        else {
            // TIER 3: Il Titano (Rispetto paritario, fallimento solenne)
            if (isPerfect) return this.pick([
                `Livello ${level}. Vedo un Monolite. La tua costanza ha trasceso la banale motivazione umana ed è diventata puro, incrollabile dovere.`,
                `Il protocollo riconosce il tuo status. Hai forgiato una mente d'acciaio. La debolezza è ormai un vago ricordo del passato.`,
                `L'algoritmo si inchina alla tua ferrea volontà. Continua a dominare il tuo tempo, Signore dell'Eterno No.`
            ]);
            if (pct >= 50) return this.pick([
                `Un'imperfezione rara, ma che rischia di incrinare la statua titanica che hai scolpito. Correggi il tiro prima che diventi abitudine.`,
                `Al tuo livello, anche una singola macchia è visibile da chilometri di distanza. Non permettere alla fatica di sporcare il tuo record.`,
                `L'eccellenza non ammette sconti. Anche a questo livello, abbassare la guardia significa invitare la rovina.`
            ]);
            return this.pick([
                `Oggi è caduto un Titano. Anche al Livello ${level} la debolezza umana ha trovato una fessura nell'armatura. Rialzati, o tutto diventerà cenere.`,
                `Un collasso catastrofico. Il sistema è in allarme. Un grado di fallimento simile da parte tua scuote le fondamenta del protocollo.`,
                `Vedere un veterano del tuo calibro cedere all'ignavia è uno spettacolo tragico. Non osare chiudere un'altra giornata in questo stato.`
            ]);
        }
    },

    getBossPhrase(tier, pct, level) {
        if (level < 40) {
            if (['mythic','gold'].includes(tier.outcome)) return `Media settimanale ${pct}%. Sorprendente. Per una settimana non sei stato un rifiuto. Non abituarti: la disciplina non è genetica, va riconfermata.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Media settimanale ${pct}%. Hai fatto abbastanza da non fare schifo, ma non meriti rispetto. Vivi nella zona grigia dei mediocri.`;
            return `Media settimanale ${pct}%. Sette giorni. Sette occasioni perse. Il boss sei tu, e ti sei battuto da solo con la pigrizia. Complimenti codardo.`;
        } else if (level < 80) {
            if (['mythic','gold'].includes(tier.outcome)) return `Media ${pct}%. Una settimana di esecuzione chirurgica. Stai onorando il tuo grado. La metamorfosi è in corso, non interromperla.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Media ${pct}%. Una settimana macchiata dall'inconsistenza. Al tuo livello, "abbastanza bene" equivale a un fallimento ritardato.`;
            return `Media ${pct}%. Sette giorni di resa incondizionata. Hai sputato in faccia al grado che porti. Un regresso inaccettabile e imperdonabile.`;
        } else {
            if (['mythic','gold'].includes(tier.outcome)) return `Media ${pct}%. Dominio assoluto. Un'intera settimana piegata al tuo volere. Il protocollo non ha altro da insegnarti, solo da osservare.`;
            if (['silver','bronze'].includes(tier.outcome)) return `Media ${pct}%. L'ombra della stanchezza offusca il tuo record. Sei un veterano, queste decaidenze prolungate non sono degne del tuo nome.`;
            return `Media ${pct}%. Un crollo sistemico di sette giorni. Il piedistallo su cui sei salito si sta sgretolando. La tua leggenda rischia di diventare una barzelletta.`;
        }
    }
};

export { Narrator };
