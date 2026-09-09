/**
 * HAUPTABLAUF DES EXPERIMENTS
 */

let aiName = "AI ASSISTANT";
let experimentAborted = false; 

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
        
        document.body.innerHTML = '<div style="text-align:center; margin-top:20vh; color:white; font-family:sans-serif;"><h1>Data Saved!</h1><p>You may close this window now.</p></div>';
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
// 1. HAUPTMENÜ & ADMIN CONFIG
// ==========================================
let chose_calibration = false;

const main_menu = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h1 style="color:#deff9a; margin-top:0;">Experiment Setup</h1>
            <p>Wähle den Modus für diesen Probanden:</p>
        </div>
    `,
    choices: ['1. Standard', '2. Customization', '3. Admin Skip (Runde 10)', '4. Eyetracker Kalibrierung'],
    on_finish: function(data) { 
        if (data.response === 3) {
            chose_calibration = true; // Startet die Schleife für Kalibrierung neu
        } else {
            chose_calibration = false;
            aktuelleVersuchsGruppe = data.response + 1; 
        }
    }
};

const calibration_screen = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="position: relative; width: 90vw; max-width: 1200px; aspect-ratio: 1920/1080; background: #222; margin: 0 auto; border: 2px solid #555;">
            <!-- 9 Rote Punkte -->
            <div style="position:absolute; top:5%; left:5%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:5%; left:50%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:5%; left:95%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            
            <div style="position:absolute; top:50%; left:5%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:50%; left:50%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:50%; left:95%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            
            <div style="position:absolute; top:95%; left:5%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:95%; left:50%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            <div style="position:absolute; top:95%; left:95%; width:24px; height:24px; background:red; border-radius:50%; transform:translate(-50%, -50%);"></div>
            
            <!-- Ausgelagerter Text -->
            <p style="position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%); width: 100%; color: white; text-align: center; font-family: sans-serif; font-size: 18px; margin: 0;">Eyetracker-Kalibrierung (9-Punkt). Bitte Punkte fixieren.</p>
        </div>
    `,
    choices: ['Kalibrierung beendet (Zurück zum Menü)']
    // HIER wurde die conditional_function entfernt!
};

// Schleife, die so lange läuft, wie "Eyetracker" ausgewählt wird
timeline.push({
    timeline: [
        main_menu, 
        {
            // HIER wird der Screen jetzt als Unter-Timeline geprüft
            timeline: [calibration_screen],
            conditional_function: function() { 
                return chose_calibration; 
            }
        }
    ],
    loop_function: function() { return chose_calibration; }
});

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

