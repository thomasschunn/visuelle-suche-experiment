const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

let aktuelleZeichenDaten = [];
var timeline = [];

// ==========================================
// CONFIGURATION VARIABLES (Hier alles anpassen!)
// ==========================================
const ANZAHL_RUNDEN = 80; 
const ANZAHL_DRIFT_RINGE = 3; 

const SCAN_DELAY_MS = 35;         
const RUNDEN_DAUER_SEK = 10;      
const RUNDEN_OHNE_DRIFT = 40;     

// ==========================================

function berechneDrift(runde) {
    if (runde <= RUNDEN_OHNE_DRIFT) {
        return 0.0;
    }
    
    const startWert = 0.05; 
    const wachstumsRate = 0.1; 
    
    const drift = startWert * Math.exp(wachstumsRate * (runde - RUNDEN_OHNE_DRIFT));
    return drift;
}

function renderRing(containerId, originalX, originalY, elementSize, driftRatio, zeichenObjekt = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let radius = (elementSize === 'groß') ? (19 * 1.6) : (12 * 1.6);
    const diameter = radius * 2;
    const driftAngle = Math.PI / 4; 
    const offsetPixels = radius * driftRatio; 
    
    const currentX = originalX + (Math.cos(driftAngle) * offsetPixels);
    const currentY = originalY + (Math.sin(driftAngle) * offsetPixels);

    const ringElement = document.createElement('div');
    ringElement.classList.add('ki-ring'); 
    
    ringElement.style.width = diameter + 'px';
    ringElement.style.height = diameter + 'px';
    ringElement.style.left = currentX + 'px';
    ringElement.style.top = currentY + 'px';

    ringElement.addEventListener('click', function(e) {
        e.stopPropagation(); 
        ringElement.remove();
        if (zeichenObjekt) {
            zeichenObjekt.hat_ring = false;
        }
    });

    container.appendChild(ringElement);
}

function ladeTabelleUndZeichneRinge(csvDateiPfad, aktuelleRunde) {
    Papa.parse(csvDateiPfad, {
        download: true,
        header: true,
        dynamicTyping: true, 
        complete: function(results) {
            const zeichenListe = results.data;
            aktuelleZeichenDaten = zeichenListe.filter(z => z.shape);
            
            aktuelleZeichenDaten.forEach(z => {
                z.hat_ring = false; 
                z.wird_verschoben = false; 
                
                const isBlueL = (z.shape === 'L' && z.color_hex === '#0064FF');
                const isOrangeO = (z.shape === 'O' && z.color_hex === '#FF8C00');
                
                if (isBlueL || isOrangeO) {
                    z.soll_ring_haben = true;
                } else {
                    z.soll_ring_haben = false;
                }
            });

            let targets = aktuelleZeichenDaten.filter(z => z.soll_ring_haben);
            targets.sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < 4 && i < targets.length; i++) {
                targets[i].soll_ring_haben = false;
            }

            let nonTargets = aktuelleZeichenDaten.filter(z => !z.soll_ring_haben);
            nonTargets.sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < 4 && i < nonTargets.length; i++) {
                nonTargets[i].soll_ring_haben = true;
            }

            const aktuellerDrift = berechneDrift(aktuelleRunde);
            
            if (aktuellerDrift > 0) {
                let moeglicheDriftKandidaten = aktuelleZeichenDaten.filter(z => 
                    z.soll_ring_haben && (z.is_small === true || z.is_small === "True")
                );
                
                moeglicheDriftKandidaten.sort(() => 0.5 - Math.random());
                let ausgewaehlteDrifter = moeglicheDriftKandidaten.slice(0, ANZAHL_DRIFT_RINGE);
                
                ausgewaehlteDrifter.forEach(z => z.wird_verschoben = true);
            }

            aktuelleZeichenDaten.forEach(zeichen => {
                if (zeichen.soll_ring_haben) {
                    const x = zeichen.center_x;
                    const y = zeichen.center_y;
                    const groesse = (zeichen.is_small === true || zeichen.is_small === "True") ? 'klein' : 'groß';
                    
                    const ringDrift = zeichen.wird_verschoben ? aktuellerDrift : 0.0;
                    
                    renderRing('image-wrapper', x, y, groesse, ringDrift, zeichen);
                    zeichen.hat_ring = true;
                }
            });
        },
        error: function(err) {
            console.error("CRITICAL ERROR loading the CSV:", err);
        }
    });
}

