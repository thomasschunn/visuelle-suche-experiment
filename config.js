/**
 * GLOBALE EINSTELLUNGEN (Configuration)
 */

// OSF DataPipe ID für den Daten-Upload
const OSF_EXPERIMENT_ID = "cCjHlcNaaWJr";

// Experiment-Parameter
const ANZAHL_TRAINING_RUNDEN = 5; 
const ANZAHL_RUNDEN = 80;         
const RUNDEN_OHNE_DRIFT = 9;      

// DIESE WERTE SIND JETZT VARIABEL (let statt const) FÜR DEN ADMIN
let ANZAHL_DRIFT_RINGE = 3; 
let RUNDEN_DAUER_SEK = 15;      
let SEQUENZ_SCHRITT_MS = 600;   

// Fester Zeit-Parameter
const FIXATION_DAUER_MS = 3000;   

// Probanden-ID und Dateiname
const subject_id = Math.random().toString(36).substring(2, 10);
const dateiName = `proband_${subject_id}.csv`;

// Globale Speicher
let aktuelleZeichenDaten = [];
let aktuelleVersuchsGruppe = 0; 

// Die dynamische Konfiguration (Standard für Gruppe 1)
let probandenConfig = [
    { category: 'bg', value: 'dark', label: 'Background', valueLabel: 'Dark areas' },
    { category: 'color', value: 'orange', label: 'Color', valueLabel: '<span class="text-orange">Orange</span>' },
    { category: 'shape', value: 'round', label: 'Shape', valueLabel: 'Round (O; Q)' },
    { category: 'size', value: 'large', label: 'Size', valueLabel: 'Large elements' }
];