const glasses_check_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <!-- Vollflächiger weißer Hintergrund passend zur Vorlage -->
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; z-index: 9999;">
        <div style="max-width: 900px; padding: 40px; text-align: center;">
            <p style="font-size: 24px; line-height: 1.4; margin-bottom: 80px;">
                This study involves looking closely at small shapes and colors on your screen. If you normally wear<br>glasses or contacts for computer work, please put them on now.
            </p>
            
            <div style="display: flex; flex-direction: column; align-items: flex-end; width: max-content; margin: 0 auto 50px auto; gap: 25px;">
                <label style="font-size: 18px; cursor: pointer; display: flex; align-items: center;">
                    I need glasses or contacts for computer work and I am wearing them now.
                    <input type="radio" name="glasses" value="1" style="margin-left: 20px; width: 22px; height: 22px; cursor: pointer;">
                </label>
                <label style="font-size: 18px; cursor: pointer; display: flex; align-items: center;">
                    I do not need glasses or contacts for computer work.
                    <input type="radio" name="glasses" value="0" style="margin-left: 20px; width: 22px; height: 22px; cursor: pointer;">
                </label>
            </div>
            
            <!-- Der Button ist anfangs unsichtbar, damit der User eine Option wählen muss -->
            <button id="glasses-next-btn" class="action-btn" style="padding: 12px 30px; display: none; margin: 0 auto; background-color: #32b5a1; color: white; border: none; border-radius: 4px; font-size: 18px; cursor: pointer;">Next</button>
        </div>
    </div>
    `,
    choices: [],
    on_load: function() {
        const radios = document.querySelectorAll('input[name="glasses"]');
        const nextBtn = document.getElementById('glasses-next-btn');

        // Button einblenden, sobald eine Option angeklickt wird
        radios.forEach(r => r.addEventListener('change', () => {
            nextBtn.style.display = 'block';
        }));

        nextBtn.addEventListener('click', () => {
            const selected = document.querySelector('input[name="glasses"]:checked').value;
            
            // Hängt die Spalte "wearing_glasses" (mit 1 oder 0) global an ALLE Datensätze dieses Probanden im Log an
            jsPsych.data.addProperties({ wearing_glasses: parseInt(selected) });
            
            jsPsych.finishTrial();
        });
    }
};

let intro_timeline = [
    glasses_check_trial, // <--- Startbildschirm mit Brillen-Abfrage
    {
        // Text 1
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen(
            "Context", 
            `<p>Imagine you work for a company that manufactures and maintains metal components.</p>
             <p>You will examine simplified radiographic images to identify material defects. If a component exceeds a specific threshold of defects, it is considered unsafe and must be rejected.</p>
             <p>This task is safety-critical: missing a defect risks failure in service, while falsely rejecting a good part causes unnecessary cost and delay. Avoid both types of errors.</p>`
        ),
        choices: [], 
        on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    },
    {
        // Text 2
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen(
            "The Task", 
            `<p>You will view component images one by one. Your task is to classify each part based on its defects.</p>
             <p>An <strong>L</strong> or an <strong>O</strong> is a defect. Ignore all other letters. Orange and blue letters as well as large and small ones are equally important.</p>
             <p>Flag a component as <i style="color: #d9534f;">reject</i> if it contains <strong style="color: #d9534f;">more than 10</strong> defects. Otherwise, flag it as <i style="color: #5cb85c;">pass</i>.</p>
             <p>You can click on defects to mark them for easier counting. Click again to deselect.</p>`
        ),
        choices: [], 
        on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
    },
    {
        // Text 3
        type: jsPsychHtmlButtonResponse,
        stimulus: createInfoScreen(
            "Practice", 
            `<div style="text-align: center;">
                 <p>Next, you will practice the task.</p>
                 <p>Use the buttons below to classify each component:</p>
                 <ul style="display: inline-block; text-align: left; margin: 10px auto;">
                     <li><i style="color: #d9534f;">reject</i>: more than 10 defects</li>
                     <li><i style="color: #5cb85c;">pass</i>: 10 or less defects</li>
                 </ul>
                 <p>Defects are <strong>Ls</strong> and <strong>Os</strong>.</p>
             </div>`, 
            "Start Training"
        ),
        choices: [], 
        on_load: () => document.getElementById('custom-next-btn').addEventListener('click', () => jsPsych.finishTrial())
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
    // Das Array mit den Bildern passen wir später an, 
    // solange greift hier noch deine bestehende Namenskonvention.
    const bildPfad = `bilder/stimulus_training_${formatierteNummer}.jpg`;

    // Den CSV-Pfad bereiten wir hier schon vor, auch wenn er aktuell nicht geladen wird.
    // So können wir ihn in Zukunft in wenigen Sekunden aktivieren, falls du Logs brauchst.
    const csvPfad = `tabellen/stimulus_training_${formatierteNummer}.csv`;

    const training_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <div class="experiment-container">
            <div id="image-wrapper" class="image-container" style="position:relative; width:100%; aspect-ratio: 1920/1080; cursor: crosshair;">
                <img src="${bildPfad}" style="position:absolute; top:0; left:0; width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" />
            </div>
            <div class="right-column">
                <div style="background:#1e2229; padding:20px; border-radius:10px; color:white; font-family:sans-serif; border: 2px solid #555;">
                    <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:10px;">TRAINING (${t}/${ANZAHL_TRAINING_RUNDEN})</h3>
                    <p style="color:#e0e0e0; line-height:1.5;">Click anywhere on the image to place a marker as a counting aid.</p>
                    <p style="color:#e0e0e0; line-height:1.5;">Click on an existing marker to remove it.</p>
                </div>
                <div class="button-container" style="margin-top: 20px;">
                    <!-- Neue Pass/Reject Buttons -->
                    <button id="btn-pass" class="action-btn" style="background-color: #5cb85c;">Pass</button>
                    <button id="btn-reject" class="action-btn btn-reset">Reject</button>
                </div>
            </div>
        </div>
        `,
        choices: [],
        on_load: function() {
            const imageWrapper = document.getElementById('image-wrapper');
            const passBtn = document.getElementById('btn-pass');
            const rejectBtn = document.getElementById('btn-reject');
            
            // 1. Interaktion: Freien Marker setzen
            imageWrapper.addEventListener('click', function(e) {
                // Verhindern, dass ein Marker gesetzt wird, wenn man auf einen bereits bestehenden klickt
                if(e.target.classList.contains('ki-ring')) return;

                // X/Y Koordinaten des Klicks relativ zum Bild berechnen
                const rect = imageWrapper.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // Marker-Element erstellen (nutzt deine bestehende CSS Klasse aus style.css)
                const marker = document.createElement('div');
                marker.classList.add('ki-ring'); 
                marker.style.width = '40px'; 
                marker.style.height = '40px';
                marker.style.left = clickX + 'px';
                marker.style.top = clickY + 'px';
                
                // 2. Interaktion: Marker löschen (Toggle)
                marker.addEventListener('click', function(markerEvent) {
                    markerEvent.stopPropagation(); // Verhindert, dass das Bild erneut das Klick-Event feuert
                    marker.remove();
                });

                imageWrapper.appendChild(marker);
            });

            // 3. Navigation & Datenspeicherung
            function endTrial(decision) {
                // jsPsych.finishTrial() beendet den Screen sofort. Alle Marker werden 
                // durch das Laden des nächsten HTML-Blocks restlos gelöscht.
                jsPsych.finishTrial({ 
                    runde: t, 
                    is_training: true, 
                    entscheidung: decision
                });
            }

            passBtn.addEventListener('click', () => endTrial('Pass'));
            rejectBtn.addEventListener('click', () => endTrial('Reject'));
        }
    };
    
    training_timeline.push(training_trial);
}

