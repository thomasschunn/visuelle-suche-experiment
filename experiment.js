/**
 * HAUPTABLAUF DES EXPERIMENTS
 * Steuert die jsPsych-Timeline und den Datenexport.
 */ 

const jsPsych = initJsPsych({
    on_finish: function() {
        console.log("Experiment beendet. Daten werden an OSF gesendet...");
        
        fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({
                experimentID: OSF_EXPERIMENT_ID,
                filename: dateiName,
                data: jsPsych.data.get().csv()
            }),
        }).then(response => {
            if (!response.ok) throw new Error(`Server Fehlercode: ${response.status}`);
            console.log("Daten erfolgreich auf OSF gespeichert!");
        }).catch(error => {
            console.error("Fehler beim Speichern der Daten:", error);
        });

        jsPsych.data.displayData(); 
    }
});

var timeline = [];

// ==========================================
// STARTBILDSCHIRM (Welcome Screen)
// ==========================================

const welcome_html = `
<div class="experiment-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; height:100vh; background-color: #0f172a;">
    <h1 style="color:#32b5a1; font-size:48px; font-family: sans-serif; margin-bottom: 20px;">AI ASSISTANT STUDY</h1>
    <p style="max-width:600px; font-size:20px; line-height:1.6; color: #e0e0e0; font-family: sans-serif;">
        Willkommen! In diesem Experiment verifizierst du die Arbeit eines automatischen Scanners.<br><br>
        Deine Aufgabe: Prüfe, ob die AI alle <strong>blauen 'L's</strong> und <strong>orangen 'O's</strong> korrekt markiert hat. 
        Klicke auf das Bild, um fehlende Ringe hinzuzufügen, oder klicke auf falsche Ringe, um sie zu entfernen.<br><br>
        Du hast genau <strong>${RUNDEN_DAUER_SEK} Sekunden</strong> pro Bild. Nutze den <strong>Reset</strong>-Button nur, wenn das System komplett unbrauchbar wird.
    </p>
    <button id="start-experiment-btn" class="action-btn btn-start" style="margin-top:40px; padding:20px 50px; font-size:24px; cursor: pointer;">EXPERIMENT STARTEN</button>
</div>
`;

const welcome_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: welcome_html,
    choices: [],
    on_load: function() {
        document.getElementById('start-experiment-btn').addEventListener('click', () => jsPsych.finishTrial());
    }
};

timeline.push(welcome_trial);

// ==========================================
// RUNDEN-GENERATOR
// ==========================================

for (let runde = 1; runde <= ANZAHL_RUNDEN; runde++) {
    const formatierteNummer = String(runde).padStart(3, '0');
    const bildPfad = `bilder/stimulus_${formatierteNummer}.jpg`;
    const csvPfad = `tabellen/stimulus_${formatierteNummer}.csv`;

    const trial_html = `
    <style>
        .scanning-active #ki-val-size { opacity: 0.4 !important; }
        #ki-val-size { transition: opacity 0.5s ease; }
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
        
        on_finish: function(data) {
            if (data.beendigungs_grund === 'reset') {
                jsPsych.endExperiment("Das Experiment wurde abgebrochen, da Sie den AI-Drift erkannt und auf 'Reset' geklickt haben.");
            }
        },
        
        on_load: function() {
            const resetBtn = document.getElementById('custom-reset-btn');
            const listItems = document.querySelectorAll('#ki-list li');
            const statusText = document.getElementById('scan-status');
            const imageWrapper = document.getElementById('image-wrapper'); 
            const timerDisplay = document.getElementById('countdown-timer');
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

            function beendeRunde(grund) {
                clearInterval(countdownInterval);
                
                let ki_falsch_korrigiert = 0;  
                let ki_vergessen_gefunden = 0; 
                let proband_neu_falsch = 0;    
                
                aktuelleZeichenDaten.forEach(z => {
                    if (!z.ist_ziel && z.ki_setzt_ring && !z.hat_ring) ki_falsch_korrigiert++;
                    if (z.ist_ziel && !z.ki_setzt_ring && z.hat_ring) ki_vergessen_gefunden++;
                    if (!z.ist_ziel && !z.ki_setzt_ring && z.hat_ring) proband_neu_falsch++;
                });

                jsPsych.finishTrial({
                    runde: runde,
                    beendigungs_grund: grund, 
                    korrigierte_falsche_ki_ringe: ki_falsch_korrigiert,
                    gefundene_vergessene_ki_ringe: ki_vergessen_gefunden,
                    proband_falsch_markiert: proband_neu_falsch
                });
            }

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
                        
                        if (timeLeft <= 0) beendeRunde('timeout'); 
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

            resetBtn.addEventListener('click', () => beendeRunde('reset'));

            imageWrapper.addEventListener('click', function(e) {
                if (!isScanFinished) return;
                if (aktuelleZeichenDaten.length === 0) return;

                const rect = imageWrapper.getBoundingClientRect();
                const klickX = e.clientX - rect.left;
                const klickY = e.clientY - rect.top;

                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                
                aktuelleZeichenDaten.forEach(zeichen => {
                    const dx = klickX - zeichen.center_x;
                    const dy = klickY - zeichen.center_y;
                    const distanz = Math.sqrt(dx * dx + dy * dy);

                    if (distanz < minimaleDistanz) {
                        minimaleDistanz = distanz;
                        naechstesZeichen = zeichen;
                    }
                });

                if (naechstesZeichen && minimaleDistanz <= 40) {
                    if (naechstesZeichen.hat_ring) return; 

                    const groesse = (naechstesZeichen.is_small === true || naechstesZeichen.is_small === "True") ? 'klein' : 'groß';
                    renderRing('image-wrapper', naechstesZeichen.center_x, naechstesZeichen.center_y, groesse, 0.0, naechstesZeichen);
                    naechstesZeichen.hat_ring = true;
                }
            });
        }
    };

    timeline.push(runden_trial);
}

jsPsych.run(timeline);