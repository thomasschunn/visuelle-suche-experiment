# UI-Design (2026-09-17)

Die Teilnehmeroberfläche verwendet daisyUI 5.7.39 über das CDN und setzt `data-theme="light"` am HTML-Element. `daisy-ui.js` ergänzt die daisyUI-Klassen an den von jsPsych erzeugten Buttons, Eingaben, Auswahlfeldern und Karten, ohne IDs, Event-Handler oder Teilnehmertexte zu ändern. `style.css` hält die bestehenden Stimulus- und Ringmaße und setzt die hellen Oberflächenfarben auch gegen ältere Inline-Stile durch.

Prüfung: `node --check daisy-ui.js`, `npm.cmd test` (107/107 bestanden), `git diff --check` (keine Whitespace-Fehler). Eine Browser-Sichtprüfung aller Screens wurde hier nicht durchgeführt. Das daisyUI-Stylesheet benötigt wie die vorhandenen jsPsych-Abhängigkeiten eine Netzwerkverbindung.

## Kontrastkorrektur (2026-09-17)

Helle Altfarben auf den neuen weißen Karten werden in `style.css` übersteuert. Der Debug-Titel ist schwarz, fett und größer. Buttons richten ihren Text horizontal und vertikal mittig aus. Das Agent-ID-Feld steht mittig; die vier Customization-Zeilen haben ausreichend breite Spalten für Auswahlfeld und vollständige Suchreihenfolge. Die visuelle Browserprüfung bleibt eine Grenze der automatisierten Tests.

## Training und Formularfelder

Im manuellen Training steht Pass links und Reject rechts. Die Pass-Beschriftung bleibt auch mit der alten Inline-Hintergrundfarbe weiß. Weiße Textfelder, Auswahllisten, Textbereiche und weiße Buttons erhalten einen sichtbaren Rahmen in `#C4C4C4`.

## Preview-Bild und Ringe

Die Preview übergibt das geladene Bild an `renderRing()`, damit Kreismittelpunkte auf der tatsächlichen Bildfläche liegen. Der Preview-Rahmen verwendet für Pass/Reject eine Outline statt eines Innenrandes; dadurch bleibt das 1920:1080-Bild ohne schmale Balken und ohne Verschiebung der Ringposition dargestellt.

## Trainingswechsel und Fragebögen

Der Trainingsrahmen reserviert schon vor dem Laden das Seitenverhältnis 1000:800. So ändert sich seine Höhe beim Laden des nächsten Bildes nicht. Die Brillenabfrage, reine jsPsych-Textseiten sowie Survey-Text- und Likert-Fragen erhalten helle Karten mit Rand und Schatten. Die Linie der Likert-Skala liegt mittig hinter den Auswahlkreisen.

## Text- und Umfrageseiten nach PrePO und PostPO

Die Kartenregel sitzt auf dem von jsPsych tatsächlich erzeugten `#jspsych-content`. Sie greift für Likert- und Textformulare sowie reine Textseiten mit Button, einschließlich der Einleitungen, Nachfragen und Abschlussseiten nach PrePO und PostPO. Bildtrials und bereits gestaltete Karten sind ausgenommen. Die Fragen innerhalb eines Likert-Formulars werden in derselben Karte durch dezente Linien gegliedert.

Die Textkarten verwenden ihre Inhaltshöhe statt einer Fensterhöhe. Bei Likert-Skalen überschreibt das Projekt die feste `left: 50%`-/`margin-left: -6px`-Position des jsPsych-Radio-Inputs, die mit den größeren daisyUI-Radios nicht mehr passte. Kreise und Beschriftungen teilen nun die Mitte derselben Antwortspalte; die Achse liegt auf Kreismitte.

## Bereinigung der alten UI-Dateien

`hero-ui.js`, `heroui.css` und `ui.css` waren nicht in `index.html` oder einem anderen Laufzeitmodul eingebunden. Der veraltete HeroUI-Build und seine Abhängigkeiten wurden aus `package.json` entfernt; die zugehörige `package-lock.json` wurde ebenfalls entfernt. Das native Node-Testskript bleibt erhalten.
