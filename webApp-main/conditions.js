/** Central condition definitions. Predictability behavior is specified separately. */
// Retains the prototype's fixed defaults; no Colour dimension is inferred.
const STANDARD_SEARCH_STARTS = Object.freeze({
    direction: 'top_left', background: 'dark', size: 'large', type: 'L'
});
const EXPERIMENT_CONDITIONS = Object.freeze({
    1: Object.freeze({ version: 1, customizationEnabled: true, customizationCondition: 'customization', predictabilityCondition: 'low', agentNameMode: 'participant', fixedAgentName: null }),
    2: Object.freeze({ version: 2, customizationEnabled: true, customizationCondition: 'customization', predictabilityCondition: 'high', agentNameMode: 'participant', fixedAgentName: null }),
    3: Object.freeze({ version: 3, customizationEnabled: false, customizationCondition: 'standard', predictabilityCondition: 'low', agentNameMode: 'fixed', fixedAgentName: 'DA02' }),
    4: Object.freeze({ version: 4, customizationEnabled: false, customizationCondition: 'standard', predictabilityCondition: 'high', agentNameMode: 'fixed', fixedAgentName: 'DA02' })
});

function resolveExperimentCondition(search) {
    const parameters = new URLSearchParams(search);
    const versions = parameters.getAll('version');
    // Reject missing, ambiguous and non-canonical values; never choose a default.
    return versions.length === 1 && /^[1-4]$/.test(versions[0])
        ? EXPERIMENT_CONDITIONS[versions[0]]
        : null;
}

function isExperimentDebugEnabled(search) {
    const values = new URLSearchParams(search).getAll('debug');
    return values.length === 1 && values[0] === '1';
}
