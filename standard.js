/** Supplied question wording is verbatim; reference checkbox layout is still missing. */
function createStandardPreparation(jsPsych, agentId) {
    const settings = buildCustomization(STANDARD_SEARCH_STARTS);
    let disposePreview = () => {};
    let selected = null;
    const options = [
        { id: 'name', label: 'The agent‘s name', prompt: 'How would you change the agent‘s name?' },
        { id: 'search_strategy', label: 'The agent‘s search strategy', prompt: 'How would you change the agent‘s search strategy?' },
        { id: 'other', label: 'Something else', prompt: 'What else would you change and how?' },
        { id: 'none', label: 'I wouldn‘t change anything' }
    ];
    const preview = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `<div class="experiment-container">
            <div id="preview-image-wrapper" class="image-container">
                <img id="preview-image" src="bilder/stimulus_001.jpg" style="width:100%;height:100%;object-fit:contain;" />
            </div>
            <div class="right-column">
                <div class="ki-panel"><h3>${agentId}</h3>
                    ${Object.entries(settings).map(([key, value]) => `<p>${key[0].toUpperCase() + key.slice(1)}: ${value.order.map(v => v.replaceAll('_', ' ')).join(' → ')}</p>`).join('')}
                    <div id="status-text">Ready for configuration...</div>
                </div>
                <div class="button-container">
                    <button id="preview-btn" class="action-btn btn-start">Preview</button>
                    <button id="proceed-btn" class="action-btn btn-start">Proceed</button>
                </div>
            </div>
        </div>`,
        choices: [],
        on_load() {
            jsPsych.data.addProperties({ agent_id: agentId });
            disposePreview = mountSearchPreview(jsPsych, agentId, settings);
        },
        on_finish() { disposePreview(); }
    };
    const changeQuestion = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `<div style="max-width:800px;margin:40px auto;text-align:left;">
            <p>If you were able to change anything about the agent‘s features to improve it, what would it be?</p>
            ${options.map(option => `<label style="display:block;margin:18px 0;"><input type="radio" name="standard-change" value="${option.id}"> ${option.label}</label>`).join('')}
            <button id="standard-change-next" class="action-btn btn-start">Next</button>
        </div>`,
        choices: [],
        on_load() {
            let submitted = false;
            document.getElementById('standard-change-next').addEventListener('click', () => {
                if (submitted) return;
                const input = document.querySelector('input[name="standard-change"]:checked');
                const option = options.find(option => option.id === input?.value);
                if (!option) return;
                submitted = true;
                selected = option.id;
                const data = {
                    agent_id: agentId,
                    standard_change_options: JSON.stringify([option.id]),
                    standard_change_option_labels: JSON.stringify([option.label]),
                    standard_change_name_text: null,
                    standard_change_search_strategy_text: null,
                    standard_change_other_text: null
                };
                jsPsych.data.addProperties(data);
                jsPsych.finishTrial(data);
            });
        }
    };
    const followups = options.filter(option => option.prompt).map(option => {
        const field = `standard_change_${option.id}_text`;
        return {
            timeline: [{
                type: jsPsychSurveyText,
                questions: [{ prompt: option.prompt, name: field, rows: 5 }],
                button_label: 'Next',
                on_finish(data) {
                    const text = data.response[field];
                    data[field] = text;
                    jsPsych.data.addProperties({ [field]: text });
                }
            }],
            conditional_function() { return selected === option.id; }
        };
    });
    return [preview, changeQuestion, ...followups];
}
