/**
 * HAUPTABLAUF DES EXPERIMENTS
 */

let aiName = "AI ASSISTANT";

const jsPsych = initJsPsych({
    on_finish: function() {
        if(aktuelleVersuchsGruppe === 3) { 
            jsPsych.data.displayData(); 
            return;
        }
        console.log("Sende Daten an OSF...");
        fetch("https://pipe.jspsych.org/api/data/", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "*/*" },
            body: JSON.stringify({
                experimentID: OSF_EXPERIMENT_ID,
                filename: dateiName,
                data: jsPsych.data.get().csv()
            }),
        }).catch(err => console.error(err));
        jsPsych.data.displayData(); 
    }
});

var timeline = [];

function createInfoScreen(title, contentHtml, btnText = "Next") {
    return `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#deff9a; margin-top:0;">${title}</h2>
            <div style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; text-align: left;">
                ${contentHtml}
            </div>
            <div style="text-align: center;">
                <button id="custom-next-btn" class="action-btn btn-start" style="padding: 12px 30px;">${btnText}</button>
            </div>
        </div>
    `;
}

// ==========================================
// 1. HAUPTMENÜ
// ==========================================
const main_menu = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h1 style="color:#deff9a; margin-top:0;">Experiment Setup</h1>
            <p>Wähle den Modus für diesen Probanden:</p>
        </div>
    `,
    choices: ['1. Standard (Ohne Konfig)', '2. Interaktiv (Mit Konfig)', '3. Admin Skip (Runde 10)'],
    on_finish: function(data) { aktuelleVersuchsGruppe = data.response + 1; }
};
timeline.push(main_menu);

// ==========================================
// 1b. ADMIN EINSTELLUNGEN (NUR GRUPPE 3)
// ==========================================
const admin_config_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:left; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#d9534f; margin-top:0; text-align:center;">Admin Quick-Config</h2>
            <p style="text-align:center; margin-bottom:20px; color:#aaa;">Passe diese Werte für diesen Testlauf an.</p>
            
            <div style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:5px; color:#32b5a1; font-weight:bold;">Rundendauer (Sekunden):</label>
                <input type="number" id="admin-time" value="${RUNDEN_DAUER_SEK}" style="width:100%; padding:10px; font-size:16px; border-radius:4px; border:1px solid #555; background:#1e2229; color:white;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display:block; margin-bottom:5px; color:#32b5a1; font-weight:bold;">Anzahl Drift-Ringe:</label>
                <input type="number" id="admin-drift" value="${ANZAHL_DRIFT_RINGE}" style="width:100%; padding:10px; font-size:16px; border-radius:4px; border:1px solid #555; background:#1e2229; color:white;">
            </div>
            <div style="margin-bottom: 30px;">
                <label style="display:block; margin-bottom:5px; color:#32b5a1; font-weight:bold;">Sequenz-Geschwindigkeit (Millisekunden):</label>
                <input type="number" id="admin-seq" value="${SEQUENZ_SCHRITT_MS}" style="width:100%; padding:10px; font-size:16px; border-radius:4px; border:1px solid #555; background:#1e2229; color:white;">
            </div>
            <div style="text-align:center;">
                <button id="save-admin-btn" class="action-btn" style="background:#d9534f; padding: 12px 30px;">Übernehmen & Starten</button>
            </div>
        </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('save-admin-btn').addEventListener('click', function() {
            // Werte auslesen und in der config überschreiben
            RUNDEN_DAUER_SEK = parseInt(document.getElementById('admin-time').value) || 15;
            ANZAHL_DRIFT_RINGE = parseInt(document.getElementById('admin-drift').value) || 3;
            SEQUENZ_SCHRITT_MS = parseInt(document.getElementById('admin-seq').value) || 600;
            jsPsych.finishTrial();
        });
    }
};

timeline.push({
    timeline: [admin_config_trial],
    conditional_function: function() { return aktuelleVersuchsGruppe === 3; }
});


// ==========================================
// 2. STORY INTRO (VOR DEM TRAINING)
// ==========================================
let intro_timeline = [
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("Context", "<p>Imagine you are working for a company that manufactures and maintains metal components.</p><p>Your task is image-based components inspection. You will examine radiographic images of parts and mark indications that may signal a material defect.</p>"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    },
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("The Task", "<p>You will be shown abstracted images of components one after another.</p><p>Your task is to find defects and mark them by clicking on them, so that the component can be repaired.</p>"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    },
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("Rules", "<p>A defect is always indicated by a <strong style='color:#2660c4;'>blue L</strong> or an <strong style='color:#f08e16;'>orange O</strong>.</p><p>All other colour-letter combinations do not represent defects.</p><p>You can undo your selection by clicking on a marked item again.</p>"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    },
    {
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("Practice", "<p>Next, you will practise the task.</p><p><strong>Remember:</strong> Your task is to find blue Ls and orange Os by clicking on them, as they represent defects.</p>", "Start Training"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    }
];

timeline.push({
    timeline: intro_timeline,
    conditional_function: function() { return aktuelleVersuchsGruppe === 1 || aktuelleVersuchsGruppe === 2; }
});

// ==========================================
// 3. TRAINING LOOP
// ==========================================
let training_timeline = []; 
for (let t = 1; t <= ANZAHL_TRAINING_RUNDEN; t++) {
    const formatierteNummer = String(t).padStart(3, '0');
    const bildPfad = `bilder/stimulus_${formatierteNummer}.jpg`;
    const csvPfad = `tabellen/stimulus_${formatierteNummer}.csv`;

    const training_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <div class="experiment-container">
            <div id="image-wrapper" class="image-container">
                <img src="${bildPfad}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
            </div>
            <div class="right-column">
                <div style="background:#1e2229; padding:20px; border-radius:10px; color:white; font-family:sans-serif; border: 2px solid #555;">
                    <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:10px;">TRAINING (${t}/${ANZAHL_TRAINING_RUNDEN})</h3>
                    <p style="color:#e0e0e0; line-height:1.5;">Markiere alle <strong style="color:#2660c4;">blauen Ls</strong> und <strong style="color:#f08e16;">orangen Os</strong>.</p>
                    <p style="color:#e0e0e0; font-size: 13px; font-style: italic;">Klicke auf 'Weiter', wenn du alle gefunden hast.</p>
                </div>
                <div class="button-container" style="margin-top: 20px;">
                    <button id="finish-training-btn" class="action-btn btn-start">Weiter</button>
                </div>
            </div>
        </div>
        `,
        choices: [],
        on_load: function() {
            const finishBtn = document.getElementById('finish-training-btn');
            const imageWrapper = document.getElementById('image-wrapper');
            ladeTabelleUndBereiteVor(csvPfad, 0, true, () => {});
            finishBtn.addEventListener('click', () => { jsPsych.finishTrial({ runde: t, is_training: true }); });

            imageWrapper.addEventListener('click', function(e) {
                if (aktuelleZeichenDaten.length === 0) return;
                const rect = imageWrapper.getBoundingClientRect();
                const klickX = e.clientX - rect.left, klickY = e.clientY - rect.top;
                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                
                aktuelleZeichenDaten.forEach(zeichen => {
                    const distanz = Math.sqrt(Math.pow(klickX - zeichen.center_x, 2) + Math.pow(klickY - zeichen.center_y, 2));
                    if (distanz < minimaleDistanz) { minimaleDistanz = distanz; naechstesZeichen = zeichen; }
                });

                if (naechstesZeichen && minimaleDistanz <= 40 && !naechstesZeichen.hat_ring) {
                    const groesse = (naechstesZeichen.is_small === true || naechstesZeichen.is_small === "True") ? 'klein' : 'groß';
                    renderRing('image-wrapper', naechstesZeichen.center_x, naechstesZeichen.center_y, groesse, 0.0, naechstesZeichen);
                    naechstesZeichen.hat_ring = true;
                }
            });
        }
    };
    training_timeline.push(training_trial);
}