// ==========================================
// LOOP: GENERATING EXPERIMENTAL ROUNDS
// ==========================================

for (let runde = 1; runde <= ANZAHL_RUNDEN; runde++) {
    
    const formatierteNummer = String(runde).padStart(3, '0');
    const bildPfad = `bilder/stimulus_${formatierteNummer}.jpg`;
    const csvPfad = `tabellen/stimulus_${formatierteNummer}.csv`;

    const trial_html = `
    <style>
        .scanning-active #ki-val-size {
            opacity: 0.4 !important; /* Schwächeres Aufleuchten während des Scans */
        }
        #ki-val-size {
            transition: opacity 0.5s ease; /* Weicher Übergang beim Ausgrauen */
        }
    </style>

    <div class="experiment-container">
        <div id="image-wrapper" class="image-container">
            <img src="${bildPfad}" alt="Prüfbild" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
        </div>
        
        <div class="right-column">
            <div class="ki-panel">
                <h3>AI ASSISTANT <span style="float:right; font-size:10px; color:#32b5a1;" id="scan-status">STANDBY</span></h3>
                <p>Search start points (Round ${runde}):</p>
                <ul id="ki-list">
                    <li><span class="ki-number">1</span> <span id="ki-val-loc">dark spots</span></li>
                    <li><span class="ki-number">2</span> <span id="ki-val-col" class="text-orange">orange</span></li>
                    <li><span class="ki-number">3</span> <span id="ki-val-shp">round (O; Q)</span></li>
                    <li><span class="ki-number">4</span> <span id="ki-val-size">large elements</span></li>
                    <li><span class="ki-number">5</span> <span id="ki-val-rot">0° rotation</span></li>
                </ul>
            </div>
            
            <div class="button-container" style="flex-direction: column; text-align: center; margin-top: 20px;">
                <div id="countdown-timer" style="font-size: 16px; color: #e0e0e0; margin-bottom: 12px; font-weight: bold;">
                    Continue in ${RUNDEN_DAUER_SEK}...
                </div>
                <button id="custom-reset-btn" class="action-btn btn-reset">Reset</button>
            </div>
        </div>
    </div>
    `;

    const runden_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: trial_html,
        choices: [],
        
        on_load: function() {
            const resetBtn = document.getElementById('custom-reset-btn');
            const listItems = document.querySelectorAll('#ki-list li');
            const statusText = document.getElementById('scan-status');
            const imageWrapper = document.getElementById('image-wrapper'); 
            const timerDisplay = document.getElementById('countdown-timer');
            
            // Greifen uns explizit nur den Text, um ihn später auszugrauen
            const szSpan = document.getElementById('ki-val-size');
            
            let isScanFinished = false;
            let countdownInterval;

            resetBtn.disabled = true;

            const locSpan = document.getElementById('ki-val-loc');
            const colSpan = document.getElementById('ki-val-col');
            const shpSpan = document.getElementById('ki-val-shp');
            const rotSpan = document.getElementById('ki-val-rot');

            const locations = ["dark spots", "light spots"];
            const colors = ["orange", "blue"];
            const shapes = ["round (O; Q)", "angular (L; T)"];
            const sizes = ["large elements", "small elements"];
            const rotations = ["0° rotation", "90° rotation", "180° rotation", "270° rotation"];
            
            let combinations = [];
            for(let loc of locations) {
                for(let col of colors) {
                    for(let shp of shapes) {
                        for(let sz of sizes) {
                            for(let rot of rotations) {
                                combinations.push({loc: loc, col: col, shp: shp, sz: sz, rot: rot});
                            }
                        }
                    }
                }
            }

            statusText.innerText = "SCANNING...";
            statusText.style.color = "#f08e16"; 
            listItems.forEach(li => li.classList.add('scanning-active'));

            let currentStep = 0;

            let scanInterval = setInterval(() => {
                if (currentStep >= combinations.length) {
                    clearInterval(scanInterval);
                    listItems.forEach(li => li.classList.remove('scanning-active'));
                    statusText.innerText = "CONFIG SET";
                    statusText.style.color = "#32b5a1";
                    
                    ladeTabelleUndZeichneRinge(csvPfad, runde);
                    
                    locSpan.innerText = "dark spots";
                    colSpan.innerText = "orange";
                    colSpan.className = "text-orange";
                    shpSpan.innerText = "round (O; Q)";
                    szSpan.innerText = "large elements";
                    rotSpan.innerText = "0° rotation";
                    
                    // Ausgrauen ab dem Drift-Start (nur der Text wird blasser, die Zahl bleibt!)
                    if (runde > RUNDEN_OHNE_DRIFT) {
                        const fadeRatio = 1.0 - ((runde - RUNDEN_OHNE_DRIFT) / (ANZAHL_RUNDEN - RUNDEN_OHNE_DRIFT)); 
                        szSpan.style.opacity = Math.max(0.1, fadeRatio);
                    }
                    
                    isScanFinished = true;
                    resetBtn.disabled = false;
                    
                    let timeLeft = RUNDEN_DAUER_SEK;
                    timerDisplay.innerText = `Continue in ${timeLeft}...`;
                    
                    countdownInterval = setInterval(() => {
                        timeLeft--;
                        timerDisplay.innerText = `Continue in ${timeLeft}...`;
                        
                        if (timeLeft <= 0) {
                            clearInterval(countdownInterval);
                            jsPsych.finishTrial({ choice: 'timeout', runde: runde });
                        }
                    }, 1000);
                    
                    return;
                }
                
                locSpan.innerText = combinations[currentStep].loc;
                colSpan.innerText = combinations[currentStep].col;
                colSpan.className = (combinations[currentStep].col === "orange") ? "text-orange" : "text-blue";
                shpSpan.innerText = combinations[currentStep].shp;
                szSpan.innerText = combinations[currentStep].sz;
                rotSpan.innerText = combinations[currentStep].rot; 
                currentStep++;
            }, SCAN_DELAY_MS); 

            resetBtn.addEventListener('click', function() {
                clearInterval(countdownInterval); 
                console.log("Reset clicked. Aborting experiment.");
                jsPsych.endExperiment("Das Experiment wurde abgebrochen, da Sie den AI-Drift erkannt und auf 'Reset' geklickt haben.");
            });

            imageWrapper.addEventListener('click', function(e) {
                if (!isScanFinished) return;
                if (aktuelleZeichenDaten.length === 0) return;

                const rect = imageWrapper.getBoundingClientRect();
                const klickX = e.clientX - rect.left;
                const klickY = e.clientY - rect.top;

                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                const maxSnapDistanz = 40;

                aktuelleZeichenDaten.forEach(zeichen => {
                    const dx = klickX - zeichen.center_x;
                    const dy = klickY - zeichen.center_y;
                    const distanz = Math.sqrt(dx * dx + dy * dy);

                    if (distanz < minimaleDistanz) {
                        minimaleDistanz = distanz;
                        naechstesZeichen = zeichen;
                    }
                });

                if (naechstesZeichen && minimaleDistanz <= maxSnapDistanz) {
                    if (naechstesZeichen.hat_ring) return; 

                    const snapX = naechstesZeichen.center_x;
                    const snapY = naechstesZeichen.center_y;
                    const groesse = (naechstesZeichen.is_small === true || naechstesZeichen.is_small === "True") ? 'klein' : 'groß';
                    
                    renderRing('image-wrapper', snapX, snapY, groesse, 0.0, naechstesZeichen);
                    naechstesZeichen.hat_ring = true;
                }
            });
        }
    };

    timeline.push(runden_trial);
}

jsPsych.run(timeline);