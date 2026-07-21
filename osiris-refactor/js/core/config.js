// O.S.I.R.I.S. — Configuration constants
// Extracted from osiris-V4.html (MOD 01) + extensions for the Behavioral Monitoring model.
//
// Schema: v3 preserved (STORE_KEY / BACKUP_KEY / SCHEMA_VERSION unchanged).
// The new Behavioral Monitoring model reuses the same fields under new *semantic*
// names — no data migration required, save-compat is total.
//   bossWeek     → session week key (unchanged)
//   bossDmg      → raw deviation points (interpreted as corruption raw)
//   bossHeal     → raw compliance points (interpreted as containment raw)
//   bossHistory  → weekly session history (unchanged)
//   lastBossWeek → last review timestamp (unchanged)
// New optional fields added by the refactor: `currentAnomaly`, `extProtocol`.
const CONFIG = {
    STORE_KEY: 'osiris_db_v3',
    BACKUP_KEY: 'osiris_db_v3_backup',
    SCHEMA_VERSION: 3,
    PURGATORY_THRESHOLD: 3,
    MONTHS: ['GENNAIO','FEBBRAIO','MARZO','APRILE','MAGGIO','GIUGNO','LUGLIO','AGOSTO','SETTEMBRE','OTTOBRE','NOVEMBRE','DICEMBRE'],
    DOW: ['L','M','M','G','V','S','D']
};

const GRADES = [
    { grade: 'GRADO 0', tier: 'SCARTI' }, { grade: 'GRADO I', tier: 'PENITENTI' }, { grade: 'GRADO II', tier: 'SCRIBI' },
    { grade: 'GRADO III', tier: 'SUDDITI' }, { grade: 'GRADO IV', tier: 'ARTEFICI' }, { grade: 'GRADO V', tier: 'INIZIATI' },
    { grade: 'GRADO VI', tier: 'CENTURIONI' }, { grade: 'GRADO VII', tier: 'PRETORIANI' }, { grade: 'GRADO VIII', tier: 'INQUISITORI' },
    { grade: 'GRADO IX', tier: 'MONARCHI' }
];

const LEVEL_NAMES = [
    "SPETTRO INERTE","LARVA CIECA","ECO SVUOTATA","CENERE UMIDA","MOLLUSCO SFATTO","PATINA DI SUDORE","RUGGINE VIVENTE","IMPRONTA SFOCATA","ANIMA VUOTA","TARLO DIURNO",
    "PENITENTE MUTO","FLAGELLATO","GENUFLESSO","PROSTRATO","SUPPLICE INDEGNO","RESPIRATORE","SERVO SILENTE","ZAVORRA UTILE","ATTREZZO ROTTO","RECLUTA GREZZA",
    "SCRIBA MEDIOCRE","NOTAIO DEL FALLIMENTO","TESTIMONE STANCO","VOCE OPACA","CRONISTA DEL VUOTO","DELATORE","ARCHIVISTA CARIE","AMANUENSE","CATALOGATORE D'OSSA","PORTAVOCE MUTO",
    "SUDDITO NECESSARIO","TRIBUTARIO","CENSITO","NUMERO REGISTRATO","SILICE VIVENTE","NUOVA MATRICOLA","GREGARIO ONESTO","VOTATO ALL'INUTILITÀ","OPEROSO SILENTE","PIETRA POSATA",
    "ARTIGIANO MINIMO","FABBRO DELLE ROUTINE","FALEGNAME DELL'INSONNIA","TESSITORE DI ORE","FONDITORE SOBRIO","INGRANAGGIO CROMATO","INCUDINE STOICA","FORGIATORE SILENTE","MURATORE D'ABITUDINI","GEOMETRA DEL TEMPO",
    "INIZIATO PROMETTENTE","NOVIZIO DEGNO","ADEPTO SILENTE","DISCIPULO VIGILE","PROSELITE ALFA","GUARDIA GIURATA","SENTINELLA","VEDETTA NOTTURNA","PORTATORE DI LAMPADA","VESSILLIFERO",
    "CENTURIONE MINORE","CAPORALE FERMO","LEGIONARIO VETERANO","DECURIONE","TRIBUNO","CENTURIONE DI FERRO","STANDARDIFERO","AQUILIFERO","PRIMIPILO","LEGATO DEL DOVERE",
    "PRETORIANO ALFA","GUARDIA IMPERIALE","VESSILLIFERO DELL'ORDINE","CATAFRATTO","PALADINO DEL RIGORE","TEMPLARE INTERNO","PARABELLIA","CROCIATO NEUTRO","ASSEDIATORE DELL'EGO","MARTELLO DI ADAMANTIO",
    "INQUISITORE MINORE","GIUDICE DELLA CARNE","CHIRURGO MORALE","CONFESSORE OSTILE","INQUISITORE MAGGIORE","GRAN INQUISITORE","VOCE DEL TRIBUNALE","MANO NERA","FLAGELLO DELLA MENZOGNA","ARCONTE DELLA GIUSTIZIA",
    "ARCONTE SILENTE","DOMINATORE INTERIORE","RE DI SE STESSO","MONARCA ASSOLUTO","IMPERATORE STOICO","CUSTODE DELL'ORDINE","ORACOLO DELLA LEGGE","SIGNORE DELL'ETERNO NO","QUASI-DIVINITÀ","OSIRIS INCARNATO"
];