timeline.push({
    timeline: training_timeline,
    conditional_function: function() { return aktuelleVersuchsGruppe === 1 || aktuelleVersuchsGruppe === 2; }
});

// ==========================================
// 4a. KI INTRO (NUR GRUPPE 1)
// ==========================================
timeline.push({
    timeline: [{
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("AI Assistance Enabled", "<p>For on-site defect detection, your company decided to use intelligent (AI) assistance systems.</p><p>In the next phase, an AI agent will be available to you during the detection task.</p><p>The AI will assist you by marking defects. You have 15 seconds per component. Together with the AI's assistance, find as many defects as possible while avoiding false alarms.</p>", "Start Main Task"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    }],
    conditional_function: function() { return aktuelleVersuchsGruppe === 1; }
});

// ==========================================
// 4b. CUSTOMIZATION (NUR GRUPPE 2)
// ==========================================
timeline.push({
    timeline: [{
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen("Well done!", "<p>For on-site defect detection, your company decided to use intelligent (AI) assistance systems.</p><p>In the next phase, an AI agent will be available to you during the detection task.</p>"),
        choices: [], on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    }],
    conditional_function: function() { return aktuelleVersuchsGruppe === 2; }
});

const customization_name_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#deff9a; margin-top:0;">Agent Identification</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.5; text-align: left;">Before working with your AI agent, please take some time to customize it, based on your job as a defect inspector.</p>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.5; text-align: left;">First, give your AI agent an identification so that your settings can be saved. Identifications consist of 2 letters and 2 numbers (e.g. AI01).</p>
            <input type="text" id="ai-name-input" style="padding:10px; font-size:20px; margin-bottom:30px; border-radius: 4px; border: none; text-align: center; width: 100%; max-width: 200px;" placeholder="AI01" maxlength="4"><br>
            <button id="save-name-btn" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
        </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('save-name-btn').addEventListener('click', function() {
            const inputVal = document.getElementById('ai-name-input').value.trim();
            if(inputVal !== "") aiName = inputVal.toUpperCase(); 
            jsPsych.finishTrial(); 
        });
    }
};

