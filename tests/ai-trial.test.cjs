const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup() {
    const nodes = new Map(), timers = new Map(), finished = [];
    let now = 100, timerId = 0;
    function element() {
        const classes = new Set();
        return {
            style: { setProperty(key, value) { this[key] = value; } },
            children: [], handlers: {}, complete: true, naturalWidth: 1000, naturalHeight: 800,
            classList: { add: (...names) => names.forEach(n => classes.add(n)), contains: n => classes.has(n) },
            getBoundingClientRect: () => ({ width: 500 }),
            appendChild(child) { this.children.push(child); },
            addEventListener(event, fn) { this.handlers[event] = fn; },
            click() { this.handlers.click?.(); }
        };
    }
    const document = { createElement: element, getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, element());
        return nodes.get(id);
    } };
    const context = vm.createContext({ crypto: require('node:crypto').webcrypto, document, URLSearchParams,
        performance: { now: () => now }, jsPsychHtmlButtonResponse: 'button',
        setInterval(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
        clearInterval(id) { timers.delete(id); },
        Papa: { parse(text) { return { data: JSON.parse(text), errors: [] }; } }
    });
    for (const file of ['conditions.js', 'config.js', 'functions.js', 'customization.js', 'ai-trial.js']) {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    }
    return { context, document, timers, finished,
        jsPsych: { finishTrial(data) { finished.push(data); } },
        advance(ms) { now += ms; },
        tick(count) { for (let i = 0; i < count; i++) for (const { fn, ms } of [...timers.values()]) { now += ms; fn(); } }
    };
}

// Explicit test fixtures only. No replacement for the blocked real condition build.
function fixture(version, phase = 'ai_practice', verdict = 'Pass', index = 1) {
    const mode = [1, 3].includes(version) ? 'low' : 'high';
    const stimulusId = `${phase}_${index}`;
    const symbols = Array.from({ length: 14 }, (_, i) => ({ symbol_id: `${stimulusId}_s${i + 1}`,
        source_csv_row: i + 2, shape: i < 12 ? (i % 2 ? 'O' : 'L') : 'Q',
        color: 'orange', size: i % 2 ? 'large' : 'small', center_x: 100 + i, center_y: 200 }));
    return { symbols, plan: { phase, trial_index: index, stimulus_id: stimulusId,
        image_path: `images/${stimulusId}.jpg`, symbol_table_path: `tables/${stimulusId}.csv`,
        predictability_condition: mode, seed: 20260909,
        specified_total_symbols: 14, specified_targets: 12,
        specified_misses: 2, specified_false_alarms: 0, agent_verdict: verdict,
        ai_marked_symbol_ids: symbols.slice(2, 12).map(s => s.symbol_id),
        miss_symbol_ids: symbols.slice(0, 2).map(s => s.symbol_id),
        false_alarm_symbol_ids: [], error_symbol_ids: symbols.slice(0, 2).map(s => s.symbol_id), symbols
    } };
}

function create(s, version, item) {
    const condition = vm.runInContext(`EXPERIMENT_CONDITIONS[${version}]`, s.context);
    return s.context.createAiTrial({ jsPsych: s.jsPsych, ...item, condition,
        getAgentId: () => condition.customizationEnabled ? 'AI01' : 'DA02',
        getSearchOrder: () => vm.runInContext(`buildCustomization(${condition.customizationEnabled
            ? "{direction:'bottom_right',background:'light',size:'small',type:'O'}" : 'STANDARD_SEARCH_STARTS'})`, s.context)
    });
}

for (const version of [1, 3]) {
    test(`v${version}: actual Main Trial 30 ends only on response and releases next survey`, () => {
        const s = setup(), item = fixture(version, 'main_task', 'Pass', 30);
        const trial = create(s, version, item);
        let nextScreen = false;
        s.jsPsych.finishTrial = data => {
            trial.on_finish(data);
            s.finished.push(data);
            nextScreen = true;
        };
        trial.stimulus();
        trial.on_load();
        s.tick(100);
        assert.equal(nextScreen, false);
        s.document.getElementById('ai-pass').click();
        assert.equal(nextScreen, true);
        assert.equal(s.finished[0].trial_index, 30);
        assert.equal(s.finished[0].phase, 'main_task');
        assert.equal(s.timers.size, 0);
    });
}