// ACHIEVEMENTS: IDs preserved for save-compat with v3 records; only UI titles/descriptions
// were normalized to the Behavioral Monitoring vocabulary (no RPG references).
//
// Schema extension (additive, back-compat with any older entry):
//   rarity?  : 'common' | 'rare' | 'epic' | 'legendary'  (defaults to 'common' in UI)
//   xp?      : number                                    (XP granted at unlock; default 0)
//   hidden?  : boolean                                   (title/desc masked while locked)
//   category?: 'discipline'|'consistency'|'progression'|'system'|'secret'  (defaults to 'progression')
// Existing entries below carry the fields explicitly so the filter/UI logic never
// falls back to a default that would misplace them in the categories view.
const ACHIEVEMENTS = [
    // -------- Legacy catalogue (semantics untouched, category added) --------
    { id: 'first_blood',      title: 'PRIMA REGISTRAZIONE', desc: 'Il sistema ha completato il tuo primo Audit.',                              icon: '◉', category: 'progression' },
    { id: 'streak_7',         title: 'DISCIPLINA STABILE',  desc: 'Sette cicli consecutivi in conformità totale.',                             icon: '◈', category: 'consistency' },
    { id: 'streak_30',        title: 'MONOLITE',            desc: 'Trenta cicli consecutivi in conformità totale.',                            icon: '◆', category: 'consistency' },
    { id: 'boss_mythic',      title: 'CONTENIMENTO OTTIMALE', desc: 'Anomalia settimanale contenuta con indice di conformità ≥ 90%.',           icon: '▲', category: 'progression' },
    { id: 'purgatory_escape', title: 'STABILIZZAZIONE',     desc: 'Uscita dallo stato di Purgatorio con conformità 100%.',                     icon: '◇', category: 'discipline' },
    { id: 'level_50',         title: 'SOGLIA 50',           desc: 'Raggiunto il livello di osservazione 50.',                                  icon: '▣', category: 'progression' },
    { id: 'total_100_tasks',  title: 'MACCHINA',            desc: 'Cento direttive completate. Il sistema registra ripetibilità.',             icon: '⊞', category: 'progression' },
    { id: 'total_500_tasks',  title: 'ALGORITMO',           desc: 'Cinquecento direttive completate. Autonomia comportamentale confermata.',   icon: '⊟', category: 'progression' },
    { id: 'prestige_1',       title: 'ASCENSIONE',          desc: 'Primo grado di Prestigio registrato nell\'archivio.',                       icon: '✧', category: 'progression' },

    // -------- Extension 01 // Behavioral achievements --------
    { id: 'streak_100',        title: 'SENTINELLA',           desc: 'Cento cicli consecutivi in conformità totale. Il sistema riclassifica il soggetto come ad alta prevedibilità.', icon: '⬥', rarity: 'epic',      xp: 1500, category: 'consistency' },
    { id: 'weekly_perfect_4',  title: 'OSSERVATORE COSTANTE', desc: 'Quattro audit settimanali consecutivi con indice di conformità ≥ 90%.',                                          icon: '⬢', rarity: 'rare',      xp: 500,  category: 'consistency' },
    { id: 'no_purgatory_30',   title: 'AUTOCONTROLLO',        desc: 'Trenta giudizi consecutivi senza mai attraversare lo stato di Purgatorio.',                                       icon: '◭', rarity: 'rare',      xp: 400,  category: 'discipline' },
    { id: 'explorer',          title: 'CENSORE ESAUSTIVO',    desc: 'Interrogate tutte le sezioni del terminale: STATS, TROFEI, REGISTRO, SAFE-01, EP.',                                icon: '⌘', rarity: 'common',    xp: 100,  category: 'system' },
    { id: 'recovery',          title: 'RIENTRO CONTROLLATO',  desc: 'Rientro nel sistema dopo ≥ 7 giorni di silenzio, con primo ciclo chiuso al 100%.',                                 icon: '↻', rarity: 'rare',      xp: 300,  category: 'progression' },
    { id: 'level_100',         title: 'SOGLIA MASSIMA',       desc: 'Raggiunto il livello di osservazione 100. Il sistema conclude il ciclo di misurazione.',                          icon: '⬣', rarity: 'legendary', xp: 3000, category: 'progression' },
    { id: 'ghost_protocol',    title: 'PROTOCOLLO INVISIBILE',desc: 'Tre Protocolli Straordinari consecutivi completati con successo. Nessuna deviazione rilevata.',                    icon: '⬙', rarity: 'legendary', xp: 1500, hidden: true, category: 'secret' },

    // -------- Extension 02 // Achievement System v2 --------
    { id: 'weekly_perfect_12', title: 'DISCIPLINA PROLUNGATA',desc: 'Dodici audit settimanali consecutivi con indice di conformità ≥ 90%.',                                             icon: '⬡', rarity: 'epic',      xp: 2000, category: 'consistency' },
    { id: 'zero_deviation_week',title:'DEVIAZIONE ZERO',      desc: 'Settimana ISO chiusa con corruzione grezza (Δ+) pari a zero. Nessuna deviazione registrata.',                     icon: '▷', rarity: 'rare',      xp: 600,  category: 'discipline' },
    { id: 'purgatory_survivor',title: 'REINSERIMENTO',        desc: 'Cinque uscite complessive dallo stato di Purgatorio. Pattern di ripresa confermato.',                             icon: '⟲', rarity: 'rare',      xp: 500,  category: 'progression' },
    { id: 'prestige_3',        title: 'ASCENSIONE III',       desc: 'Terzo grado di Prestigio registrato. Ciclo di misurazione ripetuto tre volte.',                                    icon: '✦', rarity: 'legendary', xp: 4000, category: 'progression' },
    { id: 'data_archivist',    title: 'ARCHIVISTA',           desc: 'Utilizzati entrambi i canali di trasferimento archivio: esportazione file e URL di sincronizzazione.',              icon: '⌸', rarity: 'common',    xp: 150,  category: 'system' },
    { id: 'midnight_audit',    title: 'PROTOCOLLO NOTTURNO',  desc: 'Un ciclo giornaliero chiuso entro 15 minuti dalla mezzanotte. Comportamento fuori norma diurna registrato.',        icon: '☾', rarity: 'legendary', xp: 2500, hidden: true, category: 'secret' }
];

