/**
 * Nicht interaktive KI-Ringe an den unveränderten CSV-Koordinaten.
 */
function renderRing(containerId, originalX, originalY, elementSize, originalWidth = ORIGINAL_BILD_BREITE) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Skalierungsfaktor des aktuellen Bildschirms berechnen
    const rect = container.getBoundingClientRect();
    const scale = rect.width ? (rect.width / originalWidth) : 1;

    // 2. Originalgrößen berechnen
    const originalRadius = (elementSize === 'groß') ? (19 * 1.6 * 2) : (12 * 1.6 * 2);
    const originalDiameter = originalRadius * 2;
    const currentX = originalX * scale;
    const currentY = originalY * scale;
    const currentDiameter = originalDiameter * scale;

    const ringElement = document.createElement('div');
    ringElement.classList.add('ki-ring'); 
    ringElement.style.position = 'absolute'; // Wichtig für Skalierung
    ringElement.style.width = currentDiameter + 'px';
    ringElement.style.height = currentDiameter + 'px';
    ringElement.style.left = currentX + 'px';
    ringElement.style.top = currentY + 'px';

    ringElement.style.pointerEvents = 'none';
    container.appendChild(ringElement);
    return ringElement;
}

/** Entfernbare manuelle Zählhilfe, ausschließlich für Training ohne KI. */
function renderTrainingMarker(container, x, y) {
    const marker = document.createElement('div');
    marker.classList.add('ki-ring', 'training-marker');
    marker.style.width = '40px';
    marker.style.height = '40px';
    marker.style.left = x + 'px';
    marker.style.top = y + 'px';
    marker.style.pointerEvents = 'auto';
    marker.addEventListener('click', function(event) {
        event.stopPropagation();
        marker.remove();
    });
    container.appendChild(marker);
    return marker;
}
