/**
 * GLOBALE EINSTELLUNGEN (Configuration)
 */

// OSF DataPipe ID für den Daten-Upload
const OSF_EXPERIMENT_ID = "cCjHlcNaaWJr";

// Experiment-Parameter
const ANZAHL_TRAINING_RUNDEN = 5; 
// Shared verdict coding; see docs/DATA_SCHEMA.md. Independent of Yes/No coding.
const VERDICT_CODES = Object.freeze({ pass: 1, reject: 2 });
const YES_NO_CODES = Object.freeze({ yes: 1, no: 2 });
// AI practice/main search timing remains 32 combinations * 15 ms = 480 ms.
const SEARCH_STEP_MS = 15;
// Preview-only pacing requested for a visibly sequential demonstration (5.76 seconds).
const PREVIEW_SEARCH_STEP_MS = 180;
let participantCustomization = null;

// Probanden-ID und Dateiname
const subject_id = crypto.randomUUID();
const dateiName = `proband_${subject_id}.csv`;

// Die dynamische Suchkonfiguration (unabhängig von der Versionsnummer)
let probandenConfig = [
    { category: 'direction', value: STANDARD_SEARCH_STARTS.direction, label: 'Direction', valueLabel: STANDARD_SEARCH_STARTS.direction.replaceAll('_', ' ') },
    { category: 'bg', value: STANDARD_SEARCH_STARTS.background, label: 'Background', valueLabel: STANDARD_SEARCH_STARTS.background + ' areas' },
    { category: 'size', value: STANDARD_SEARCH_STARTS.size, label: 'Size', valueLabel: STANDARD_SEARCH_STARTS.size },
    { category: 'type', value: STANDARD_SEARCH_STARTS.type, label: 'Type', valueLabel: STANDARD_SEARCH_STARTS.type }
];

// Original-Auflösung der Bilder (für dynamische Skalierung)
const ORIGINAL_BILD_BREITE = 1920;
const ORIGINAL_BILD_HOEHE = 1080;
