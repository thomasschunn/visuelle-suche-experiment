const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function boot(search) {
    const calls = { initialized: 0, properties: {}, timeline: null, events: [] };
    const context = vm.createContext({ crypto: require('node:crypto').webcrypto,
        URLSearchParams,
        window: { location: { search } },
        document: { body: { innerHTML: '' } },
        jsPsychHtmlButtonResponse: 'button',
        jsPsychSurveyLikert: 'likert',
        jsPsychSurveyText: 'text',
        initJsPsych(options) {
            calls.initialized++;
            calls.finish = options.on_finish;
            return {
                data: {
                    addProperties(properties) {
                        Object.assign(calls.properties, properties);
                        calls.events.push('properties');
                    },
                    displayData() { calls.displayed = true; }
                },
                run(timeline) { calls.timeline = timeline; calls.events.push('run'); }
            };
        }
    });
    for (const file of ['conditions.js', 'config.js', 'functions.js', 'common-start.js', 'customization.js', 'standard.js', 'ai-trial.js', 'storage.js', 'experiment.js']) {
        if (file === 'experiment.js') {
            context.loadAiResources = () => ({ then(fn) {
                fn(Array.from({ length: 40 }, (_, i) => ({ plan: {
                    phase: i < 10 ? 'ai_practice' : 'main_task', trial_index: i < 10 ? i + 1 : i - 9
                }, symbols: [] })));
                return { catch() {} };
            } });
            // Existing introduction/preview tests isolate the AI implementation, tested separately.
            context.createAiTrial = ({ plan }) => ({ type: 'button', data: plan,
                stimulus: () => 'stimulus_001.jpg DA02' });
        }
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    }
    return { calls, context };
}

test('unique UUID, optional Prolific fields and Submit gate', () => {
    const a = boot('?version=1&PROLIFIC_PID=p&STUDY_ID=s&SESSION_ID=x');
    const b = boot('?version=1');
    assert.match(a.calls.properties.subject_id, /^[0-9a-f-]{36}$/);
    assert.notEqual(a.calls.properties.subject_id, b.calls.properties.subject_id);
    assert.equal(a.calls.properties.PROLIFIC_PID, 'p');
    assert.equal(a.calls.properties.STUDY_ID, 's');
    assert.equal(a.calls.properties.SESSION_ID, 'x');
    assert.equal(b.calls.properties.PROLIFIC_PID, undefined);
    let uploads = 0;
    a.context.showSubmission = () => uploads++;
    a.calls.finish(); assert.equal(uploads, 0);
    const submit = a.calls.timeline.at(-1);
    assert.equal(submit.stimulus, '<p>Thank you very much for taking part in this study. Your responses have been recorded, please click Submit to finish.</p>');
    assert.equal(submit.choices[0], 'Submit');
    submit.on_finish({}); a.calls.finish(); assert.equal(uploads, 1);
});

for (const [version, customization, predictability] of [
    [1, true, 'low'], [2, true, 'high'], [3, false, 'low'], [4, false, 'high']
]) {
    test(`?version=${version}: metadata, flow and agent name`, () => {
        const { calls, context } = boot(`?version=${version}`);
        assert.deepEqual(calls.properties, {
            subject_id: calls.properties.subject_id,
            agent_id: customization ? null : 'DA02',
            experiment_version: version,
            customization_condition: customization ? 'customization' : 'standard',
            predictability_condition: predictability
        });
        assert.deepEqual(calls.events, ['properties', 'run']);
        const definition = vm.runInContext(`EXPERIMENT_CONDITIONS[${version}]`, context);
        assert.equal(definition.customizationEnabled, customization);
        assert.equal(definition.agentNameMode, customization ? 'participant' : 'fixed');
        assert.equal(definition.fixedAgentName, customization ? null : 'DA02');
        assert.ok(Object.isFrozen(definition));
        // No development loop/menu or admin configuration in normal runs.
        assert.ok(calls.timeline.every(node => !node.loop_function));
        assert.ok(calls.timeline[0].timeline[0].stimulus.includes('glasses'));
        assert.equal(calls.timeline[1].timeline.length, 5); // training retained
        assert.equal(calls.timeline[3].conditional_function(), !customization);
        assert.equal(calls.timeline[4].conditional_function(), customization);
        // Version 3 must not accidentally become the legacy admin mode.
        const roundHtml = calls.timeline[5].timeline[0].stimulus();
        assert.ok(!roundHtml.includes('admin-next-btn'));
        if (!customization) assert.ok(roundHtml.includes('DA02'));
    });
}

for (const search of ['', '?version=', '?version=0', '?version=5', '?version=abc',
    '?version=01', '?version=1.0', '?version=1&version=2', '?version=1&version=1',
    '?debug=1', '?debug=1&version=bad']) {
    test(`${search || '(no query)'}: configuration error without experiment start`, () => {
        const { calls, context } = boot(search);
        assert.equal(calls.initialized, 0);
        assert.equal(calls.timeline, null);
        assert.match(context.document.body.innerHTML, /Configuration error/);
    });
}

test('explicit debug tools retain URL condition during calibration without skipping trials', () => {
    const { calls } = boot('?version=3&debug=1');
    const tools = calls.timeline[0];
    const menu = tools.timeline[0];
    assert.equal(menu.choices.length, 2);
    menu.on_finish({ response: 1 });
    assert.equal(tools.loop_function(), true);
    assert.equal(tools.timeline[1].conditional_function(), true);
    menu.on_finish({ response: 0 });
    assert.equal(tools.loop_function(), false);
    assert.ok(calls.timeline[1].timeline[0].stimulus.includes('glasses'));
    assert.equal(calls.timeline[2].timeline.length, 5);
    assert.ok(calls.timeline[6].timeline[0].stimulus().includes('stimulus_001.jpg'));
    assert.equal(calls.properties.experiment_version, 3);
    assert.equal(calls.properties.customization_condition, 'standard');
    calls.finish(); // Debug completion must not upload.
    assert.equal(calls.displayed, undefined); // No completion action before Submit.
});

for (const flag of ['debug=0', 'debug=true', 'debug=01', 'debug=1&debug=0']) {
    test(`${flag}: no development menu`, () => {
        const { calls } = boot(`?version=1&${flag}`);
        assert.ok(calls.timeline.every(node => !node.loop_function));
    });
}

test('HTML loads condition definitions before the experiment', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.ok(html.indexOf('src="conditions.js"') < html.indexOf('src="experiment.js"'));
});
