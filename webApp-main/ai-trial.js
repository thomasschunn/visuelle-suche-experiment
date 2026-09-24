/** Shared AI practice/main trial runtime. Never selects or redistributes AI errors. */
function assertAi(value, message) {
    if (!value) throw new Error(message);
}

function escapeAiHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function validateAiTrialInput(plan, symbols, condition) {
    assertAi(['ai_practice', 'main_task'].includes(plan.phase), 'Invalid AI phase');
    assertAi(Number.isInteger(plan.trial_index) && plan.trial_index > 0, 'Invalid AI trial index');
    assertAi(['Pass', 'Reject'].includes(plan.agent_verdict), 'Missing/invalid plan verdict');
    assertAi(plan.predictability_condition === condition.predictabilityCondition, 'Wrong predictability plan');
    assertAi(symbols.length > 0 && symbols.length === plan.specified_total_symbols, 'Symbol count mismatch');
    const byId = new Map(symbols.map(s => [s.symbol_id, s]));
    assertAi(byId.size === symbols.length, 'Duplicate symbol IDs');
    for (const s of symbols) {
        assertAi(['L', 'O', 'T', 'Q'].includes(s.shape) && Number.isFinite(s.center_x) && Number.isFinite(s.center_y), 'Invalid symbol metadata');
    }
    const ids = key => {
        assertAi(Array.isArray(plan[key]) && new Set(plan[key]).size === plan[key].length && plan[key].every(id => byId.has(id)), `Invalid ${key}`);
        return new Set(plan[key]);
    };
    const marked = ids('ai_marked_symbol_ids'), misses = ids('miss_symbol_ids'), fas = ids('false_alarm_symbol_ids');
    const errors = ids('error_symbol_ids');
    let targetCount = 0;
    for (const s of symbols) {
        const target = s.shape === 'L' || s.shape === 'O';
        if (target) targetCount++;
        assertAi(misses.has(s.symbol_id) === (target && !marked.has(s.symbol_id)), 'Miss IDs disagree with markings');
        assertAi(fas.has(s.symbol_id) === (!target && marked.has(s.symbol_id)), 'False alarm IDs disagree with markings');
        assertAi(errors.has(s.symbol_id) === (misses.has(s.symbol_id) || fas.has(s.symbol_id)), 'Error sequence IDs disagree');
        if (condition.predictabilityCondition === 'high' && errors.has(s.symbol_id)) assertAi(s.color === 'orange', 'Non-orange HIGH error');
    }
    assertAi(targetCount === plan.specified_targets && misses.size === plan.specified_misses && fas.size === plan.specified_false_alarms, 'Excel counts disagree with plan');
    return targetCount > 10 ? 'reject' : 'pass';
}

