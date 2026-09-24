/**
 * HAUPTABLAUF DES EXPERIMENTS
 */

(() => {
const condition = resolveExperimentCondition(window.location.search);
const debugEnabled = isExperimentDebugEnabled(window.location.search);

if (!condition) {
    document.body.innerHTML = `
        <main style="max-width: 650px; margin: 15vh auto; padding: 24px; font-family: sans-serif;">
            <h1>Configuration error</h1>
            <p>The experiment link is missing a valid version. Please use the complete link provided by the study team, or contact them for a corrected link.</p>
            <p>The URL must contain exactly one version parameter: ?version=1, ?version=2, ?version=3 or ?version=4.</p>
        </main>`;
    return;
}

let aiName = condition.agentNameMode === 'fixed' ? condition.fixedAgentName : "AI ASSISTANT";

let submitted = false;
const jsPsych = initJsPsych({
    on_finish: function() {
        if (submitted) showSubmission(jsPsych, debugEnabled);
    }
});

// Register before building/running any trial, including development screens.
jsPsych.data.addProperties({
    subject_id,
    agent_id: condition.agentNameMode === 'fixed' ? condition.fixedAgentName : null,
    ...Object.fromEntries(['PROLIFIC_PID', 'STUDY_ID', 'SESSION_ID'].filter(key => new URLSearchParams(window.location.search).has(key)).map(key => [key, new URLSearchParams(window.location.search).get(key)])),
    experiment_version: condition.version,
    customization_condition: condition.customizationCondition,
    predictability_condition: condition.predictabilityCondition
});

var timeline = [];

// ==========================================
// 1. DEVELOPMENT TOOLS (only with an explicit ?debug=1)
// ==========================================
let chose_calibration = false;

const main_menu = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="background:#0f172a; padding:40px; color:white; font-family:sans-serif; text-align:center; border-radius: 8px; max-width: 600px; margin: 40px auto; border: 1px solid #334155;">
            <h1 style="color:#deff9a; margin-top:0;">Development Tools</h1>
            <p>Version ${condition.version}; debug run (no upload).</p>
        </div>
    `,
    choices: ['Continue with URL version', 'Eyetracker Kalibrierung'],
    on_finish: function(data) { 
        if (data.response === 1) {
            chose_calibration = true; // Startet die Schleife für Kalibrierung neu
        } else {
            chose_calibration = false;
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
if (debugEnabled) timeline.push({
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

// All versions use the same beginning, without condition-dependent branches.
timeline.push(...createCommonBeginning(jsPsych));

// ==========================================
// 4. KI INTRO & CUSTOMIZATION
// =========================================

// 2. NEU: Erstes Textfenster (DA02 Aufgaben)
const standard_intro_new_1 = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        aiName = condition.fixedAgentName;
        
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

// Filled below after the shared mistakes/reminder screens have been defined.
const standardBranch = {
    timeline: [],
    conditional_function: function() { return !condition.customizationEnabled; }
};
timeline.push(standardBranch);

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
                jsPsych.data.addProperties({ agent_id: aiName });
                jsPsych.finishTrial({ agent_id: aiName });
            } else {
                errorMsg.style.display = 'block'; // Fehler anzeigen
            }
        });
    }
};

let disposeCustomization = () => {};
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
                <output id="order-${id}" style="font-size:14px;">${options.map(o => o.t).join(' → ')}</output>
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
                    <img id="preview-image" src="bilder/stimulus_001.jpg" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain;" />
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
                    ${makeRow(2, 'Background', 'bg', [{v:'dark', t:'dark'}, {v:'light', t:'light'}])}
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
        disposeCustomization = mountCustomizationPreview(jsPsych, aiName);
    },
    on_finish: function() { disposeCustomization(); }
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

standardBranch.timeline = [
    standard_intro_new_1, standard_intro_new_2,
    ...createStandardPreparation(jsPsych, EXPERIMENT_CONDITIONS[3].fixedAgentName),
    ai_mistakes_trial, ai_practice_reminder_trial
];

// Timeline Push mit den beiden neuen Screens anstelle des alten
timeline.push({
    timeline: [customization_intro_new_1, customization_intro_new_2, customization_name_trial, customization_settings_trial, ai_mistakes_trial, ai_practice_reminder_trial],
    conditional_function: function() { return condition.customizationEnabled; }
});


// Both phases are populated from one validated, offline-generated condition plan.
const aiPracticeTimeline = { timeline: [] };
const mainTaskTimeline = { timeline: [] };
timeline.push(aiPracticeTimeline);

// ==========================================
// 6. ABSCHLUSS-FRAGEBÖGEN (NACH DEM EXPERIMENT)
// ==========================================

const likert_scale = ["1 - Strongly Disagree", "2", "3", "4", "5", "6", "7 - Strongly Agree"];
const preamble_text = `<div style="max-width: 800px; margin: 0 auto; text-align: left; margin-bottom: 20px;"><p>We are interested in your perceptions of the agent.<br>Please take your time to answer the following questions based on your experiences so far. There are no right or wrong answers.<br><br>Please indicate the degree to which you personally agree or disagree with the following statements.</p></div>`;
const short_preamble = `<div style="max-width: 800px; margin: 0 auto; text-align: left; margin-bottom: 20px;"><p>Please indicate the degree to which you personally agree or disagree with the following statements.</p></div>`;

// Survey Likert 1.1.3 returns zero-based indices. Export only named 1–7 values.
function flattenLikertResponses(data, names) {
    const response = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
    const values = names.map(name => {
        const value = response && response[name];
        if (!Number.isInteger(value) || value < 0 || value > 6) {
            throw new Error(`Invalid Likert response: ${name}`);
        }
        return value + 1;
    });
    names.forEach((name, index) => { data[name] = values[index]; });
    delete data.response;
}

function createPerceptionSurvey(scale, prompts, prefix = 'pre', explicitNames = null) {
    const names = explicitNames || prompts.map((_, index) => `${prefix}_${scale}_${index + 1}`);
    return {
        type: jsPsychSurveyLikert,
        data: { phase: `${prefix}_perceptions`, scale },
        questions: prompts.map((prompt, index) => ({ prompt, name: names[index], labels: likert_scale, required: true })),
        randomize_question_order: false,
        button_label: 'Next',
        on_finish: data => flattenLikertResponses(data, names)
    };
}

timeline.push({
    timeline: [
        { type: jsPsychHtmlButtonResponse, stimulus: preamble_text, choices: ['Next'],
          data: { phase: 'pre_perceptions_intro' } },
        createPerceptionSurvey('ownership', [
            'The version of the agent that assists me with the defect detection is MY agent.',
            'I sense that the agent is MY agent.',
            'I feel a very high degree of ownership for the agent.',
            'It is hard for me to think about the agent as MINE.'
        ]),
        createPerceptionSurvey('satisfaction', [
            'I am satisfied with the agent I worked with.',
            'The agent I worked with meets my expectations.',
            'I like the agent I worked with.'
        ]),
        createPerceptionSurvey('trust', ['I trust the agent.', 'I can rely on the agent.']),
        { type: jsPsychHtmlButtonResponse,
          stimulus: () => `<p>After the practice phase, you will work with ${escapeAiHtml(condition.customizationEnabled ? aiName : condition.fixedAgentName)} on real defect detection.</p>`,
          choices: ['Start'], data: { phase: 'main_task_transition' } }
    ]
});
timeline.push(mainTaskTimeline);

// Post-task measures follow Main Trial 30 directly.
timeline.push(
    { type: jsPsychHtmlButtonResponse,
      stimulus: '<p>You have completed the inspection task. Please answer a few more questions about your experience.</p>',
      choices: ['Next'], data: { phase: 'post_task_intro' } },
    createPerceptionSurvey('satisfaction', [
        'I am satisfied with the agent I worked with.',
        'The agent I worked with meets my expectations.',
        'I like the agent I worked with.'
    ], 'post'),
    createPerceptionSurvey('trust', ['I trust the agent.', 'I can rely on the agent.'], 'post'),
    { type: jsPsychHtmlButtonResponse,
      stimulus: '<p>Now, imagine that you have submitted your classifications to your company. During routine quality assurance, a discrepancy was identified for one of the components you inspected: the recorded number of defects did not match the result of the follow-up examination. An experienced engineer has raised concerns about the accuracy of the defect detection for this component and about how it was classified. In short, they gave a negative evaluation of the classification for this component.</p>',
      choices: ['Next'], data: { phase: 'responsibility_scenario' } },
    createPerceptionSurvey('responsibility', [
        'I am personally responsible for the misclassified component.',
        'The AI agent is responsible for the misclassified component.'
    ], 'post', ['responsibility_self', 'responsibility_agent'])
);
// Final questionnaire: shared across all four conditions.
function createPatternQuestions(prefix, prompt) {
    let noticed = null;
    const noticedField = `${prefix}_noticed`, textField = `${prefix}_text`;
    return [
        { type: jsPsychHtmlButtonResponse, stimulus: `<p>${prompt}</p>`, choices: ['Yes', 'No'],
          data: { phase: 'final_patterns' },
          on_start: () => { noticed = null; },
          on_finish: data => {
              if (data.response !== 0 && data.response !== 1) throw new Error('Missing Yes/No response');
              noticed = data.response === 0 ? YES_NO_CODES.yes : YES_NO_CODES.no;
              data[noticedField] = noticed;
              data[textField] = null;
              delete data.response;
          } },
        { conditional_function: () => noticed === YES_NO_CODES.yes,
          timeline: [{ type: jsPsychSurveyText,
              questions: [{ prompt: 'Which pattern did you notice?', name: textField, required: true, rows: 4 }],
              button_label: 'Next', data: { phase: 'final_patterns' },
              on_finish: data => {
                  const response = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
                  if (typeof response?.[textField] !== 'string' || !response[textField].length) throw new Error('Missing pattern text');
                  data[noticedField] = noticed;
                  data[textField] = response[textField];
                  delete data.response;
              }
          }] }
    ];
}
const manipulation = createPerceptionSurvey('manipulation', [
    'I customized the agent before using it for the task.',
    'The agent I worked with was customized based on my instructions.',
    'The agent I worked with was customized based on my search strategy.',
    'The agent I worked with searched in the order I customized.',
    'The agent I worked with acted predictably.'
], 'final', ['manip_customized', 'manip_instructions', 'manip_search_strategy', 'manip_search_order', 'manip_predictable']);
const attitude = createPerceptionSurvey('attitude', [
    'To what extent do you think artificial intelligence will make this world a better place?',
    'How much would you like to use technologies that rely on artificial intelligence?',
    'To what extent do you look forward to future developments in the field of artificial intelligence?',
    'To what extent do you believe that artificial intelligence offers solutions to global problems?',
    'Do you have mostly positive feelings when you think about artificial intelligence?',
    'To what extent would you rather choose a technology with artificial intelligence than one without it?'
], 'ai');
attitude.questions.forEach(question => { question.labels = ['1 - Not at all', '2', '3', '4', '5', '6', '7 - Definitely']; });
timeline.push({ timeline: [
    { type: jsPsychHtmlButtonResponse,
      stimulus: '<p>Finally, please also answer the following questions and statements about the task and about your perceptions of AI.</p>',
      choices: ['Next'], data: { phase: 'final_questionnaire_intro' } },
    manipulation,
    ...createPatternQuestions('defect_pattern', 'Did you notice any pattern in where the defects tended to appear on the components?'),
    ...createPatternQuestions('ai_error_pattern', 'Did you notice any pattern in what kind of findings the agent tended to get wrong?'),
    attitude
] });

// 6.5 Outro
const outro_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<p>Thank you very much for taking part in this study. Your responses have been recorded, please click Submit to finish.</p>',
    choices: ['Submit'],
    data: { phase: 'submission' },
    on_finish: data => { submitted = true; data.submitted = true; }

};
timeline.push(outro_trial);

loadAiResources(condition, { allowValidatedPartial: debugEnabled }).then(resources => {
    for (const { plan, symbols } of resources) {
        const trial = createAiTrial({ jsPsych, plan, symbols, condition,
            getAgentId: () => aiName,
            getSearchOrder: () => condition.customizationEnabled
                ? participantCustomization : buildCustomization(STANDARD_SEARCH_STARTS) });
        (plan.phase === 'ai_practice' ? aiPracticeTimeline : mainTaskTimeline).timeline.push(trial);
    }
    jsPsych.run(timeline);
}).catch(error => {
    document.body.innerHTML = `<main style="max-width:800px;margin:15vh auto;font-family:sans-serif;"><h1>Configuration error</h1><p>${escapeAiHtml(error.message)}</p></main>`;
});
})();