timeline.push({
    timeline: training_timeline,
    conditional_function: function() { return aktuelleVersuchsGruppe === 1 || aktuelleVersuchsGruppe === 2; }
});

// ==========================================
// NEUER SCREEN: DIREKT NACH DEM TRAINING (Für Gruppe 1 & 2)
// ==========================================
const practice_finished_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style="background:#0f172a; padding: 60px 40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto;">
        <p style="font-size: 24px; line-height: 1.4; margin-bottom: 30px;">
            You have finished the practice.
        </p>
        <p style="font-size: 24px; line-height: 1.4; margin-bottom: 40px;">
            Your company has introduced an intelligent assistance system for defect detection. In this next phase, an AI agent will assist you during the task.
        </p>
        <button id="next-btn-practice-done" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
    </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-practice-done').addEventListener('click', () => jsPsych.finishTrial());
    }
};

timeline.push({
    timeline: [practice_finished_trial],
    conditional_function: function() { return aktuelleVersuchsGruppe === 1 || aktuelleVersuchsGruppe === 2; }
});




// ==========================================
// 4. KI INTRO & CUSTOMIZATION
// =========================================

// 2. NEU: Erstes Textfenster (DA02 Aufgaben)
const standard_intro_new_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        // Hier wird der Name im Hintergrund fest für Gruppe 1 vergeben
        aiName = "DA02"; 
        
        return `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto; border: 1px solid #334155;">
            <p style="font-size: 22px; line-height: 1.6; margin-bottom: 20px;">
                The AI <i>DA02</i> will assist by marking defects and providing a reject or pass recommendation for each component.
            </p>
            <p style="font-size: 22px; line-height: 1.6; margin-bottom: 30px;">
                Your task remains to classify each part as ready to proceed (pass) or defective (reject).
            </p>
            <button id="next-btn-std-1" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
        </div>
        `;
    },
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-std-1').addEventListener('click', () => jsPsych.finishTrial());
    }
};