function createAiTrial({ jsPsych, plan, symbols, condition, getAgentId, getSearchOrder }) {
    const groundTruth = validateAiTrialInput(plan, symbols, condition);
    let active = false, interval, image, startTime, animationDuration, ready = false;
    let agentId, searchOrder;
    function cleanup() { active = false; clearInterval(interval); }
    return {
        type: jsPsychHtmlButtonResponse,
        choices: [],
        // No redundant symbol table/plan in data: only identifiers and requested scalar fields.
        data: { phase: plan.phase, trial_index: plan.trial_index, stimulus_id: plan.stimulus_id },
        stimulus() {
            agentId = getAgentId();
            searchOrder = getSearchOrder();
            assertAi(/^[A-Z]{2}\d{2}$/.test(agentId), 'Agent ID unavailable');
            return `<div class="experiment-container">
                <div id="ai-image-wrapper" class="image-container trial-image-container">
                    <img id="ai-stimulus-image" src="${escapeAiHtml(plan.image_path)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" />
                </div>
                <div class="right-column">
                    <div class="ki-panel"><h3>${escapeAiHtml(agentId)}</h3>
                        <div id="ai-search-status">... searching ...</div>
                        <div id="ai-search-step"></div>
                        <div id="ai-agent-verdict" class="ai-agent-verdict" aria-live="polite"></div>
                    </div>
                    <div class="button-container">
                        <button id="ai-pass" class="action-btn btn-start" disabled>Pass</button>
                        <button id="ai-reject" class="action-btn btn-reset" disabled>Reject</button>
                    </div>
                </div>
            </div>`;
        },
        on_load() {
            active = true;
            ready = false;
            startTime = null;
            animationDuration = null;
            image = document.getElementById('ai-stimulus-image');
            const wrapper = document.getElementById('ai-image-wrapper');
            const pass = document.getElementById('ai-pass'), reject = document.getElementById('ai-reject');
            const status = document.getElementById('ai-search-status');
            function respond(verdict) {
                if (!active || !ready) return;
                const rt = performance.now() - startTime;
                cleanup();
                pass.disabled = reject.disabled = true;
                jsPsych.finishTrial({
                    phase: plan.phase, trial_index: plan.trial_index, stimulus_id: plan.stimulus_id,
                    experiment_version: condition.version, customization_condition: condition.customizationCondition,
                    predictability_condition: condition.predictabilityCondition, agent_id: agentId,
                    specified_misses: plan.specified_misses, specified_false_alarms: plan.specified_false_alarms,
                    agent_verdict: plan.agent_verdict, participant_verdict: verdict,
                    participant_verdict_code: VERDICT_CODES[verdict],
                    agreement_with_agent: verdict === plan.agent_verdict.toLowerCase(),
                    response_correct: verdict === groundTruth, rt,
                    search_animation_duration_ms: animationDuration,
                    miss_symbol_ids: JSON.stringify(plan.miss_symbol_ids),
                    false_alarm_symbol_ids: JSON.stringify(plan.false_alarm_symbol_ids),
                    ai_marked_symbol_ids: JSON.stringify(plan.ai_marked_symbol_ids),
                    error_symbol_ids: JSON.stringify(plan.error_symbol_ids),
                    preprocessing_seed: plan.seed
                });
            }
            pass.addEventListener('click', () => respond('pass'));
            reject.addEventListener('click', () => respond('reject'));
            function start() {
                if (!active || startTime !== null || !image.naturalWidth || !image.naturalHeight) return;
                assertAi(symbols.every(s => s.center_x >= 0 && s.center_x <= image.naturalWidth && s.center_y >= 0 && s.center_y <= image.naturalHeight), 'Symbol coordinates outside image');
                wrapper.style.setProperty('aspect-ratio', `${image.naturalWidth} / ${image.naturalHeight}`, 'important');
                const steps = customizationCombinations(searchOrder);
                assertAi(steps.length === 32, 'Invalid search order');
                startTime = performance.now();
                let index = 0;
                interval = setInterval(() => {
                    if (!active) return;
                    const step = steps[index++];
                    document.getElementById('ai-search-step').textContent = `${step.direction.replaceAll('_', ' ')} → ${step.background} → ${step.size} → ${step.type}`;
                    if (index !== steps.length) return;
                    clearInterval(interval);
                    const byId = new Map(symbols.map(s => [s.symbol_id, s]));
                    // Reveal the exact planned set together; do not reorder the preprocessing error sequence.
                    plan.ai_marked_symbol_ids.forEach(id => {
                        const s = byId.get(id);
                        renderRing('ai-image-wrapper', s.center_x, s.center_y, s.size === 'small' ? 'klein' : 'groß', image.naturalWidth, image);
                    });
                    const recommendation = document.getElementById('ai-agent-verdict');
                    recommendation.textContent = `Final verdict: ${plan.agent_verdict.toUpperCase()}`;
                    recommendation.classList.add(plan.agent_verdict === 'Pass' ? 'ai-verdict-pass' : 'ai-verdict-reject');
                    status.textContent = '';
                    animationDuration = performance.now() - startTime;
                    ready = true;
                    pass.disabled = reject.disabled = false;
                }, SEARCH_STEP_MS);
            }
            image.addEventListener('load', start);
            image.addEventListener('error', () => {
                if (!active) return;
                cleanup();
                status.textContent = 'The stimulus could not be loaded. Please contact the study team.';
            });
            if (image.complete) {
                if (image.naturalWidth) start();
                else status.textContent = 'The stimulus could not be loaded. Please contact the study team.';
            }
        },
        on_finish(data) { cleanup(); data.trial_index = plan.trial_index; }
    };
}

