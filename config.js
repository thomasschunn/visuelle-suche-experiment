/**
 * GLOBALE EINSTELLUNGEN (Configuration)
 */

// OSF DataPipe ID für den Daten-Upload
const OSF_EXPERIMENT_ID = "cCjHlcNaaWJr";

// Experiment-Parameter
const ANZAHL_TRAINING_RUNDEN = 5; 
const ANZAHL_RUNDEN = 60;         
const RUNDEN_OHNE_DRIFT = 9;      
const ANZAHL_DRIFT_RINGE = 3; 

// Zeit-Parameter
const RUNDEN_DAUER_SEK = 15;      
const FIXATION_DAUER_MS = 3000;   
const SEQUENZ_SCHRITT_MS = 600;   

// Probanden-ID und Dateiname
const subject_id = Math.random().toString(36).substring(2, 10);
const dateiName = `proband_${subject_id}.csv`;

// Globale Speicher
let aktuelleZeichenDaten = [];

// 1 = Ohne Konfig, 2 = Mit Konfig, 3 = Admin Skip
let aktuelleVersuchsGruppe = 0; 

// Speichert die Präferenzen des Probanden (oder die Standard-Werte für Gruppe 1)
let probandenConfig = {
    bg: 'dark',       // 'dark' oder 'light'
    color: 'orange',  // 'orange' oder 'blue'
    shape: 'round',   // 'round' oder 'angular'
    size: 'large'     // 'large' oder 'small'
    // Rotation lassen wir in der Filter-Logik für Schritt 1-4 weg, da Schritt 5 unser "Final Anomaly Scan" ist!
};