// 3. NEU: Zweites Textfenster (Exploration & Evaluation)
const standard_intro_new_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto; border: 1px solid #334155;">
        <p style="font-size: 22px; line-height: 1.6; margin-bottom: 30px;">
            Before working together with the AI agent, please take some time to explore its functions. Note that you will later be asked to evaluate it in your role as a defect inspector.
        </p>
        <button id="next-btn-std-2" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
    </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-std-2').addEventListener('click', () => jsPsych.finishTrial());
    }
};

// Alle drei Screens werden nacheinander abgespielt, wenn Standard-Modus (Gruppe 1) aktiv ist
timeline.push({
    timeline: [standard_intro_new_1, standard_intro_new_2],
    conditional_function: function() { return aktuelleVersuchsGruppe === 1; }
});

const customization_intro_new_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style="background:#0f172a; padding: 60px 40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto;">
        <p style="font-size: 24px; line-height: 1.4; margin-bottom: 30px;">
            The AI will assist by marking defects and providing a reject or pass recommendation for each component.
        </p>
        <p style="font-size: 24px; line-height: 1.4; margin-bottom: 40px;">
            Your task remains to classify each part as ready to proceed (pass) or defective (reject).
        </p>
        <button id="next-btn-cust-1" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
    </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-cust-1').addEventListener('click', () => jsPsych.finishTrial());
    }
};

const customization_intro_new_2 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
    <div style="background:#0f172a; padding: 60px 40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto;">
        <p style="font-size: 24px; line-height: 1.4; margin-bottom: 40px;">
            Before working together with your AI agent, please take some time to customize it using the customization interface on the next page to suit your role as a defect inspector.
        </p>
        <button id="next-btn-cust-2" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
    </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-cust-2').addEventListener('click', () => jsPsych.finishTrial());
    }
};


