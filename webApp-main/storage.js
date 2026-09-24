// Analysis export and the existing DataPipe destination. No automatic backup service.
function prepareExportRows(rows) {
    return rows.map((original, index) => {
        const row = { ...original, record_index: index + 1 };
        for (const [key, value] of Object.entries(row)) {
            if (/^(pre_ownership_\d|(?:pre|post)_satisfaction_\d|(?:pre|post)_trust_\d|manip_.+|ai_attitude_\d|responsibility_(self|agent))$/.test(key) && value != null) {
                if (!Number.isInteger(value) || value < 1 || value > 7) throw new Error(`Invalid Likert: ${key}`);
            }
            if (['defect_pattern_noticed', 'ai_error_pattern_noticed'].includes(key) && value != null && ![YES_NO_CODES.yes, YES_NO_CODES.no].includes(value)) throw new Error(`Invalid Yes/No: ${key}`);
        }
        if (row.participant_verdict != null && row.participant_verdict_code !== VERDICT_CODES[row.participant_verdict]) throw new Error('Invalid verdict code');
        if (row.standard_change_options) {
            const selected = JSON.parse(row.standard_change_options);
            for (const option of ['name', 'search_strategy', 'other', 'none']) row[`standard_change_${option}_selected`] = selected.includes(option);
        }
        // Relevant text answers already have named fields. Raw plugin answers are redundant.
        delete row.response;
        delete row.stimulus;
        delete row.question_order;
        return row;
    });
}

function analysisCsv(rows) {
    const fields = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const cell = value => '"' + (value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)).replaceAll('"', '""') + '"';
    return [fields.map(cell).join(','), ...rows.map(row => fields.map(field => cell(row[field])).join(','))].join('\r\n');
}

function showSubmission(jsPsych, debug) {
    const originals = jsPsych.data.get().values();
    let rows, validationError = null;
    try { rows = prepareExportRows(originals); }
    catch (error) { rows = originals; validationError = error; }
    const csv = analysisCsv(rows); // Keep one immutable snapshot for every retry/download.
    document.body.innerHTML = '<main style="max-width:700px;margin:15vh auto"><p id="save-status"></p><button id="save-retry">Retry</button><button id="save-download">Download CSV</button></main>';
    const status = document.getElementById('save-status'), retry = document.getElementById('save-retry');
    document.getElementById('save-download').onclick = () => {
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = dateiName;
        document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    };
    async function upload() {
        retry.disabled = true;
        status.textContent = 'Saving responses...';
        try {
            const result = await fetch('https://pipe.jspsych.org/api/data/', {
                method: 'POST', headers: { 'Content-Type': 'application/json', Accept: '*/*' },
                body: JSON.stringify({ experimentID: OSF_EXPERIMENT_ID, filename: dateiName, data: csv })
            });
            if (!result.ok) throw new Error('Upload failed');
            const receipt = await result.json();
            if (!receipt || receipt.error || receipt.message !== 'Success') throw new Error('Upload not confirmed');
            status.textContent = 'Data saved. You may close this window now.';
        } catch (_) {
            status.textContent = 'Upload could not be confirmed. Keep this page open and retry, or download your responses as CSV.';
            retry.disabled = false;
        }
    }
    retry.onclick = upload;
    if (validationError) { retry.hidden = true; status.textContent = 'Data validation failed. Download the raw CSV for recovery and contact the study team. No upload was sent.'; }
    else if (debug) { retry.hidden = true; status.textContent = 'Debug run: download your responses as CSV. No upload was sent.'; }
    else upload();
}
