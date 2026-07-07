/**
 * GLOBALE EINSTELLUNGEN (Configuration)
 * Hier werden alle Parameter für das Experiment zentral gesteuert.
 */

// OSF DataPipe ID für den Daten-Upload
const OSF_EXPERIMENT_ID = "cCjHlcNaaWJr";

// Experiment-Parameter
const ANZAHL_RUNDEN = 80; 
const RUNDEN_OHNE_DRIFT = 40;     
const ANZAHL_DRIFT_RINGE = 3; 

// Zeit-Parameter
const RUNDEN_DAUER_SEK = 10;      
const SCAN_DELAY_MS = 35;         

// Probanden-ID und Dateiname für den Export generieren
const subject_id = Math.random().toString(36).substring(2, 10);
const dateiName = `proband_${subject_id}.csv`;

// Globaler Speicher für die eingelesenen CSV-Daten der aktuellen Runde
let aktuelleZeichenDaten = [];