const customization_name_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#deff9a; margin-top:0;">Agent Identification</h2>
            <p style="margin-bottom: 20px; font-size: 18px; line-height: 1.5; text-align: left;">First, give your AI agent an identification so that your settings can be saved. Identifications consist of 2 letters and 2 numbers (e.g. AI01).</p>
            
            <!-- NEU: Versteckte Fehlermeldung, falls die Eingabe falsch ist -->
            <div id="name-error-msg" style="color:#d9534f; display:none; margin-bottom:15px; font-weight:bold; background: rgba(217, 83, 79, 0.1); padding: 10px; border-radius: 4px;">
                Please enter exactly 2 letters followed by 2 numbers (e.g., AI01).
            </div>
            
            <input type="text" id="ai-name-input" style="padding:10px; font-size:20px; margin-bottom:30px; border-radius: 4px; border: none; text-align: center; width: 100%; max-width: 200px;" placeholder="AI01" maxlength="4"><br>
            <button id="save-name-btn" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
        </div>
    `,
    choices: [],
    on_load: function() {
        document.getElementById('save-name-btn').addEventListener('click', function() {
            const inputVal = document.getElementById('ai-name-input').value.trim();
            const errorMsg = document.getElementById('name-error-msg');
            
            // NEU: Regex-Prüfung - ^[a-zA-Z]{2} = 2 Buchstaben, \d{2}$ = 2 Zahlen am Ende
            const namePattern = /^[a-zA-Z]{2}\d{2}$/;
            
            if(namePattern.test(inputVal)) {
                errorMsg.style.display = 'none'; // Fehler verstecken
                aiName = inputVal.toUpperCase(); 
                jsPsych.finishTrial(); // Nur weitergehen, wenn Eingabe korrekt ist
            } else {
                errorMsg.style.display = 'block'; // Fehler anzeigen
            }
        });
    }
};

const customization_settings_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        // Die Kategorien sind jetzt fest vorgegeben, nur noch die Werte sind wählbar
        function makeRow(id, label, catValue, options) {
            let opts = options.map(o => `<option value="${o.v}">${o.t}</option>`).join('');
            return `
            <div id="row-${id}" style="display: flex; align-items: center; gap: 15px; background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 8px; width: 100%; max-width: 500px; transition: background 0.3s;">
                <strong style="color:#32b5a1; font-size: 16px; width: 120px;">${label}:</strong>
                <input type="hidden" id="cat-${id}" value="${catValue}">
                <input type="hidden" id="label-${id}" value="${label}">
                <select id="val-${id}" style="padding: 6px; font-size: 15px; border-radius: 4px; border: 1px solid #555; background: #1e2229; color: white; flex: 1;">
                    ${opts}
                </select>
            </div>`;
        }

        return `
        <style>
            .preview-pass { border: 4px solid #5cb85c !important; box-shadow: 0 0 15px rgba(92, 184, 92, 0.5) !important; transition: all 0.3s; }
            .preview-reject { border: 4px solid #d9534f !important; box-shadow: 0 0 15px rgba(217, 83, 79, 0.5) !important; transition: all 0.3s; }
        </style>

        <div style="display: flex; flex-direction: column; align-items: center; max-width: 1050px; margin: 20px auto; gap: 20px;">
            
            <!-- TOP AREA: Bild links, Status rechts -->
            <div style="display: flex; gap: 20px; width: 100%; justify-content: center; align-items: stretch;">
                
                <!-- VORSCHAU-BILD -->
                <div id="preview-image-wrapper" style="position:relative; width: 700px; flex-shrink: 0; aspect-ratio: 1920/1080; background: #222; border: 2px solid #555; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    <img src="bilder/stimulus_001.jpg" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain;" />
                    <div style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.7); color:white; padding:5px 10px; border-radius:4px; font-weight:bold;">Preview Example</div>
                </div>

                <!-- KI-STATUS-FENSTER -->
                <div style="flex: 1; background: #d0d0d0; border: 2px solid #333; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; color: #444; font-family: sans-serif;">
                    <div style="background: #999; border: 2px solid #333; padding: 5px 20px; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #111; margin-bottom: 30px; margin-top: 10px;">
                        ${aiName}
                    </div>
                    <div id="status-text" style="font-size: 18px; line-height: 1.6; text-align: left; width: 100%;">
                        <span style="color:#888; font-style:italic;">Ready for configuration...</span>
                    </div>
                </div>

            </div>

            <!-- KONFIGURATIONS-PANEL -->
            <div style="background:#0f172a; padding:30px; color:white; font-family:sans-serif; border-radius: 8px; border: 1px solid #334155; width: 100%; box-sizing: border-box;">
                
                <p id="instructions-text" style="text-align:center; font-size: 16px; line-height: 1.5; margin-top: 0; margin-bottom: 20px;">
                    <strong>${aiName}</strong> has a fixed search order (Direction → Background → Size → Type). You can customize its starting preferences using the dropdown menus.<br><br>
                    Feel free to adjust these settings as often as you like. Click <strong style="color: #32b5a1;">Apply</strong> to run a demo with your current settings, or click <strong style="color: #32b5a1;">Proceed</strong> once you are ready to practice the task with your agent.
                </p>
                
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    ${makeRow(1, 'Direction', 'direction', [{v:'top_left', t:'top left'}, {v:'top_right', t:'top right'}, {v:'bottom_right', t:'bottom right'}, {v:'bottom_left', t:'bottom left'}])}
                    ${makeRow(2, 'Background', 'bg', [{v:'dark', t:'dark areas'}, {v:'light', t:'light areas'}])}
                    ${makeRow(3, 'Size', 'size', [{v:'large', t:'large'}, {v:'small', t:'small'}])}
                    ${makeRow(4, 'Type', 'type', [{v:'L', t:'L'}, {v:'O', t:'O'}])}
                </div>
                
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 30px;">
                    <button id="apply-btn" class="action-btn" style="background:#555; padding: 12px 30px; width: 150px;">Apply</button>
                    <button id="proceed-btn" class="action-btn btn-start" style="padding: 12px 30px; width: 150px;">Proceed</button>
                </div>
            </div>
        </div>
        `;
    },
    choices: [],
    on_load: function() {
        const applyBtn = document.getElementById('apply-btn');
        const proceedBtn = document.getElementById('proceed-btn');
        const imageWrapper = document.getElementById('preview-image-wrapper');
        const statusText = document.getElementById('status-text');
        const instructionsText = document.getElementById('instructions-text');
        
        let previewInterval;

        function getSelectedConfig() {
            let tempConfig = [];
            for(let i=1; i<=4; i++) {
                let catEl = document.getElementById('cat-'+i);
                let labelEl = document.getElementById('label-'+i);
                let valEl = document.getElementById('val-'+i);
                tempConfig.push({ 
                    category: catEl.value, 
                    value: valEl.value, 
                    label: labelEl.value, 
                    valueLabel: valEl.options[valEl.selectedIndex].text 
                });
            }
            return tempConfig;
        }

        proceedBtn.addEventListener('click', function() {
            probandenConfig = getSelectedConfig();
            clearInterval(previewInterval); 
            jsPsych.finishTrial(); 
        });

        applyBtn.addEventListener('click', function() {
            const tempConfig = getSelectedConfig();
            probandenConfig = tempConfig;
            
            applyBtn.disabled = true;
            proceedBtn.disabled = true;
            applyBtn.style.opacity = '0.5';
            applyBtn.innerText = 'Running...';

            // Text exakt nach Mockup aufbauen (z.B. "... starting search with large Ls on dark areas in the top left ...")
            const dirVal = tempConfig[0].valueLabel;
            const bgVal = tempConfig[1].valueLabel;
            const sizeVal = tempConfig[2].valueLabel;
            const typeVal = tempConfig[3].valueLabel;
            
            statusText.innerHTML = `... starting search with ${sizeVal} ${typeVal}s on ${bgVal} in the ${dirVal} ...`;

            imageWrapper.classList.remove('preview-pass', 'preview-reject');
            imageWrapper.querySelectorAll('.ki-ring').forEach(el => el.remove());

            ladeTabelleUndBereiteVor('tabellen/stimulus_001.csv', 1, false, () => {
                let currentStep = 1;
                let circleCount = 0; 
                
                clearInterval(previewInterval); 
                
                for(let i=1; i<=4; i++) {
                    document.getElementById(`row-${i}`).style.background = 'rgba(255,255,255,0.05)';
                }
                document.getElementById('row-1').style.background = 'rgba(50, 181, 161, 0.25)';

                previewInterval = setInterval(() => {
                    
                    aktuelleZeichenDaten.forEach(zeichen => {
                        if (zeichen.ki_setzt_ring && zeichen.render_gruppe === currentStep) {
                            const groesse = (zeichen.is_small === true || zeichen.is_small === "True") ? 'klein' : 'groß';
                            renderRing('preview-image-wrapper', zeichen.center_x, zeichen.center_y, groesse, 0.0, zeichen);
                            circleCount++; 
                        }
                    });
                    
                    currentStep++;
                    
                    for(let i=1; i<=4; i++) {
                        const row = document.getElementById(`row-${i}`);
                        if(row) row.style.background = 'rgba(255,255,255,0.05)';
                    }
                    if(currentStep <= 4) {
                        document.getElementById(`row-${currentStep}`).style.background = 'rgba(50, 181, 161, 0.25)';
                    }
                    
                    if (currentStep > 5) {
                        clearInterval(previewInterval);
                        applyBtn.disabled = false;
                        proceedBtn.disabled = false;
                        applyBtn.style.opacity = '1';
                        applyBtn.innerText = 'Apply';
                        
                        if (circleCount >= 11) {
                            imageWrapper.classList.add('preview-reject');
                        } else {
                            imageWrapper.classList.add('preview-pass');
                        }

                        statusText.innerHTML = `<span style="font-size: 24px; font-weight: bold; color: #111;">Final verdict:<br>${circleCount} defects</span>`;

                        const isReject = circleCount >= 11;
                        const colorFlag = isReject ? 'red' : 'green';
                        const actionText = isReject ? 'reject' : 'pass';
                        const colorHex = isReject ? '#d9534f' : '#5cb85c';

                        instructionsText.innerHTML = `<strong>${aiName}</strong> found ${circleCount} defects in this example and flagged the component <strong style="color:${colorHex};">${colorFlag}</strong>.`;
                    }
                }, 2000); 
            });
        });
    }
};

// ==========================================
// NEUE SCREENS NACH DER KONFIGURATION
// ==========================================

const ai_mistakes_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 700px; margin: 40px auto; border: 1px solid #334155;">
            <p style="font-size: 20px; line-height: 1.6; margin-bottom: 30px;">
                Like all systems of this type, <strong>${aiName}</strong> can make mistakes. Under the operating conditions used here, it classifies approximately 90% of individual markings correctly. Residual misclassifications are an expected characteristic of intelligent visual inspection and are documented in the system specification. They occur because surface texture, contrast, and marking geometry can make individual markings harder to resolve. Your task is to make the final assessment for each component.
            </p>
            <button id="next-btn-1" class="action-btn btn-start" style="padding: 12px 30px;">Next</button>
        </div>
        `;
    },
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-1').addEventListener('click', () => jsPsych.finishTrial());
    }
};