/* Pool di doveri suggeriti — O.S.I.R.I.S. propone almeno 2 direttive al giorno.
   La selezione è deterministica in base alla data (stabile nell'arco della giornata)
   ma RUOTA ogni giorno, garantendo suggerimenti diversi ogni 24h. */
const TASK_SUGGESTIONS = [
    "BERE 2 LITRI D'ACQUA", "30 MINUTI DI LETTURA", "ALLENAMENTO FISICO 45 MIN", "NIENTE ZUCCHERI RAFFINATI",
    "MEDITAZIONE 10 MINUTI", "SCRIVI 3 OBIETTIVI DEL GIORNO", "NIENTE SOCIAL PRIMA DI MEZZOGIORNO", "DORMI ALMENO 8 ORE",
    "CAMMINA 8000 PASSI", "STUDIA 45 MINUTI", "DOCCIA FREDDA", "RIORDINA LO SPAZIO DI LAVORO",
    "STRETCHING MATTUTINO", "PIANIFICA IL DOMANI", "NESSUN CIBO SPAZZATURA", "SCRIVI UN DIARIO",
    "50 FLESSIONI", "IMPARA 10 PAROLE NUOVE", "CHIAMA UNA PERSONA CARA", "SPEGNI SCHERMI 1H PRIMA DI DORMIRE",
    "COLAZIONE PROTEICA", "RIVEDI LE FINANZE", "20 MINUTI DI SOLE", "NIENTE CAFFEINA DOPO LE 14",
    "ORDINA UNA STANZA", "LAVORO PROFONDO 90 MIN SENZA DISTRAZIONI", "RESPIRAZIONE 4-7-8", "PREPARA I VESTITI PER DOMANI",
    "SCRIVI 3 GRATITUDINI", "NIENTE LAMENTELE PER UN GIORNO", "100 SQUAT", "BEVI UN TÈ VERDE",
    "LEGGI 10 PAGINE DI SAGGISTICA", "DISATTIVA LE NOTIFICHE INUTILI", "CORSA 20 MINUTI", "MANGIA VERDURA A OGNI PASTO",
    "RIVEDI I TUOI OBIETTIVI MENSILI", "PULISCI LA CASELLA EMAIL", "10 MINUTI DI SILENZIO TOTALE", "STUDIA UN CAPITOLO",
    "ALLENA LA POSTURA", "NIENTE ALCOL OGGI", "SCRIVI PER 15 MINUTI", "AGGIORNA LA LISTA DELLE SPESE",
    "FAI IL LETTO APPENA SVEGLIO", "EVITA IL MULTITASKING", "RIPASSA GLI APPUNTI", "BEVI ACQUA APPENA SVEGLIO",
    "CAMMINATA SERALE", "PROGRAMMA UNA PAUSA VERA", "NIENTE TELEFONO A TAVOLA", "DEDICA 20 MIN A UN HOBBY",
    "PLANK 3 MINUTI TOTALI", "RIDUCI IL TEMPO SCHERMO DEL 20%", "SCRIVI UNA COSA DA MIGLIORARE", "ORGANIZZA I FILE DEL PC",
    "MANGIA LENTAMENTE E CONSAPEVOLE", "FAI QUALCOSA CHE RIMANDI DA GIORNI", "LEGGI PRIMA DI DORMIRE", "IDRATAZIONE COSTANTE"
];

