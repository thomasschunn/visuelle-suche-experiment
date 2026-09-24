const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('AI ring diameter is 25% smaller at unchanged symbol coordinates', () => {
    const rings = [];
    const container = { getBoundingClientRect: () => ({ width: 960 }), appendChild: ring => rings.push(ring) };
    const context = vm.createContext({
        ORIGINAL_BILD_BREITE: 1920,
        document: { getElementById: () => container, createElement: () => ({ style: {}, classList: { add() {} } }) }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'functions.js'), 'utf8'), context);
    vm.runInContext("renderRing('image', 100, 200, 'groß'); renderRing('image', 100, 200, 'klein');", context);
    assert.ok(Math.abs(parseFloat(rings[0].style.width) - 45.6) < 0.001);
    assert.ok(Math.abs(parseFloat(rings[1].style.width) - 28.8) < 0.001);
    for (const ring of rings) {
        assert.equal(ring.style.left, '50px');
        assert.equal(ring.style.top, '100px');
    }
});

function element() {
    const classes = new Set();
    return {
        style: { setProperty(name, value) { this[name] = value; } },
        children: [], handlers: {}, complete: true, naturalWidth: 1920, naturalHeight: 1080,
        classList: {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: name => classes.delete(name), contains: name => classes.has(name)
        },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 960 }),
        appendChild(child) { this.children.push(child); child.parent = this; },
        remove() { this.parent.children = this.parent.children.filter(child => child !== this); },
        addEventListener(name, fn) { this.handlers[name] = fn; },
        querySelectorAll(selector) { return this.children.filter(child => child.classList.contains(selector.slice(1))); },
        click(event = {}) { this.handlers.click?.({ target: this, stopPropagation() {}, ...event }); }
    };
}

