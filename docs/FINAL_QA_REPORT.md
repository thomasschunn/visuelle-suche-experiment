# Final QA Report

Stand: 2026-09-09. Ergebnis: **automatisierte Abnahme bestanden, keine Freigabe zur Datenerhebung**. Der bestaetigte High-Quellenblocker bei Main-Trial 28 besteht. Alle vier Versionen bleiben gesperrt. Fehlende Referenztexte und ein echter Browser-/DataPipe-Durchlauf sind nicht als bestanden gewertet.

## In dieser Endabnahme behobene Fehler

1. DataPipe-Erfolg wurde gegen das falsche Antwortfeld `success=true` geprueft. Jetzt wird nach erfolgreichem HTTP-Status die dokumentierte Antwort `message="Success"` erwartet. Fehlerantworten, leere Antworten und der alte unzutreffende Vertrag werden nicht als gespeichert angezeigt. Grundlage: [offizielle DataPipe API](https://pipe.jspsych.org/api-docs). Tests fuer Erfolg, Fehler, Wiederholung und unveraenderten CSV-Inhalt.
2. Im partiellen Predictability-Build konnte ein bereits zugewiesener, aber anschliessend abgelehnter Modus in der Exportliste bleiben. Ein Modus wird jetzt erst nach erfolgreicher vollstaendiger Validierung freigegeben. Regressionstest erzwingt einen Validatorfehler und prueft, dass kein abgelehnter Low-Plan exportiert wird.
3. Der AI-Loader prueft jetzt, dass alle CSV-Zeilen eindeutig und vollstaendig referenziert sind. Doppelte source_csv_row-Verweise werden abgelehnt, auch wenn Symbol-IDs eindeutig sind.
4. Die HTML-Dokumentsprache ist jetzt `en`, passend zu den Teilnehmertexten.
5. OPEN_QUESTIONS.md bereinigt: ueberholte angeblich fehlende Excel-/Stimulusdateien und bereits geklaerte Surveyfragen sind keine aktuellen Blocker mehr. DATA_SCHEMA.md korrigiert den Upload-Antwortvertrag.

Original-Excel, Stimuli und Archive wurden nicht geaendert oder entfernt. Die Ausnahmen Main 24 = ZIP 50 / ZIP 49 superseded und Main 28 = ZIP 54 bleiben erhalten.

## Automatisch bestandene Pruefungen

| Bereich | Ergebnis / Nachweis |
| --- | --- |
| Conditions | V1 customization-low, V2 customization-high, V3 standard-low, V4 standard-high; URLs ohne eindeutige gueltige Version starten nicht. |
| Flow | Gemeinsamer Anfang mit Glasses, Context, Task/Practice, 5 Trainings, Uebergang; genau passender Standard-/Customization-Zweig; Reminder; 10 AI-Practice; Intro/Ownership/Satisfaction/Trust; Main-Uebergang; 30 Main; Post-Intro/Satisfaction/Trust; Responsibility-Szenario/Fragen; Final-Intro/Manipulation/Patterns/Attitude; Submit. Timeline-Tests isolieren AI-Trials; deren Engine wird separat getestet. |
| Training | Alle 5 Trials geprueft: Marker setzen/entfernen, Bildladefreigabe, unmittelbare Antwort, kein zeitbedingtes Ende, phasenlokaler Index und Markerzahl. |
| AI-Trials | Gemeinsame createAiTrial() fuer beide Phasen. Keine Ring-Clickhandler, pointer-events:none; keine neuen Marker/Drag-/Loeschfunktionen. Kein Recalibrate/Countdown/Antworttimeout. Suchanimation beendet nicht den Trial. Antwort nach Suchende beendet genau einmal. |
| Verdicts | Pass/Reject aus Plan, kein Neuberechnen aus Ringen. Testfixture mit identischen 10 Ringen, aber verschiedenen Plan-Verdicts. Empfehlung rot/gruen und getrennte Antwortbuttons. |
| Defekte | L/O sind Targets unabhaengig von Farbe/Groesse; T/Q sind Nichttargets. >10 reject, sonst pass. Quellenvalidierung akzeptiert die vorhandenen Formen L/O/T/Q und weist unerwartete Quellformen zur Pruefung zurueck. |
| Quellen / Anzahlen | Import prueft alle verwendeten Excel-Zeilen und CSV-Symbolzahlen. 5 Training, 10 PrePO, 30 PostPO. 96 Importausgaben bytegleich zum reproduzierbaren Build. |
| Low | V1/V3 enthalten je 40 validierte Trials mit gleichen Zuordnungen. Fester Seed 20260909, exakte Miss/FA-Zahlen/Verdicts. Balance und keine Serie >2 fuer Farbe/Groesse/Form, auch ueber Trial-/Phasengrenzen, validiert. |
| High | Alle 39 mathematisch erfuellbaren Trials im Speicher validiert: saemtliche Fehler orange, Balance soweit moeglich, exakte Miss/FA-Zahlen. Main 28 bleibt explizit abgelehnt. Keine unvollstaendigen High-Experimentplaene ausgegeben. |
| High/Low-Paritaet | Fuer alle 39 erfuellbaren Trialpaare identische Miss-/FA-Zahlen und Excel-Verdicts nachgewiesen. Fuer Main 28 kein gueltiges High-Paar vorhanden. |
| Customization | Zwei Buchstaben/zwei Zahlen, case-insensitive Eingabe, uppercase gespeichert; wiederholtes Apply, Proceed-Speicherung, alle Startwerte und 32 Kombinationen getestet. SEARCH_STEP_MS zentral 15 ms. |
| Standard | DA02; keine Einstellfelder; gemeinsame Preview-Engine; Originalfrage/Optionen aus Auftrag; passende Freitextzweige und none-Zweig getestet. |
| Surveys | Vom Nutzer gelieferte Items/Anker im Code abgeglichen. Pflicht-Likerts, flache 1-7-Werte; beide Pattern-Fragen mit allen vier Yes/No-Kombinationen in allen vier Versionen geprueft. No hat null-Text und keine Folgefrage. |
| UI-Steuerung | Kein Condition-Menue oder Admin-Skip im normalen Flow. Entwicklungstools ausschliesslich debug=1 und ebenfalls globale Startsperre. Keine Teilnehmerlabels Customization Condition, Standard Condition oder Predictability. Interne Variablennamen sind keine sichtbaren Labels. |
| Daten | UUID, optionale Prolific-Parameter, globale Condition und Agent-ID; Trial-Verdicts, Miss/FA-Zahlen, konkrete IDs, RT, Animationdauer; flache Antworten und Originaltexte. CSV entfernt redundante Pluginantworten und HTML. |
| CSV-Codierung | Likert 1-7 und Yes/No 1-2 validiert; 0, Werte ausserhalb des Bereichs und falsche Typen werden abgewiesen. Pass/Reject zentral 1/2. Downloadtest prueft CSV mit Quotes/Zeilenumbruechen und ohne Likert-0. Andere legitime Nullwerte (z.B. Misszahl=0, wearing_glasses=0) sind keine Skalenfehler. |
| Submit / Fehler | Exakter Abschlusstext, ausschliesslich Submit aktiviert Speicherung. Mock-HTTP-Erfolg, Fehlerantwort, Retry mit gleichem Dateinamen/Inhalt sowie lokaler Blob-Download getestet. Debug/Validierungsfehler senden nichts. Kein echter Upload oder fremder Backupdienst verwendet. |

## Ausgefuehrte Befehle und Ergebnisse

```powershell
node --test tests/*.test.cjs
python -m unittest discover -s scripts -p 'test_*.py'
python scripts/build_trial_specs.py --check
python scripts/build_predictability.py --check
Get-ChildItem -Filter *.js | ForEach-Object { node --check $_.FullName }
python -m py_compile scripts/build_trial_specs.py scripts/build_predictability.py scripts/test_build_trial_specs.py scripts/test_predictability.py
git diff --check
```

- JavaScript: **96 Tests bestanden**.
- Python: **18 Tests bestanden**, einschliesslich aller fuenf benannten Predictability-Validatoren und High/Low-Paritaet an echten Quellen.
- Import: **96 Ausgaben verifiziert**, 5/10/30 Trials.
- Predictability `--check`: Ausgaben reproduzierbar; **Exitcode 1 erwartet** wegen Main-Trial 28. V1/V3 gueltig; validation_status.experiment_start_allowed=false. V2/V4 fehlen absichtlich.
- JavaScript-/Python-Syntax und Diff-Whitespace: bestanden. Git meldet lediglich plattformspezifische LF/CRLF-Hinweise.
- Externe CDN-Abfragen aus der Shell scheitern an der Netzwerkbeschraenkung (WinError 10013). Keine Aussage ueber tatsaechliche Erreichbarkeit der CDNs abgeleitet.

## Altlastensuche

Alle lokalen JS/CJS/Python/HTML/CSS-Dateien einschliesslich Tests wurden durchsucht; Originaldaten werden nicht als Programmcode behandelt.

Kein Treffer: RUNDEN_DAUER, Recalibrate, Final Anomaly Scan, berechneDrift, wird_verschoben, timeout, BlueL, OrangeO, istBlueL, istOrangeO. Kein entfernungsbeduerftiger Rest der 80-Trial-Schleife gefunden.

Treffer fuer die Zeichenfolge `80` sind Layoutmasse, Bildabmessungen und erlaubte Animationsdauer/Testfixtures; sie bleiben erhalten:

- common-start.js: 80px Abstand und 1920/1080 Bildformat.
- config.js: 480-ms-Erlaeuterung und Bildhoehe 1080.
- experiment.js: 1920/1080 Preview/Kalibrierung sowie 800px Text-/Fehlercontainer.
- standard.js: 800px Textcontainer.
- style.css: 380px/280px Panel-/Layoutmasse, 80vh und 1920/1080-Seitenverhaeltnis.
- tests/ai-trial.test.cjs: Testbildhoehe 800 und erwartete 480-ms-Animation.

## Offene Freigabepunkte

1. **Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip. Problem: required orange misses = 2, available orange targets = 1.** Keine automatische Korrektur oder Lockerung. Erst nach korrigierter Quelle/ausdruecklicher Ausnahmeentscheidung und erfolgreichem Neu-Build darf die globale Sperre fallen.
2. PowerPoint/PDF fehlt. Die aus dem alten Prototyp uebernommenen Einfuehrungen, 90%-Aussage, Previewtexte und Layouts sind nicht referenzverifiziert. Neue explizit gelieferte Texte sind umgesetzt. Siehe OPEN_QUESTIONS.md.
3. Schriftlicher Timingwiderspruch: 32 * 15 ms = 480 ms versus etwa 4 Sekunden. 15 ms bleibt wie angeordnet. Suchverschachtelung und finales Preview-Asset bleiben referenzseitig offen.
4. Standard-Checkboxlayout und die berichtete Colour/Size-Inkonsistenz sind ohne Originalreferenz nicht endgueltig entscheidbar.
5. Kein vollstaendiger Browserlauf und kein echter DataPipe-/OSF-Schreibtest. Verfuegbare Tests sind Node-VM-/DOM-Stubs und Python-Quellenvalidierungen; Browserautomation ist hier nicht installiert. Die globale Sperre wird nicht fuer einen vermeintlichen Produktionsnachweis umgangen.

## Manuelle Pruefung vor Datenerhebung

Nach Behebung der Quellenblocker und erneutem erfolgreichen Build:

- Alle vier URLs im vorgesehenen Desktopbrowser komplett durchlaufen. CDN-Laden, Browserkonsole, Bild-/Ringausrichtung, Viewport/Zoom und Lesbarkeit kontrollieren.
- Training setzen/entfernen und KI-Ringe ohne Bearbeitungsmoeglichkeit kontrollieren; lange warten und sicherstellen, dass keine Teilnehmerseite von allein endet.
- Customization mit mehrfach Apply und verschiedenen Startwerten sowie Standard-Preview kontrollieren.
- Pflicht-Likerts und alle Pattern-Verzweigungen mit echter Browserformularvalidierung pruefen; finale CSV auf Spalten, Texte und Wertebereiche kontrollieren.
- Zuerst mit debug=1 lokalen Download pruefen. Danach einen ausdruecklich vorgesehenen synthetischen Testdatensatz ueber Submit speichern, HTTP-Antwort und zugehoerige Datei im bestehenden OSF-Projekt kontrollieren. Bei Offline/HTTP-Fehler Retry und Download pruefen. Wenn eine Erfolgsantwort verloren geht, kann derselbe Dateiname serverseitig schon existieren; Retry ist dann keine Erfolgsgarantie, Download bleibt verfuegbar.
- Rohdaten bei Validierungsfehlern dienen nur zur Rettung, nicht als freigegebener Analysedatensatz. Tab vor erfolgreichem Upload oder Download offen lassen.

## Lokaler Start

Im Projektroot in einem VS-Code-Terminal (Python 3 und Node.js fuer Tests):

```powershell
python scripts/build_trial_specs.py --check
python scripts/build_predictability.py --check
python -m http.server 8000 --bind 127.0.0.1
```

Aktuell endet der zweite Befehl absichtlich mit dem Trial-28-Fehler. Der HTTP-Server kann zur Kontrolle der Startsperre trotzdem gestartet werden. Dateien ueber HTTP laden, nicht per file://. Externe jsPsych-/PapaParse-CDNs benoetigen Internetzugriff. Server mit Ctrl+C beenden.

| Version | Exakte URL |
| --- | --- |
| 1 customization-low | http://127.0.0.1:8000/index.html?version=1 |
| 2 customization-high | http://127.0.0.1:8000/index.html?version=2 |
| 3 standard-low | http://127.0.0.1:8000/index.html?version=3 |
| 4 standard-high | http://127.0.0.1:8000/index.html?version=4 |

Entwicklung ohne Upload: jeweils `&debug=1` anhaengen, z.B. http://127.0.0.1:8000/index.html?version=1&debug=1. **Auch Debug umgeht den Quellenblocker nicht.** Ohne gueltige Version wird ein Konfigurationsfehler angezeigt.