// ============================================================================
// Behavioral Monitoring model (Weekly System refactor)
// ============================================================================

// ANOMALIES — one is auto-selected every Monday (deterministic by ISO week).
// The catalog is open-ended: append new entries here without touching any logic.
// Each anomaly is a *diagnosis*, not a character or enemy.
const ANOMALIES = [
    { id: 'inertia',        code: 'AN-01', name: 'INERZIA',        desc: 'Rilevata resistenza sistematica all\'avvio delle direttive.' },
    { id: 'complacency',    code: 'AN-02', name: 'COMPIACIMENTO',  desc: 'Rilevata riduzione dello sforzo dopo esiti favorevoli.' },
    { id: 'burnout',        code: 'AN-03', name: 'ESAURIMENTO',    desc: 'Rilevato calo prolungato di rendimento senza recupero.' },
    { id: 'dispersion',     code: 'AN-04', name: 'DISPERSIONE',    desc: 'Rilevata frammentazione dell\'attenzione tra direttive concorrenti.' },
    { id: 'overconfidence', code: 'AN-05', name: 'IPERSTIMA',      desc: 'Rilevata sopravvalutazione delle proprie capacità operative.' },
    { id: 'avoidance',      code: 'AN-06', name: 'ELUSIONE',       desc: 'Rilevato rinvio ripetuto di direttive critiche.' },
    { id: 'perfectionism',  code: 'AN-07', name: 'PERFEZIONISMO',  desc: 'Rilevata paralisi operativa da soglia qualitativa irrealistica.' }
];

// CONTAINMENT PROTOCOLS — deterministic, threshold-triggered, purely diagnostic
// (visual + notifications). No forced gameplay changes (user choice 2c).
// The order matters: last matching threshold wins.
const CONTAINMENT_THRESHOLDS = [
    { pct: 20, code: 'CP-01', name: 'AVVISO DIAGNOSTICO',        css: 'ct-1', notice: 'CP-01 ATTIVO. Corruzione oltre soglia 20%. Sistema in osservazione.' },
    { pct: 40, code: 'CP-02', name: 'MONITORAGGIO ESTESO',       css: 'ct-2', notice: 'CP-02 ATTIVO. Corruzione oltre soglia 40%. Sensibilità diagnostica aumentata.' },
    { pct: 60, code: 'CP-03', name: 'OFFUSCAMENTO SECONDARIO',   css: 'ct-3', notice: 'CP-03 ATTIVO. Corruzione oltre soglia 60%. Statistiche secondarie oscurate.' },
    { pct: 80, code: 'CP-04', name: 'INSTABILITÀ INTERFACCIA',   css: 'ct-4', notice: 'CP-04 ATTIVO. Corruzione oltre soglia 80%. Interfaccia in degrado controllato.' },
    { pct: 95, code: 'CP-05', name: 'CONTENIMENTO CRITICO',      css: 'ct-5', notice: 'CP-05 ATTIVO. Corruzione oltre soglia 95%. Efficienza XP ridotta.' }
];

// XP efficiency multiplier — only reduced by CP-05 (soglia 95%). Everything else is visual.
const CONTAINMENT_XP_MULT = { 'CP-05': 0.85 };

// EXTRAORDINARY PROTOCOL — one per ISO week, user-defined behavioral challenge.
// Success reduces raw corruption points; failure adds a small penalty.
const EXT_PROTOCOL = {
    SUCCESS_CONTAINMENT: 40,   // subtracted from corruption raw (Δ) on success
    FAILURE_DEVIATION:    15    // added to corruption raw on failure
};

export {
    CONFIG, GRADES, LEVEL_NAMES, ACHIEVEMENTS, TASK_SUGGESTIONS,
    ANOMALIES, CONTAINMENT_THRESHOLDS, CONTAINMENT_XP_MULT, EXT_PROTOCOL
};