const ai_practice_reminder_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <p style="font-size: 20px; line-height: 1.6; margin-bottom: 10px;">
                Now you can practice the detection task with <strong>${aiName}</strong>.
            </p>
            <p style="font-size: 20px; line-height: 1.6; margin-bottom: 10px;">
                To help you get started, the practice begins with simpler images.
            </p>
            <p style="font-size: 20px; line-height: 1.6; margin-bottom: 30px;">
                Be aware that AI can make mistakes.
            </p>
            
            <p style="font-size: 20px; margin-bottom: 10px;">Remember:</p>
            <ul style="display: inline-block; text-align: left; font-size: 20px; line-height: 1.6; margin: 0 auto 30px auto; padding-left: 20px;">
                <li><i style="color: #d9534f; font-weight: bold;">reject</i>: more than 10 defects</li>
                <li><i style="color: #5cb85c; font-weight: bold;">pass</i>: 10 or less defects</li>
                <li>Defects: <strong>Ls</strong> and <strong>Os</strong></li>
            </ul>
            <br>
            <button id="next-btn-2" class="action-btn btn-start" style="padding: 12px 30px;">start</button>
        </div>
        `;
    },
    choices: [],
    on_load: function() {
        document.getElementById('next-btn-2').addEventListener('click', () => jsPsych.finishTrial());
    }
};

// Timeline Push mit den beiden neuen Screens anstelle des alten
timeline.push({
    timeline: [customization_intro_new_1, customization_intro_new_2, customization_name_trial, customization_settings_trial, ai_mistakes_trial, ai_practice_reminder_trial],
    conditional_function: function() { return aktuelleVersuchsGruppe === 2; }
});


// ==========================================
// 5. HAUPT-RUNDEN SCHLEIFE
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
                <div id="image-wrapper" class="image-container" style="position:relative; width:100%; aspect-ratio: 1920/1080;">
                    <img src="${bildPfad}" style="position:absolute; top:0; left:0; width: 100%; height: 100%; object-fit: contain; border-radius: 4px;" />
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
            if (data.beendigungs_grund === 'reset') {
                experimentAborted = true; 
            }
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
                const scale = rect.width / ORIGINAL_BILD_BREITE; 

                // 1. Bildschirm-Klick berechnen
                const screenKlickX = e.clientX - rect.left;
                const screenKlickY = e.clientY - rect.top;

                // 2. Zurückrechnen in die Original-Welt (Tabelle)
                const originalKlickX = screenKlickX / scale;
                const originalKlickY = screenKlickY / scale;

                let naechstesZeichen = null;
                let minimaleDistanz = Infinity;
                
                aktuelleZeichenDaten.forEach(zeichen => {
                    const distanz = Math.sqrt(Math.pow(originalKlickX - zeichen.center_x, 2) + Math.pow(originalKlickY - zeichen.center_y, 2));
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
            if (experimentAborted) return false;
            if (aktuelleVersuchsGruppe === 3 && runde < RUNDEN_OHNE_DRIFT + 1) return false;
            return true;
        }
    });
}

// ==========================================
// 6. ABSCHLUSS-FRAGEBÖGEN (NACH DEM EXPERIMENT)
// ==========================================

const likert_scale = ["1 - Strongly Disagree", "2", "3", "4", "5", "6", "7 - Strongly Agree"];
const preamble_text = `<div style="max-width: 800px; margin: 0 auto; text-align: left; margin-bottom: 20px;"><p>We are interested in your perceptions of the agent.<br>Please take your time to answer the following questions based on your experiences so far. There are no right or wrong answers.<br><br>Please indicate the degree to which you personally agree or disagree with the following statements.</p></div>`;
const short_preamble = `<div style="max-width: 800px; margin: 0 auto; text-align: left; margin-bottom: 20px;"><p>Please indicate the degree to which you personally agree or disagree with the following statements.</p></div>`;

// 6.1 Recalibrate Frage (Nur wenn abgebrochen wurde)
const recalibrate_survey = {
    type: jsPsychSurveyText,
    preamble: '<div style="max-width: 800px; margin: 0 auto; text-align: left;"><h3>Recalibration</h3></div>',
    questions: [
        {prompt: "Why did you click on „Recalibrate“?<br>Please type your answer…", rows: 5, name: 'recalibrate_reason'}
    ],
    conditional_function: function() { return experimentAborted; }
};
timeline.push(recalibrate_survey);

// 6.2 Paket 1: Customization (Die ersten 3)
const customization_survey = {
    type: jsPsychSurveyLikert,
    preamble: preamble_text,
    questions: [
        {prompt: "I customized the agent before using it for the task.", name: 'cust_1', labels: likert_scale, required: true},
        {prompt: "The agent I worked with was customized based on my instructions.", name: 'cust_2', labels: likert_scale, required: true},
        {prompt: "The agent I worked with was customized based on my search strategy.", name: 'cust_3', labels: likert_scale, required: true}
    ]
};
timeline.push(customization_survey);

// 6.3 Paket 2: Trust (Die nächsten 2)
const trust_survey = {
    type: jsPsychSurveyLikert,
    preamble: short_preamble,
    questions: [
        {prompt: "I trust the agent.", name: 'trust_1', labels: likert_scale, required: true},
        {prompt: "I can rely on the agent.", name: 'trust_2', labels: likert_scale, required: true}
    ]
};
timeline.push(trust_survey);

// 6.4 Paket 3: Szenario-Text + Responsibility (Die letzten 2)
const responsibility_survey = {
    type: jsPsychSurveyLikert,
    preamble: `
        <div style="text-align: left; max-width: 800px; margin: 0 auto; line-height: 1.6; margin-bottom: 30px;">
            <p>Now, imagine that you have reported the detected component defects to your company. During further processing of a component you inspected before the break, high porosity was detected.</p>
            <p>An experienced engineer has raised concerns that serious errors were made in defect detection for this component, and that it was consequently misclassified. In short, they gave the classifications on this component a negative evaluation.</p>
            <p style="margin-top: 20px;"><strong>Please indicate the degree to which you personally agree or disagree with the following statements.</strong></p>
        </div>`,
    questions: [
        {prompt: "I am personally responsible for the misclassified component.", name: 'resp_1', labels: likert_scale, required: true},
        {prompt: "The AI system is responsible for the misclassified component.", name: 'resp_2', labels: likert_scale, required: true}
    ]
};
timeline.push(responsibility_survey);

// 6.5 Outro
const outro_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h2 style="color:#deff9a; margin-top:0;">Thank you!</h2>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                We were interested in your interaction with the agent and whether you were interested in recalibrating, so there is no need for further recalibration.
            </p>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
                Thank you for participating.<br>You may close this window now.
            </p>
        </div>
    `,
    choices: ['Finish & Save Data']
};
timeline.push(outro_trial);

jsPsych.run(timeline);