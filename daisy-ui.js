// Decorate jsPsych's generated controls without replacing its event handlers.
(() => {
    function decorate(root) {
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        for (const element of [root, ...root.querySelectorAll('*')]) {
            if (element.matches('button, input[type="button"], input[type="submit"]')) {
                element.classList.add('btn');
                if (element.matches('.btn-reset, #ai-reject, #btn-reject')) element.classList.add('btn-error');
                else if (element.matches('#apply-btn')) element.classList.add('btn-outline');
                else element.classList.add('btn-primary');
            }
            if (element.matches('input[type="text"]')) element.classList.add('input');
            if (element.matches('textarea')) element.classList.add('textarea');
            if (element.matches('select')) element.classList.add('select');
            if (element.matches('input[type="radio"]')) element.classList.add('radio', 'radio-primary');
            if (element.matches('input[type="checkbox"]')) element.classList.add('checkbox', 'checkbox-primary');
            if (element.matches('.ki-panel, .study-info-card, [style*="background:#0f172a"], [style*="background: #0f172a"]')) {
                element.classList.add('card', 'bg-base-100');
            }
        }
    }
    decorate(document.body);
    new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) decorate(node);
    }).observe(document.body, { childList: true, subtree: true });
})();