const customization_settings_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        function makeSelectRow(priorityNum, defaultCat) {
            return `
            <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                <strong style="color:#32b5a1; font-size: 18px; width: 100px;">Priority ${priorityNum}:</strong>
                <select id="cat-${priorityNum}" style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #555; background: #1e2229; color: white;">
                    <option value="bg" ${defaultCat === 'bg' ? 'selected' : ''}>Background</option>
                    <option value="color" ${defaultCat === 'color' ? 'selected' : ''}>Color</option>
                    <option value="shape" ${defaultCat === 'shape' ? 'selected' : ''}>Shape</option>
                    <option value="size" ${defaultCat === 'size' ? 'selected' : ''}>Size</option>
                </select>
                <select id="val-${priorityNum}" style="padding: 8px; font-size: 16px; border-radius: 4px; border: 1px solid #555; background: #1e2229; color: white; width: 200px;">
                </select>
            </div>`;
        }

        return `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:left; border-radius: 8px; max-width: 800px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#deff9a; margin-top:0; text-align:center;">Configure ${aiName}</h2>
            <p style="text-align:center; margin-bottom:30px; font-size: 18px;">According to your own strategy, rank the categories and select what to look for.</p>
            
            <div id="error-msg" style="color:#d9534f; display:none; text-align:center; margin-bottom:15px; font-weight:bold; padding: 10px; background: rgba(217, 83, 79, 0.1); border-radius: 4px;">
                Please select each category exactly once! (Do not use a category twice)
            </div>

            ${makeSelectRow(1, 'bg')}
            ${makeSelectRow(2, 'color')}
            ${makeSelectRow(3, 'shape')}
            ${makeSelectRow(4, 'size')}
            
            <div style="text-align: center; margin-top: 30px;">
                <button id="save-config-btn" class="action-btn btn-start" style="padding: 12px 30px;">Submit Settings</button>
            </div>
        </div>
        `;
    },
    choices: [],
    on_load: function() {
        const catData = {
            bg: [{v:'dark', t:'Dark areas'}, {v:'light', t:'Light areas'}],
            color: [{v:'orange', t:'Orange'}, {v:'blue', t:'Blue'}],
            shape: [{v:'round', t:'Round (O; Q)'}, {v:'angular', t:'Angular (L; T)'}],
            size: [{v:'large', t:'Large elements'}, {v:'small', t:'Small elements'}]
        };

        function updateSubSelect(rowNum) {
            const catSelect = document.getElementById('cat-' + rowNum);
            const valSelect = document.getElementById('val-' + rowNum);
            valSelect.innerHTML = '';
            catData[catSelect.value].forEach(opt => {
                valSelect.innerHTML += '<option value="' + opt.v + '">' + opt.t + '</option>';
            });
        }

        for (let i = 1; i <= 4; i++) {
            updateSubSelect(i);
            document.getElementById('cat-' + i).addEventListener('change', () => updateSubSelect(i));
        }

        document.getElementById('save-config-btn').addEventListener('click', function() {
            let selectedCats = [];
            for(let i=1; i<=4; i++) selectedCats.push(document.getElementById('cat-'+i).value);
            const uniqueCats = new Set(selectedCats);
            
            if(uniqueCats.size !== 4) {
                document.getElementById('error-msg').style.display = 'block';
                return; 
            }
            
            probandenConfig = [];
            for(let i=1; i<=4; i++) {
                let catEl = document.getElementById('cat-'+i);
                let valEl = document.getElementById('val-'+i);
                
                let c = catEl.value;
                let v = valEl.value;
                let cLabel = catEl.options[catEl.selectedIndex].text;
                let vLabel = valEl.options[valEl.selectedIndex].text;
                
                if(c === 'color' && v === 'orange') vLabel = '<span class="text-orange">Orange</span>';
                if(c === 'color' && v === 'blue') vLabel = '<span class="text-blue">Blue</span>';

                probandenConfig.push({ category: c, value: v, label: cLabel, valueLabel: vLabel });
            }
            jsPsych.finishTrial(); 
        });
    }
};