for (const version of [1, 2, 3, 4]) {
    for (const phase of ['ai_practice', 'main_task']) {
        for (const verdict of ['Pass', 'Reject']) {
            test(`v${version} ${phase} ${verdict}: planned verdict, immutable rings, data and immediate response`, () => {
                const s = setup(), item = fixture(version, phase, verdict);
                const trial = create(s, version, item);
                const html = trial.stimulus();
                assert.ok(html.includes('ai-agent-verdict') && html.includes('ai-pass') && html.includes('ai-reject'));
                trial.on_load();
                s.document.getElementById('ai-pass').click();
                assert.equal(s.finished.length, 0);
                s.tick(31);
                assert.equal(s.finished.length, 0);
                s.tick(1);
                const panel = s.document.getElementById('ai-agent-verdict');
                assert.equal(panel.textContent, `Final verdict: ${verdict.toUpperCase()}`);
                assert.ok(panel.classList.contains(verdict === 'Pass' ? 'ai-verdict-pass' : 'ai-verdict-reject'));
                // Both test verdicts have 10 rings. REJECT must never be recomputed as PASS.
                const wrapper = s.document.getElementById('ai-image-wrapper');
                assert.equal(wrapper.children.length, 10);
                assert.equal(wrapper.children[0].style.left, '51px'); // 102 / actual image width 1000 * 500
                assert.equal(wrapper.handlers.click, undefined);
                assert.ok(wrapper.children.every(ring => ring.style.pointerEvents === 'none' && !ring.handlers.click));
                s.tick(1000);
                assert.equal(s.finished.length, 0);
                assert.equal(s.timers.size, 0);
                s.advance(250);
                s.document.getElementById('ai-reject').click();
                assert.equal(s.finished.length, 1);
                const row = s.finished[0];
                assert.equal(row.phase, phase);
                assert.equal(row.trial_index, 1);
                assert.equal(row.experiment_version, version);
                assert.equal(row.agent_id, version < 3 ? 'AI01' : 'DA02');
                assert.equal(row.customization_condition, version < 3 ? 'customization' : 'standard');
                assert.equal(row.predictability_condition, [1, 3].includes(version) ? 'low' : 'high');
                assert.equal(row.agent_verdict, verdict);
                assert.equal(row.participant_verdict, 'reject');
                assert.equal(row.participant_verdict_code, 2);
                assert.equal(row.agreement_with_agent, verdict === 'Reject');
                assert.equal(row.response_correct, true); // 12 actual L/O defects
                assert.equal(row.rt, 730);
                assert.equal(row.search_animation_duration_ms, 480);
                assert.equal(row.specified_misses, 2);
                assert.equal(row.specified_false_alarms, 0);
                for (const field of ['ai_marked_symbol_ids', 'miss_symbol_ids', 'false_alarm_symbol_ids']) {
                    assert.deepEqual(JSON.parse(row[field]), item.plan[field]);
                }
                assert.ok(!('symbols' in row));
                row.trial_index = 99;
                trial.on_finish(row);
                assert.equal(row.trial_index, 1);
                s.document.getElementById('ai-pass').click();
                assert.equal(s.finished.length, 1);
            });
        }
    }
}

test('participant Pass records code 1 and correctness independently of AI agreement', () => {
    const s = setup(), trial = create(s, 1, fixture(1));
    trial.stimulus(); trial.on_load(); s.tick(32);
    s.document.getElementById('ai-pass').click();
    assert.equal(s.finished[0].participant_verdict_code, 1);
    assert.equal(s.finished[0].agreement_with_agent, true);
    assert.equal(s.finished[0].response_correct, false);
});

test('image loading and cleanup cannot auto-advance or leave timers behind', () => {
    const s = setup(), trial = create(s, 2, fixture(2));
    trial.stimulus();
    const image = s.document.getElementById('ai-stimulus-image'); image.complete = false;
    trial.on_load(); s.advance(3000); s.tick(100);
    assert.equal(s.timers.size, 0);
    image.handlers.load(); s.tick(1);
    trial.on_finish({});
    image.handlers.load(); s.tick(100);
    assert.equal(s.timers.size, 0);
    assert.equal(s.finished.length, 0);
});

test('missing/invalid plans fail without fallback marking', async () => {
    const s = setup();
    s.context.fetch = async () => ({ ok: false });
    await assert.rejects(s.context.loadAiResources(vm.runInContext('EXPERIMENT_CONDITIONS[2]', s.context)), /plan is missing/);
    const item = fixture(2); item.plan.miss_symbol_ids = [];
    assert.throws(() => create(s, 2, item), /Miss IDs/);
});

test('loader verifies all 40 trials against Excel import and CSV metadata', async () => {
    const s = setup(), items = Array.from({ length: 40 }, (_, i) => fixture(3, i < 10 ? 'ai_practice' : 'main_task', 'Pass', i < 10 ? i + 1 : i - 9));
    const manifest = { experiment_version: 3, customization_condition: 'standard', predictability_condition: 'low', seed: 20260909, trials: items.map(i => i.plan) };
    const bases = structuredClone(manifest.trials);
    s.context.fetch = async url => ({ ok: true,
        json: async () => url.endsWith('validation_status.json') ? { experiment_start_allowed: true, valid_versions: [1, 2, 3, 4] } : url.includes('/conditions/') ? manifest : url.includes('pre_trials') ? bases.slice(0, 10) : bases.slice(10),
        text: async () => JSON.stringify(items.find(i => i.plan.symbol_table_path === url).symbols.map(symbol => ({
            shape: symbol.shape, color_hex: '#FF8C00', is_small: symbol.size === 'small', center_x: symbol.center_x, center_y: symbol.center_y
        })))
    });
    const condition = vm.runInContext('EXPERIMENT_CONDITIONS[3]', s.context);
    const resources = await s.context.loadAiResources(condition);
    assert.equal(resources.length, 40);
    manifest.trials[0].agent_verdict = 'Reject';
    await assert.rejects(s.context.loadAiResources(condition), /differs from Excel import: agent_verdict/);
    manifest.trials[0].agent_verdict = 'Pass';
    manifest.trials[0].symbols[1].source_csv_row = manifest.trials[0].symbols[0].source_csv_row;
    await assert.rejects(s.context.loadAiResources(condition), /Duplicate or incomplete source CSV rows/);
});

test('global validation blocker prevents every version from loading even valid LOW plans', async () => {
    for (const version of [1, 2, 3, 4]) {
        const s = setup(), requested = [];
        s.context.fetch = async url => {
            requested.push(url);
            return { ok: true, json: async () => ({ experiment_start_allowed: false,
                valid_versions: [1, 3], validation_errors: ['required orange misses = 2, available orange targets = 1'] }) };
        };
        await assert.rejects(s.context.loadAiResources(vm.runInContext(`EXPERIMENT_CONDITIONS[${version}]`, s.context)), /Experiment start blocked/);
        assert.deepEqual(requested, ['data/generated/conditions/validation_status.json']);
    }
});