async function loadAiResources(condition, { allowValidatedPartial = false } = {}) {
    const validation = await fetch('data/generated/conditions/validation_status.json', { cache: 'no-store' });
    assertAi(validation.ok, 'Validated condition plan is missing: global validation status unavailable.');
    const status = await validation.json();
    const partialDebug = status.experiment_start_allowed === false && allowValidatedPartial === true &&
        Array.isArray(status.valid_versions) && status.valid_versions.includes(condition.version);
    assertAi(partialDebug || (status.experiment_start_allowed === true && Array.isArray(status.valid_versions) &&
        [1, 2, 3, 4].every(version => status.valid_versions.includes(version))),
        'Experiment start blocked by source validation. ' + (status.validation_errors || []).join(' '));
    const response = await fetch(`data/generated/conditions/v${condition.version}_trials.json`);
    assertAi(response.ok, 'Validated condition plan is missing. Run the preprocessing build after resolving its validation errors.');
    const manifest = await response.json();
    assertAi(manifest.experiment_version === condition.version && manifest.customization_condition === condition.customizationCondition &&
        manifest.predictability_condition === condition.predictabilityCondition, 'Condition metadata mismatch');
    assertAi(Array.isArray(manifest.trials) && manifest.trials.length === 40, 'Expected 10 AI practice and 30 main trials');
    const baseGroups = await Promise.all(['pre_trials.json', 'main_trials.json'].map(async name => {
        const base = await fetch(`data/generated/${name}`);
        assertAi(base.ok, 'Excel source specs missing');
        return base.json();
    }));
    const baseSpecs = baseGroups.flat();
    assertAi(baseSpecs.length === 40, 'Invalid Excel source spec count');
    const resources = [];
    for (let i = 0; i < manifest.trials.length; i++) {
        const plan = manifest.trials[i];
        for (const key of ['phase', 'trial_index', 'stimulus_id', 'image_path', 'symbol_table_path', 'specified_misses', 'specified_false_alarms', 'specified_targets', 'specified_total_symbols', 'agent_verdict']) {
            assertAi(plan[key] === baseSpecs[i][key], `Plan differs from Excel import: ${key}`);
        }
        assertAi(plan.phase === (i < 10 ? 'ai_practice' : 'main_task') && plan.trial_index === (i < 10 ? i + 1 : i - 9), 'Wrong trial order');
        assertAi(plan.seed === manifest.seed, 'Inconsistent preprocessing seed');
        const table = await fetch(plan.symbol_table_path);
        assertAi(table.ok, `Symbol table missing: ${plan.symbol_table_path}`);
        const parsed = Papa.parse(await table.text(), { header: true, dynamicTyping: true, skipEmptyLines: true });
        assertAi(!parsed.errors.length, 'Invalid symbol CSV');
        assertAi(Array.isArray(plan.symbols) && new Set(plan.symbols.map(s => s.source_csv_row)).size === parsed.data.length &&
            plan.symbols.every(s => Number.isInteger(s.source_csv_row) && s.source_csv_row >= 2 && s.source_csv_row <= parsed.data.length + 1),
            'Duplicate or incomplete source CSV rows');
        const symbols = plan.symbols.map(s => {
            const row = parsed.data[s.source_csv_row - 2];
            assertAi(row && row.shape === s.shape && (row.color_hex === '#FF8C00' ? 'orange' : row.color_hex === '#0064FF' ? 'blue' : null) === s.color &&
                (row.is_small === true || row.is_small === 'True' || row.is_small === 'true' || row.is_small === 1 ? 'small' : 'large') === s.size, 'Plan/CSV symbol mismatch');
            return { ...s, center_x: row.center_x, center_y: row.center_y };
        });
        assertAi(symbols.length === parsed.data.length, 'Incomplete symbol metadata');
        validateAiTrialInput(plan, symbols, condition);
        resources.push({ plan, symbols });
    }
    if (partialDebug) {
        console.warn(`DEBUG PARTIAL VALIDATION: Version ${condition.version} is being tested although the full four-condition experiment is not source-valid. No production data will be uploaded.`);
    }
    return resources;
}