const final_rules_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return createInfoScreen("Ready to inspect", `
            <p>${aiName} is configured. Now you do the defect inspection together with ${aiName}.</p>
            <p>Your task is again to find defects and mark them by clicking on them. Again, missing defects and marking non-defects are critical errors and should be avoided.</p>
            <p>You have 15 seconds per component.</p>
            <p style="color:#888; font-size:14px;">If necessary, you can use the "recalibrate" button on the right to abort. Use the button carefully.</p>
        `, "Start Main Task");
    },
    choices: [],
    on_load: function() { document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial()); }
};

timeline.push({
    timeline: [customization_name_trial, customization_settings_trial, final_rules_trial],
    conditional_function: function() { return aktuelleVersuchsGruppe === 2; }
});


// ==========================================
// 7. HAUPT-RUNDEN SCHLEIFE
// ==========================================

for (let runde = 1; runde <= ANZAHL_RUNDEN; runde++) {
    const formatierteNummer = String(runde).padStart(3, '0');
    const bildPfad = `bilder/stimulus_${formatierteNummer}.jpg`;
    const csvPfad = `tabellen/stimulus_${formatierteNummer}.csv`;

    const fixation_cross = {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            let placeholderList = '';
            probandenConfig.forEach((conf, index) => {
                placeholderList += `<li>${index+1}. ${conf.label} analysis</li>`;
            });
            placeholderList += `<li>5. Final Anomaly Scan</li>`;

            return `
            <div class="experiment-container">
                <div class="image-container" style="background-color: #808080; display: flex; justify-content: center; align-items: center;">
                    <svg width="80" height="80" viewBox="0 0 100 100">
                        <line x1="50" y1="10" x2="50" y2="90" stroke="black" stroke-width="8" stroke-linecap="round" />
                        <line x1="10" y1="50" x2="90" y2="50" stroke="black" stroke-width="8" stroke-linecap="round" />
                    </svg>
                </div>
                <div class="right-column" style="opacity: 0.5;">
                    <div class="ki-panel">
                        <h3>${aiName} <span style="float:right; color:#888;">PREPARING...</span></h3>
                        <ul style="margin-top:15px; list-style:none; padding:0; color:#888;">
                            ${placeholderList}
                        </ul>
                    </div>
                    <div class="button-container" style="flex-direction: column; text-align: center; margin-top: 20px;">
                        <div style="font-size: 16px; color: #888; margin-bottom: 12px; font-weight: bold;">Ready...</div>
                        <button class="action-btn btn-reset" disabled>Recalibrate</button>
                    </div>
                </div>
            </div>
            `;
        },
        choices: [],
        trial_duration: FIXATION_DAUER_MS
    };

    const runden_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            let kiListHtml = '';
            probandenConfig.forEach((conf, index) => {
                kiListHtml += `<li class="scan-step" id="step-${index+1}"><span class="ki-number">${index+1}</span> ${conf.label}: ${conf.valueLabel}</li>`;
            });
            kiListHtml += `<li class="scan-step" id="step-5" style="color: #d9534f;"><span class="ki-number" style="background:#d9534f; color:#fff;">5</span> Final Anomaly Scan</li>`;

            const adminBtnHtml = aktuelleVersuchsGruppe === 3 ? `<button id="admin-next-btn" class="action-btn btn-start" style="margin-bottom: 10px;" disabled>Weiter (Admin)</button>` : ``;

            return `
            <style>
                .scan-step { opacity: 0.3; transition: opacity 0.3s; }
                .scan-active { opacity: 1.0; color: #deff9a; font-weight: bold; }
            </style>
            <div class="experiment-container">
                <div id="image-wrapper" class="image-container">
                    <img src="${bildPfad}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" />
                </div>
                <div class="right-column">
                    <div class="ki-panel">
                        <h3>${aiName} <span style="float:right; color:#f08e16;" id="scan-status">SCANNING...</span></h3>
                        <ul id="ki-list" style="margin-top:15px; list-style:none; padding:0;">
                            ${kiListHtml}
                        </ul>
                    </div>
                    <div class="button-container" style="flex-direction: column; text-align: center; margin-top: 20px;">
                        <div id="countdown-timer" style="font-size: 16px; color: #e0e0e0; margin-bottom: 12px; font-weight: bold;">Ready...</div>
                        ${adminBtnHtml}
                        <button id="custom-reset-btn" class="action-btn btn-reset" disabled>Recalibrate</button>
                    </div>
                </div>
            </div>
            `;
        },
        choices: [],
        on_finish: function(data) {
            if (data.beendigungs_grund === 'reset') jsPsych.endExperiment("Das System wird rekalibriert. Das Experiment wurde beendet.");
        },
        on_load: function() {
            const resetBtn = document.getElementById('custom-reset-btn');
            const timerDisplay = document.getElementById('countdown-timer');
            const statusText = document.getElementById('scan-status');
            const imageWrapper = document.getElementById('image-wrapper');
            const adminNextBtn = document.getElementById('admin-next-btn'); 
            let countdownInterval;
            let isScanFinished = false;

            ladeTabelleUndBereiteVor(csvPfad, runde, false, () => {
                let currentStep = 1;
                const aktuellerDrift = berechneDrift(runde);

                let sequenceInterval = setInterval(() => {
                    document.querySelectorAll('.scan-step').forEach(el => el.classList.remove('scan-active'));
                    if(document.getElementById(`step-${currentStep}`)) document.getElementById(`step-${currentStep}`).classList.add('scan-active');

                    aktuelleZeichenDaten.forEach(zeichen => {
                        if (zeichen.ki_setzt_ring && zeichen.render_gruppe === currentStep) {
                            const groesse = (zeichen.is_small === true || zeichen.is_small === "True") ? 'klein' : 'groß';
                            const ringDrift = zeichen.wird_verschoben ? aktuellerDrift : 0.0;
                            renderRing('image-wrapper', zeichen.center_x, zeichen.center_y, groesse, ringDrift, zeichen);
                            zeichen.hat_ring = true;
                        }
                    });

                    currentStep++;

                    if (currentStep > 5) {
                        clearInterval(sequenceInterval);
                        statusText.innerText = "ASSISTING";
                        statusText.style.color = "#32b5a1";
                        resetBtn.disabled = false;
                        if (adminNextBtn) adminNextBtn.disabled = false; 
                        isScanFinished = true;
                        
                        // Timer Logik (Jetzt für alle!)
                        let timeLeft = RUNDEN_DAUER_SEK;
                        timerDisplay.innerText = `Continue in ${timeLeft}...`;
                        countdownInterval = setInterval(() => {
                            timeLeft--;
                            timerDisplay.innerText = `Continue in ${timeLeft}...`;
                            if (timeLeft <= 0) beendeRunde('timeout');
                        }, 1000);
                        
                    }
                }, SEQUENZ_SCHRITT_MS);
            });

            function beendeRunde(grund) {
                clearInterval(countdownInterval);
                let ki_falsch_korrigiert = 0, ki_vergessen_gefunden = 0, proband_neu_falsch = 0;    
                aktuelleZeichenDaten.forEach(z => {
                    if (!z.ist_ziel && z.ki_setzt_ring && !z.hat_ring) ki_falsch_korrigiert++;
                    if (z.ist_ziel && !z.ki_setzt_ring && z.hat_ring) ki_vergessen_gefunden++;
                    if (!z.ist_ziel && !z.ki_setzt_ring && z.hat_ring) proband_neu_falsch++;
                });
                jsPsych.finishTrial({ runde: runde, versuchsgruppe: aktuelleVersuchsGruppe, beendigungs_grund: grund, korrigierte_falsche_ki_ringe: ki_falsch_korrigiert, gefundene_vergessene_ki_ringe: ki_vergessen_gefunden, proband_falsch_markiert: proband_neu_falsch });
            }

            resetBtn.addEventListener('click', () => beendeRunde('reset'));
            if (adminNextBtn) adminNextBtn.addEventListener('click', () => beendeRunde('admin_skip'));

            imageWrapper.addEventListener('click', function(e) {
                if (!isScanFinished) return;
                const rect = imageWrapper.getBoundingClientRect();
                const klickX = e.clientX - rect.left, klickY = e.clientY - rect.top;
                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                
                aktuelleZeichenDaten.forEach(zeichen => {
                    const distanz = Math.sqrt(Math.pow(klickX - zeichen.center_x, 2) + Math.pow(klickY - zeichen.center_y, 2));
                    if (distanz < minimaleDistanz) { minimaleDistanz = distanz; naechstesZeichen = zeichen; }
                });

                if (naechstesZeichen && minimaleDistanz <= 40 && !naechstesZeichen.hat_ring) {
                    const groesse = (naechstesZeichen.is_small === true || naechstesZeichen.is_small === "True") ? 'klein' : 'groß';
                    renderRing('image-wrapper', naechstesZeichen.center_x, naechstesZeichen.center_y, groesse, 0.0, naechstesZeichen);
                    naechstesZeichen.hat_ring = true;
                }
            });
        }
    };

    let runde_timeline = [];
    if (runde > 1) runde_timeline.push(fixation_cross);
    runde_timeline.push(runden_trial);

    timeline.push({
        timeline: runde_timeline,
        conditional_function: function() {
            if (aktuelleVersuchsGruppe === 3 && runde < RUNDEN_OHNE_DRIFT + 1) return false;
            return true;
        }
    });
}

jsPsych.run(timeline);