function setup(version = 1) {
    const ids = new Map();
    const timers = new Map();
    const requests = [];
    const finished = [];
    const properties = {};
    const delays = [];
    let timeline;
    let nextTimer = 0;
    let now = 0;
    const document = {
        body: element(), createElement: element,
        getElementById(id) {
            if (!ids.has(id)) ids.set(id, element());
            return ids.get(id);
        },
        querySelectorAll() { return []; }
    };
    const context = vm.createContext({ crypto: require('node:crypto').webcrypto,
        document, URLSearchParams, performance: { now: () => now }, window: { location: { search: `?version=${version}` } },
        jsPsychHtmlButtonResponse: 'button', jsPsychSurveyText: 'text', jsPsychSurveyLikert: 'likert',
        Papa: { parse(_url, options) { requests.push(options); } },
        setInterval(fn, ms) { const id = ++nextTimer; timers.set(id, fn); delays.push(ms); return id; },
        clearInterval(id) { timers.delete(id); },
        initJsPsych() {
            return { data: { addProperties(data) { Object.assign(properties, data); } }, run(value) { timeline = value; },
                finishTrial(data) { finished.push(data); } };
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
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    function tick(count) {
        for (let i = 0; i < count; i++) [...timers.values()].forEach(fn => fn());
    }
    return { context, document, timeline, requests, finished, timers, tick, properties, delays,
        advance(ms) { now += ms; }, resetDOM() { ids.clear(); } };
}

// Synthetic fixtures for control-flow tests, not experimental specifications.
for (const version of [1, 2, 3, 4]) {
    for (const first of [0, 1]) for (const second of [0, 1]) {
        test(`v${version}: final patterns ${first}/${second} require text only for Yes`, () => {
            const s = setup(version), block = s.timeline[13].timeline;
            assert.equal(block.length, 7);
            assert.equal(block[0].stimulus, '<p>Finally, please also answer the following questions and statements about the task and about your perceptions of AI.</p>');
            for (const [index, answer, prefix, prompt] of [
                [2, first, 'defect_pattern', 'Did you notice any pattern in where the defects tended to appear on the components?'],
                [4, second, 'ai_error_pattern', 'Did you notice any pattern in what kind of findings the agent tended to get wrong?']
            ]) {
                const question = block[index], follow = block[index + 1];
                question.on_start();
                assert.equal(follow.conditional_function(), false);
                assert.equal(question.stimulus, `<p>${prompt}</p>`);
                assert.deepEqual(Array.from(question.choices), ['Yes', 'No']);
                assert.throws(() => question.on_finish({}), /Missing Yes\/No/);
                const row = { response: answer };
                question.on_finish(row);
                assert.deepEqual(row, { [`${prefix}_noticed`]: answer + 1, [`${prefix}_text`]: null });
                assert.equal(follow.conditional_function(), answer === 0);
                if (answer === 0) {
                    const text = follow.timeline[0];
                    assert.equal(text.questions[0].prompt, 'Which pattern did you notice?');
                    assert.equal(text.questions[0].required, true);
                    assert.throws(() => text.on_finish({response:{[`${prefix}_text`]:''}}), /Missing pattern text/);
                    const detail = {response:{[`${prefix}_text`]:'My observed pattern'}};
                    text.on_finish(detail);
                    assert.deepEqual(detail, {[`${prefix}_noticed`]:1, [`${prefix}_text`]:'My observed pattern'});
                }
                question.on_start();
                assert.equal(follow.conditional_function(), false);
            }
            const manipNames = ['manip_customized','manip_instructions','manip_search_strategy','manip_search_order','manip_predictable'];
            assert.deepEqual(Array.from(block[1].questions, q => q.name), manipNames);
            assert.equal(block[1].questions[3].prompt, 'The agent I worked with searched in the order I customized.');
            assert.equal(block[1].questions[4].prompt, 'The agent I worked with acted predictably.');
            for (const survey of [block[1], block[6]]) {
                assert.equal(survey.button_label, 'Next');
                assert.ok(survey.questions.every(q => q.required));
                assert.throws(() => survey.on_finish({response:{}}), /Invalid Likert/);
                for (let raw = 0; raw < 7; raw++) {
                    const row = {response:Object.fromEntries(survey.questions.map(q => [q.name,raw]))};
                    survey.on_finish(row);
                    assert.ok(!('response' in row));
                    assert.ok(Object.values(row).every(value => value === raw + 1));
                }
            }
            assert.deepEqual(Array.from(block[6].questions, q => q.name), Array.from({length:6}, (_, i) => `ai_attitude_${i+1}`));
            assert.equal(block[6].questions[0].labels[0], '1 - Not at all');
            assert.equal(block[6].questions[0].labels[6], '7 - Definitely');
        });
    }
}

for (const version of [1, 3]) {
    test(`v${version}: Main Trial 30 leads directly to exact post measures`, () => {
        const s = setup(version);
        const main = s.timeline[7].timeline;
        assert.deepEqual(Array.from(main, t => t.data.trial_index), Array.from({length:30}, (_, i) => i + 1));
        assert.ok(main.every(t => t.data.phase === 'main_task'));
        const [intro, satisfaction, trust, scenario, responsibility] = s.timeline.slice(8, 13);
        assert.equal(intro.stimulus, '<p>You have completed the inspection task. Please answer a few more questions about your experience.</p>');
        assert.equal(intro.choices[0], 'Next');
        assert.equal(scenario.stimulus, '<p>Now, imagine that you have submitted your classifications to your company. During routine quality assurance, a discrepancy was identified for one of the components you inspected: the recorded number of defects did not match the result of the follow-up examination. An experienced engineer has raised concerns about the accuracy of the defect detection for this component and about how it was classified. In short, they gave a negative evaluation of the classification for this component.</p>');
        assert.equal(scenario.choices[0], 'Next');
        assert.deepEqual(Array.from(satisfaction.questions, q => q.prompt), Array.from(s.timeline[6].timeline[2].questions, q => q.prompt));
        assert.deepEqual(Array.from(trust.questions, q => q.prompt), Array.from(s.timeline[6].timeline[3].questions, q => q.prompt));
        assert.deepEqual(Array.from(responsibility.questions, q => q.prompt), ['I am personally responsible for the misclassified component.', 'The AI agent is responsible for the misclassified component.']);
        for (const [survey, names] of [[satisfaction, ['post_satisfaction_1','post_satisfaction_2','post_satisfaction_3']], [trust, ['post_trust_1','post_trust_2']], [responsibility, ['responsibility_self','responsibility_agent']]]) {
            assert.deepEqual(Array.from(survey.questions, q => q.name), names);
            for (let raw = 0; raw <= 6; raw++) {
                const row = { response: Object.fromEntries(names.map(n => [n, raw])) };
                survey.on_finish(row);
                assert.deepEqual(row, Object.fromEntries(names.map(n => [n, raw + 1])));
            }
            assert.equal(survey.button_label, 'Next');
            assert.ok(survey.questions.every(q => q.required && q.labels.length === 7));
        }
        for (const trial of [intro, satisfaction, trust, scenario, responsibility]) assert.equal(trial.trial_duration, undefined);
    });
}

for (const version of [1, 3]) {
    test(`v${version}: reminder, ten practices, perception scales and named Main transition`, () => {
        const s = setup(version);
        if (version === 1) {
            s.timeline[4].timeline[2].on_load();
            s.document.getElementById('ai-name-input').value = 'xy42';
            s.document.getElementById('save-name-btn').click();
        }
        const branch = s.timeline[version === 1 ? 4 : 3];
        const reminder = branch.timeline.at(-1);
        assert.match(reminder.stimulus(), /Now you can practice/);
        reminder.on_load();
        const before = s.finished.length;
        s.document.getElementById('next-btn-2').click();
        assert.equal(s.finished.length, before + 1);
        assert.deepEqual(Array.from(s.timeline[5].timeline, t => t.data.trial_index), [1,2,3,4,5,6,7,8,9,10]);
        assert.ok(s.timeline[5].timeline.every(t => t.data.phase === 'ai_practice'));
        const [intro, ownership, satisfaction, trust, transition] = s.timeline[6].timeline;
        assert.match(intro.stimulus, /We are interested in your perceptions of the agent/);
        assert.equal(intro.choices[0], 'Next');
        assert.deepEqual(Array.from(ownership.questions, q => q.prompt), [
            'The version of the agent that assists me with the defect detection is MY agent.',
            'I sense that the agent is MY agent.',
            'I feel a very high degree of ownership for the agent.',
            'It is hard for me to think about the agent as MINE.'
        ]);
        assert.deepEqual(Array.from(satisfaction.questions, q => q.prompt), [
            'I am satisfied with the agent I worked with.', 'The agent I worked with meets my expectations.', 'I like the agent I worked with.'
        ]);
        assert.deepEqual(Array.from(trust.questions, q => q.prompt), ['I trust the agent.', 'I can rely on the agent.']);
        for (const survey of [ownership, satisfaction, trust]) {
            assert.equal(survey.button_label, 'Next');
            for (let raw = 0; raw <= 6; raw++) {
                const data = { response: Object.fromEntries(survey.questions.map(q => [q.name, raw])) };
                survey.on_finish(data);
                assert.ok(!('response' in data));
                for (const q of survey.questions) {
                    assert.equal(data[q.name], raw + 1);
                    assert.ok(q.required);
                    assert.equal(q.labels[0], '1 - Strongly Disagree');
                    assert.equal(q.labels[6], '7 - Strongly Agree');
                }
            }
            assert.throws(() => survey.on_finish({ response: {} }), /Invalid Likert/);
        }
        assert.equal(transition.stimulus(), `<p>After the practice phase, you will work with ${version === 1 ? 'XY42' : 'DA02'} on real defect detection.</p>`);
        assert.equal(transition.choices[0], 'Start');
        assert.equal(s.timeline[7].timeline[0].data.phase, 'main_task');
        assert.equal(s.timers.size, 0);
    });
}

function markedLetter(overrides = {}) {
    return { shape: 'L', center_x: 100, center_y: 200, color_hex: '#0064FF',
        is_small: false, bg_dark: true, bekommt_kreis: true, ...overrides };
}

for (const decision of ['Pass', 'Reject']) {
    test(`training markers remain removable; training ends only with ${decision}`, () => {
        const s = setup();
        s.timeline[1].timeline[0].on_load();
        const wrapper = s.document.getElementById('image-wrapper');
        wrapper.click({ clientX: 150, clientY: 250 });
        const marker = wrapper.children[0];
        assert.equal(marker.style.pointerEvents, 'auto');
        assert.ok(marker.classList.contains('training-marker'));
        marker.click();
        assert.equal(wrapper.children.length, 0);
        s.tick(1000);
        assert.equal(s.finished.length, 0);
        s.document.getElementById(`btn-${decision.toLowerCase()}`).click();
        assert.equal(s.finished[0].participant_verdict, decision.toLowerCase());
        assert.equal(s.finished[0].phase, 'manual_training');
    });
}

test('context information waits for its Next button', () => {
    const s = setup();
    s.timeline[0].timeline[1].on_load();
    s.tick(1000);
    assert.equal(s.finished.length, 0);
    s.document.body.click();
    assert.equal(s.finished.length, 0);
    s.document.getElementById('custom-next-btn').click();
    assert.equal(s.finished.length, 1);
});

test('no timed trial or fixation node anywhere in the participant timeline', () => {
    const s = setup();
    function inspect(nodes) {
        for (const node of nodes) {
            assert.ok(!Object.hasOwn(node, 'trial_duration'));
            if (node.timeline) inspect(node.timeline);
        }
    }
    inspect(s.timeline);
    assert.equal(s.timeline[5].timeline.length, 10);
    assert.equal(s.timeline[7].timeline.length, 30);
});

for (const version of [1, 2, 3, 4]) {
    for (const verdict of ['pass', 'reject']) {
        test(`version ${version}: all five training trials record ${verdict}, RT and remaining markers`, () => {
            const s = setup(version);
            const trials = s.timeline[1].timeline;
            assert.equal(trials.length, 5);
            trials.forEach((trial, index) => {
                s.resetDOM();
                assert.equal(trial.data.phase, 'manual_training');
                assert.ok(!trial.stimulus.includes('ki-panel'));
                assert.ok(!trial.stimulus.includes('SCANNING'));
                assert.ok(trial.stimulus.includes('class="image-container trial-image-container"'));
                const id = `stimulus_training_${String(index + 1).padStart(3, '0')}`;
                const imagePath = path.join('data', 'generated', 'assets', `manual_training_${String(index + 1).padStart(3, '0')}`, 'stimulus.jpg');
                assert.ok(trial.stimulus.includes(imagePath.replaceAll(path.sep, '/')));
                assert.ok(fs.existsSync(path.join(__dirname, '..', imagePath)));
                trial.on_load();
                const wrapper = s.document.getElementById('image-wrapper');
                wrapper.click({ clientX: 100, clientY: 200 });
                wrapper.click({ clientX: 300, clientY: 400 });
                wrapper.click({ clientX: 500, clientY: 600 });
                wrapper.children[1].click();
                s.tick(1000);
                assert.equal(s.finished.length, index);
                s.advance(1234 + index);
                s.document.getElementById(`btn-${verdict}`).click();
                const row = s.finished[index];
                assert.equal(row.phase, 'manual_training');
                assert.equal(row.trial_index, index + 1);
                assert.equal(row.stimulus_id, id);
                assert.equal(row.participant_verdict, verdict);
                assert.equal(row.participant_verdict_code, verdict === 'pass' ? 1 : 2);
                assert.equal(row.rt, 1234 + index);
                assert.equal(row.manual_marker_count_at_response, 2);
                row.trial_index = 99; // Simulate jsPsych's global index before on_finish.
                trial.on_finish(row);
                assert.equal(row.trial_index, index + 1);
                s.document.getElementById(`btn-${verdict}`).click();
                assert.equal(s.finished.length, index + 1);
            });
            assert.equal(s.requests.length, 0);
            assert.equal(s.timers.size, 0);
        });
    }
}

test('identical beginning in every version, exact supplied task wording and button transition', () => {
    const baseline = setup(1);
    const html = baseline.timeline.slice(0, 3).flatMap(node => node.timeline.map(trial => trial.stimulus));
    assert.equal(html.length, 10);
    for (const version of [2, 3, 4]) {
        assert.equal(JSON.stringify(setup(version).timeline.slice(0, 3).flatMap(node => node.timeline.map(trial => trial.stimulus))), JSON.stringify(html));
    }
    assert.match(html[0], /glasses or contacts/);
    assert.match(html[1], /Context/);
    const task = html[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
    assert.ok(task.includes('An L or an O is a defect. Ignore all other letters.'));
    assert.ok(task.includes('Orange and blue letters as well as large and small ones are equally important.'));
    assert.ok(task.includes('Flag a component as reject if it contains more than 10 defects. Otherwise, flag it as pass.'));
    assert.match(html[3], /Next, you will practice the task/);
    assert.match(html[9], /You have finished the practice\./);
    baseline.timeline[2].timeline[0].on_load();
    assert.equal(baseline.finished.length, 0);
    baseline.document.getElementById('next-btn-practice-done').click();
    assert.equal(baseline.finished.length, 1);
});

test('training waits for successful image loading and starts RT once, without a time limit', () => {
    const s = setup();
    const image = s.document.getElementById('training-image');
    image.complete = false;
    image.naturalWidth = 0;
    s.timeline[1].timeline[0].on_load();
    s.advance(9000);
    s.document.getElementById('btn-pass').click();
    assert.equal(s.finished.length, 0);
    image.naturalWidth = 1000;
    image.naturalHeight = 800;
    image.handlers.load();
    assert.equal(s.document.getElementById('image-wrapper').style['aspect-ratio'], '1000 / 800');
    s.advance(250);
    image.handlers.load();
    s.advance(250);
    s.document.getElementById('btn-pass').click();
    assert.equal(s.finished[0].rt, 500);
    assert.equal(s.finished[0].manual_marker_count_at_response, 0);
});

function previewRows() {
    const [header, ...lines] = fs.readFileSync(path.join(__dirname, '..', 'tabellen/stimulus_001.csv'), 'utf8').trim().split(/\r?\n/);
    return lines.map(line => Object.fromEntries(line.split(',').map((value, i) =>
        [header.split(',')[i], value !== '' && Number.isFinite(Number(value)) ? Number(value) : value])));
}

for (const version of [1, 2]) {
    test(`version ${version}: agent ID validation, three Apply runs and final persistence`, () => {
        const s = setup(version);
        const branch = s.timeline[4];
        assert.equal(branch.conditional_function(), true);
        assert.equal(branch.timeline.length, 6);
        branch.timeline[2].on_load();
        const input = s.document.getElementById('ai-name-input');
        for (const invalid of ['', 'A01', 'AI1', '12AI', 'AI001', 'A!01']) {
            input.value = invalid;
            s.document.getElementById('save-name-btn').click();
            assert.equal(s.finished.length, 0);
        }
        input.value = 'aI01';
        s.document.getElementById('save-name-btn').click();
        assert.equal(s.properties.agent_id, 'AI01');
        assert.equal(s.finished[0].agent_id, 'AI01');
        assert.ok(branch.timeline[3].stimulus().includes('AI01'));
        ['bottom_right', 'light', 'small', 'O'].forEach((value, i) => { s.document.getElementById(`val-${i + 1}`).value = value; });
        branch.timeline[3].on_load();
        assert.equal(s.document.getElementById('order-1').textContent, 'bottom right → bottom left → top left → top right');
        assert.equal(s.document.getElementById('order-2').textContent, 'light → dark');
        assert.equal(s.document.getElementById('order-3').textContent, 'small → large');
        assert.equal(s.document.getElementById('order-4').textContent, 'O → L');
        const wrapper = s.document.getElementById('preview-image-wrapper');
        for (let run = 0; run < 3; run++) {
            s.document.getElementById('apply-btn').click();
            assert.equal(wrapper.children.length, 0);
            assert.ok(s.document.getElementById('status-text').textContent.includes('small Os on light areas in the bottom right'));
            s.requests[run].complete({ data: previewRows(), errors: [] });
            assert.equal(s.delays[run], 180);
            s.tick(1);
            assert.equal(s.document.getElementById('status-text').textContent, '... searching ...\nbottom right → light → small → O');
            s.document.getElementById('proceed-btn').click();
            assert.equal(s.finished.length, 1);
            s.tick(30);
            assert.equal(s.document.getElementById('apply-btn').disabled, true);
            s.tick(1);
            assert.equal(s.timers.size, 0);
            assert.equal(wrapper.children.length, 14);
            assert.ok(wrapper.children.every(ring => ring.style.pointerEvents === 'none' && !ring.handlers.click));
            assert.equal(s.document.getElementById('status-text').textContent, 'Final verdict: 14 defects');
            assert.equal(s.document.getElementById('apply-btn').disabled, false);
            assert.equal(s.document.getElementById('proceed-btn').disabled, false);
        }
        // Proceed reads current settings, even when they were not used in the last Apply.
        s.document.getElementById('val-2').value = 'dark';
        s.document.getElementById('proceed-btn').click();
        assert.equal(s.finished.length, 2);
        assert.equal(s.properties.custom_background_start, 'dark');
        assert.deepEqual(JSON.parse(s.properties.custom_background_order), ['dark', 'light']);
        assert.deepEqual(JSON.parse(s.properties.custom_direction_order), ['bottom_right', 'bottom_left', 'top_left', 'top_right']);
        for (const key of ['direction', 'background', 'size', 'type']) {
            assert.ok(s.properties[`custom_${key}_start`]);
            assert.ok(s.properties[`custom_${key}_order`]);
        }
        assert.equal(vm.runInContext('participantCustomization.background.start', s.context), 'dark');
        s.document.getElementById('proceed-btn').click();
        assert.equal(s.finished.length, 2);
    });
}

test('preview reveals rings in selected order across visible steps and resets on Apply', () => {
    const s = setup(1);
    ['bottom_right', 'light', 'small', 'O'].forEach((value, i) => { s.document.getElementById(`val-${i + 1}`).value = value; });
    s.timeline[4].timeline[3].on_load();
    const apply = s.document.getElementById('apply-btn');
    const wrapper = s.document.getElementById('preview-image-wrapper');
    const rows = ['O', 'L'].map(shape => ({ shape, center_x: 1500, center_y: 800,
        bg_dark: false, is_small: true, bekommt_kreis: true }));
    apply.click();
    s.requests[0].complete({ data: rows, errors: [] });
    assert.equal(wrapper.children.length, 0);
    s.tick(1);
    assert.equal(wrapper.children.length, 1);
    assert.match(s.document.getElementById('status-text').textContent, /bottom right → light → small → O/);
    assert.equal(apply.disabled, true);
    s.tick(1);
    assert.equal(wrapper.children.length, 2);
    assert.match(s.document.getElementById('status-text').textContent, /bottom right → light → small → L/);
    s.tick(30);
    assert.equal(s.finished.length, 0);
    assert.equal(apply.disabled, false);
    s.document.getElementById('val-4').value = 'L';
    apply.click();
    assert.equal(wrapper.children.length, 0);
    s.requests[1].complete({ data: rows, errors: [] });
    s.tick(1);
    assert.match(s.document.getElementById('status-text').textContent, /bottom right → light → small → L/);
    assert.equal(wrapper.children.length, 1);
    s.timeline[4].timeline[3].on_finish();
    assert.equal(s.timers.size, 0);
});

test('preview rings follow the displayed image box when contain adds margins', () => {
    const s = setup(1);
    ['top_left', 'dark', 'large', 'L'].forEach((value, i) => {
        s.document.getElementById(`val-${i + 1}`).value = value;
    });
    const image = s.document.getElementById('preview-image');
    image.clientWidth = 960;
    image.clientHeight = 600;
    s.timeline[4].timeline[3].on_load();
    s.document.getElementById('apply-btn').click();
    s.requests[0].complete({ data: [{ shape: 'L', center_x: 960, center_y: 540,
        bg_dark: true, is_small: false, bekommt_kreis: true }], errors: [] });
    s.tick(32);
    const ring = s.document.getElementById('preview-image-wrapper').children[0];
    assert.equal(ring.style.left, '480px');
    assert.equal(ring.style.top, '300px');
});

test('all 32 starting selections generate 32 unique ordered combinations', () => {
    const s = setup();
    const result = vm.runInContext(`(() => {
        const results = [];
        for (const direction of CUSTOMIZATION_DIMENSIONS.direction)
        for (const background of CUSTOMIZATION_DIMENSIONS.background)
        for (const size of CUSTOMIZATION_DIMENSIONS.size)
        for (const type of CUSTOMIZATION_DIMENSIONS.type) {
            const starts = {direction, background, size, type};
            const steps = customizationCombinations(buildCustomization(starts));
            results.push({starts, steps});
        }
        return JSON.stringify(results);
    })()`, s.context);
    const selections = JSON.parse(result);
    assert.equal(selections.length, 32);
    selections.forEach(({ starts, steps }) => {
        assert.deepEqual(steps[0], starts);
        assert.equal(steps.length, 32);
        assert.equal(new Set(steps.map(step => JSON.stringify(step))).size, 32);
    });
});

for (const version of [1, 3]) {
    test(`v${version}: preview accepts source CSV trailing newline but still rejects CSV errors`, () => {
        const s = setup(version);
        ['top_left', 'dark', 'large', 'L'].forEach((value, i) => { s.document.getElementById(`val-${i + 1}`).value = value; });
        const psych = { data: { addProperties() {} }, finishTrial() {} };
        const fixed = version === 3 ? vm.runInContext('buildCustomization(STANDARD_SEARCH_STARTS)', s.context) : null;
        s.context.mountSearchPreview(psych, 'AI01', fixed);
        const button = s.document.getElementById(version === 1 ? 'apply-btn' : 'preview-btn');
        const csv = fs.readFileSync(path.join(__dirname, '..', 'tabellen/stimulus_001.csv'), 'utf8');
        assert.match(csv, /\r?\n$/);
        button.click();
        // PapaParse reports TooFewFields for the final empty record unless this option is set.
        assert.equal(s.requests[0].skipEmptyLines, true);
        s.requests[0].complete({ data: previewRows(), errors: [] });
        s.tick(32);
        assert.equal(s.document.getElementById('status-text').textContent, 'Final verdict: 14 defects');
        assert.equal(button.disabled, false);
        button.click();
        s.requests[1].complete({ data: previewRows(), errors: [{ code: 'TooFewFields', row: 2 }] });
        s.tick(32);
        assert.equal(s.document.getElementById('status-text').textContent, 'Preview could not be loaded.');
        assert.equal(s.timers.size, 0);
        assert.equal(button.disabled, false);
    });
}

test('preview retries after loading failure and ignores responses after screen exit', () => {
    const s = setup();
    ['top_left', 'dark', 'large', 'L'].forEach((value, i) => { s.document.getElementById(`val-${i + 1}`).value = value; });
    const trial = s.timeline[4].timeline[3];
    trial.on_load();
    s.document.getElementById('apply-btn').click();
    s.requests[0].error();
    assert.equal(s.document.getElementById('apply-btn').disabled, false);
    s.document.getElementById('apply-btn').click();
    trial.on_finish();
    s.requests[1].complete({ data: previewRows(), errors: [] });
    s.tick(100);
    assert.equal(s.timers.size, 0);
    assert.equal(s.finished.length, 0);
});

for (const version of [3, 4]) {
    for (const option of ['name', 'search_strategy', 'other', 'none']) {
        test(`version ${version}: complete Standard branch with ${option} until AI practice boundary`, () => {
            const s = setup(version);
            const branch = s.timeline[3];
            assert.equal(branch.conditional_function(), true);
            assert.equal(s.timeline[4].conditional_function(), false);
            const [intro, exploration, preview, question, ...rest] = branch.timeline;
            assert.ok(intro.stimulus().includes('DA02'));
            intro.on_load();
            s.document.getElementById('next-btn-std-1').click();
            exploration.on_load();
            s.document.getElementById('next-btn-std-2').click();
            assert.equal(s.finished.length, 2);
            assert.ok(!/<select|<input/.test(preview.stimulus));
            assert.match(preview.stimulus, /Direction: top left → top right → bottom right → bottom left/);
            assert.match(preview.stimulus, /Background: dark → light/);
            assert.match(preview.stimulus, /Size: large → small/);
            assert.match(preview.stimulus, /Type: L → O/);
            preview.on_load();
            for (let run = 0; run < 2; run++) {
                s.document.getElementById('preview-btn').click();
                s.requests[run].complete({ data: previewRows(), errors: [] });
                assert.equal(s.delays[run], 180);
                s.tick(32);
                assert.equal(s.finished.length, 2);
                assert.equal(s.document.getElementById('preview-image-wrapper').children.length, 14);
                assert.equal(s.document.getElementById('proceed-btn').disabled, false);
            }
            s.document.getElementById('proceed-btn').click();
            preview.on_finish();
            assert.equal(s.finished.length, 3);
            assert.equal(s.properties.agent_id, 'DA02');
            assert.equal(Object.keys(s.properties).some(key => key.startsWith('custom_')), false);
            assert.equal(vm.runInContext('participantCustomization', s.context), null);
            assert.match(question.stimulus, /If you were able to change anything about the agent‘s features to improve it, what would it be\?/);
            for (const label of ['The agent‘s name', 'The agent‘s search strategy', 'Something else', 'I wouldn‘t change anything']) {
                assert.ok(question.stimulus.includes(label));
            }
            assert.ok(!question.stimulus.includes('checkbox'));
            s.document.querySelector = () => null;
            question.on_load();
            s.document.getElementById('standard-change-next').click();
            assert.equal(s.finished.length, 3);
            s.document.querySelector = () => ({ value: option });
            s.document.getElementById('standard-change-next').click();
            assert.deepEqual(JSON.parse(s.properties.standard_change_options), [option]);
            const followups = rest.slice(0, 3).filter(node => node.conditional_function());
            assert.equal(followups.length, option === 'none' ? 0 : 1);
            if (followups.length) {
                const survey = followups[0].timeline[0];
                const prompts = {
                    name: 'How would you change the agent‘s name?',
                    search_strategy: 'How would you change the agent‘s search strategy?',
                    other: 'What else would you change and how?'
                };
                assert.equal(survey.questions[0].prompt, prompts[option]);
                const key = survey.questions[0].name;
                survey.on_finish({ response: { [key]: 'Example feedback' } });
                assert.equal(s.properties[key], 'Example feedback');
            }
            for (const key of ['name', 'search_strategy', 'other'].filter(key => key !== option)) {
                assert.equal(s.properties[`standard_change_${key}_text`], null);
            }
            const mistakes = rest[3], reminder = rest[4];
            assert.ok(mistakes.stimulus().includes('DA02'));
            assert.ok(reminder.stimulus().includes('DA02'));
            mistakes.on_load();
            s.document.getElementById('next-btn-1').click();
            reminder.on_load();
            s.document.getElementById('next-btn-2').click();
            assert.equal(s.finished.length, 6);
            assert.equal(s.timers.size, 0);
            assert.equal(s.requests.length, 2); // Preview only; no subsequent AI trial started.
        });
    }
}
