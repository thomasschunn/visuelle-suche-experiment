const CUSTOMIZATION_DIMENSIONS = Object.freeze({
    direction: Object.freeze(['top_left', 'top_right', 'bottom_right', 'bottom_left']),
    background: Object.freeze(['dark', 'light']),
    size: Object.freeze(['large', 'small']),
    type: Object.freeze(['L', 'O'])
});

function buildCustomization(starts) {
    const result = {};
    for (const [dimension, values] of Object.entries(CUSTOMIZATION_DIMENSIONS)) {
        const index = values.indexOf(starts[dimension]);
        if (index < 0) throw new Error(`Invalid customization dimension: ${dimension}`);
        result[dimension] = Object.freeze({ start: starts[dimension],
            order: Object.freeze([...values.slice(index), ...values.slice(0, index)]) });
    }
    return Object.freeze(result);
}

function customizationCombinations(settings) {
    const steps = [];
    for (const direction of settings.direction.order)
        for (const background of settings.background.order)
            for (const size of settings.size.order)
                for (const type of settings.type.order) steps.push({ direction, background, size, type });
    return steps;
}

function customizationData(agentId, settings) {
    const data = { agent_id: agentId };
    for (const [dimension, value] of Object.entries(settings)) {
        data[`custom_${dimension}_start`] = value.start;
        data[`custom_${dimension}_order`] = JSON.stringify(value.order);
    }
    return data;
}

function applyCustomization(settings) {
    participantCustomization = settings;
    probandenConfig = Object.entries(settings).map(([dimension, value]) => ({
        category: dimension === 'background' ? 'bg' : dimension,
        label: dimension[0].toUpperCase() + dimension.slice(1),
        value: value.start,
        valueLabel: value.start.replaceAll('_', ' '),
        order: [...value.order]
    }));
}

/** Owns one preview screen; a generation token rejects stale load responses. */
function mountSearchPreview(jsPsych, agentId, fixedSettings = null) {
    const selectors = fixedSettings ? [] : ['direction', 'background', 'size', 'type'].map((key, index) =>
        ({ key, input: document.getElementById(`val-${index + 1}`), order: document.getElementById(`order-${index + 1}`) }));
    const apply = document.getElementById(fixedSettings ? 'preview-btn' : 'apply-btn');
    const proceed = document.getElementById('proceed-btn');
    const wrapper = document.getElementById('preview-image-wrapper');
    const image = document.getElementById('preview-image');
    const status = document.getElementById('status-text');
    let active = true, busy = false, generation = 0, interval;

    function read() {
        return fixedSettings || buildCustomization(Object.fromEntries(selectors.map(({ key, input }) => [key, input.value])));
    }
    function showOrders() {
        const settings = read();
        selectors.forEach(({ key, order }) => { order.textContent = settings[key].order.map(v => v.replaceAll('_', ' ')).join(' → '); });
        return settings;
    }
    function setBusy(value) {
        busy = value;
        apply.disabled = value;
        proceed.disabled = value;
        selectors.forEach(({ input }) => { input.disabled = value; });
    }
    function dispose() { active = false; generation++; clearInterval(interval); }
    selectors.forEach(({ input }) => input.addEventListener('change', showOrders));
    showOrders();

    proceed.addEventListener('click', () => {
        if (!active || busy) return;
        const settings = showOrders();
        if (!fixedSettings) applyCustomization(settings);
        const data = fixedSettings ? { agent_id: agentId } : customizationData(agentId, settings);
        jsPsych.data.addProperties(data);
        dispose();
        jsPsych.finishTrial(data);
    });

    apply.addEventListener('click', () => {
        if (!active || busy) return;
        const settings = showOrders();
        if (!fixedSettings) applyCustomization(settings);
        const token = ++generation;
        setBusy(true);
        clearInterval(interval);
        wrapper.querySelectorAll('.ki-ring').forEach(ring => ring.remove());
        wrapper.classList.remove('preview-pass', 'preview-reject');
        // Existing prototype template, not verified against the missing reference.
        status.textContent = `... starting search with ${settings.size.start} ${settings.type.start}s on ${settings.background.start} areas in the ${settings.direction.start.replaceAll('_', ' ')} ...`;
        let rows = null, started = false;
        const current = () => active && generation === token;
        function fail() {
            if (!current()) return;
            generation++;
            clearInterval(interval);
            status.textContent = 'Preview could not be loaded.';
            setBusy(false);
        }
        function start() {
            if (!current() || started || !rows || !image.complete || !image.naturalWidth) return;
            started = true;
            const steps = customizationCombinations(settings);
            const rendered = new Set();
            const truth = value => value === true || value === 'True' || value === 'true' || value === 1;
            const marked = rows.filter(row => truth(row.bekommt_kreis));
            let index = 0;
            function draw(row) {
                renderRing('preview-image-wrapper', row.center_x, row.center_y, truth(row.is_small) ? 'klein' : 'groß');
                rendered.add(row);
            }
            interval = setInterval(() => {
                if (!current()) return;
                status.textContent = '... searching ...';
                const step = steps[index++];
                marked.forEach(row => {
                    const left = row.center_x <= ORIGINAL_BILD_BREITE / 2;
                    const top = row.center_y <= ORIGINAL_BILD_HOEHE / 2;
                    const direction = `${top ? 'top' : 'bottom'}_${left ? 'left' : 'right'}`;
                    if (direction === step.direction && (truth(row.bg_dark) ? 'dark' : 'light') === step.background &&
                        (truth(row.is_small) ? 'small' : 'large') === step.size && row.shape === step.type) draw(row);
                });
                if (index === steps.length) {
                    clearInterval(interval);
                    // Preserve existing CSV false positives outside L/O, formerly shown in the final scan.
                    marked.filter(row => !rendered.has(row)).forEach(draw);
                    const verdict = rendered.size > 10 ? 'reject' : 'pass';
                    wrapper.classList.add(`preview-${verdict}`);
                    status.textContent = `Final verdict: ${rendered.size} defects`;
                    setBusy(false);
                }
            }, SEARCH_STEP_MS);
        }
        image.addEventListener('load', start, { once: true });
        image.addEventListener('error', fail, { once: true });
        if (image.complete && !image.naturalWidth) { fail(); return; }
        Papa.parse('tabellen/stimulus_001.csv', {
            download: true, header: true, dynamicTyping: true,
            complete(result) {
                if (!current()) return;
                rows = result.data.filter(row => row.shape);
                if (result.errors?.length || !rows.length || rows.some(row => row.bekommt_kreis === undefined ||
                    !Number.isFinite(row.center_x) || !Number.isFinite(row.center_y))) { fail(); return; }
                start();
            }, error: fail
        });
    });
    return dispose;
}

function mountCustomizationPreview(jsPsych, agentId) {
    return mountSearchPreview(jsPsych, agentId);
}
