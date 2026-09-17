# Aktueller QA-Stand (2026-09-17)

Die korrigierte Nutzerdatei fuer Main-Trial 28 ist als `Post_PO_Images/visual_search_data_PostPO_28.zip` eingebunden. Das urspruengliche Archiv `(54)` bleibt erhalten. Das neue Archiv enthaelt 100 Symbole, drei Targets (zwei orange, eines blau); Excel verlangt zwei Misses, einen False Alarm und Verdict Pass.

`python scripts/build_predictability.py` und `--check` validieren jetzt alle vier Versionen mit je 10 AI-Practice- und 30 Main-Trials. `validation_status.json` enthaelt `experiment_start_allowed=true`, `valid_versions=[1,2,3,4]` und keine Validation Errors. 18 Python- und 107 JavaScript-Tests bestehen. Der technische Start ist damit fuer alle vier Versionen entsperrt.

Ein echter Browserdurchlauf, ein DataPipe-Uploadtest und die fehlende PowerPoint/PDF-Referenz bleiben offene QA-Grenzen; sie wurden durch den erfolgreichen Build nicht geprueft.

# Historischer QA-Bericht (Stand 2026-09-09; vor korrigiertem Main-Trial 28)

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
| UI-Steuerung | Kein Condition-Menue oder Admin-Skip im normalen Flow. Entwicklungstools ausschliesslich debug=1; einzeln validierte Conditions koennen im Partial-Debug-Modus getestet werden. Keine Teilnehmerlabels Customization Condition, Standard Condition oder Predictability. Interne Variablennamen sind keine sichtbaren Labels. |
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

1. **Main Trial 28 -> Post_PO_Images/visual_search_data_PostPO_28.zip (bytegleiche Kopie von visual_search_data(54).zip). Problem: required orange misses = 2, available orange targets = 1.** Keine automatische Korrektur oder Lockerung. Erst nach korrigierter Quelle/ausdruecklicher Ausnahmeentscheidung und erfolgreichem Neu-Build darf die globale Sperre fallen.
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

Entwicklung ohne Upload: jeweils `&debug=1` anhaengen, z.B. http://127.0.0.1:8000/index.html?version=1&debug=1. **Partial-Debug erlaubt nur die einzeln validierten Versionen 1 und 3; Produktion und Versionen 2/4 bleiben gesperrt.** Ohne gueltige Version wird ein Konfigurationsfehler angezeigt.

## Partial-Debug-Modus (2026-09-10)

Production remains globally blocked due to Main Trial 28.
Partial debug testing is permitted only for individually validated conditions.
Currently only versions 1 and 3 are individually validated.
Versions 2 and 4 remain unavailable.
Partial debug mode is not evidence that the full experiment is ready for data collection.

Nur ein eindeutiges `debug=1` aktiviert `loadAiResources(condition, { allowValidatedPartial: debugEnabled })`.
Bei globalem Status `false` muss die Version in `valid_versions` stehen. Fehlender oder unklarer Status bleibt gesperrt.
Die versionsspezifische Datei muss existieren und alle bisherigen Condition-, 40-Trial-, Excel-Import-, CSV- und Trialplan-Pruefungen bestehen.
Erst nach erfolgreicher Pruefung erscheint die Warnung `DEBUG PARTIAL VALIDATION` mit Version und Upload-Ausschluss in der Browserkonsole.
Ohne Debug bleibt das bisherige globale Produktions-Gate fuer alle vier Versionen erhalten, auch bei vorhandenem LOW-Plan.
Debug-Submit bietet ausschliesslich lokalen CSV-Download; kein DataPipe-/OSF-Upload.
Quelldaten, Main Trial 28, Misses/False Alarms, High-Regel und validation_status.json bleiben unveraendert. Keine v2/v4-Plaene erzeugt.

Lokale Tests bei laufendem HTTP-Server (`python -m http.server 8000 --bind 127.0.0.1`):
- http://127.0.0.1:8000/index.html?version=1&debug=1
- http://127.0.0.1:8000/index.html?version=3&debug=1

Aktuelle Verifikation:
- `node --test tests/*.test.cjs`: 102/102 bestanden. Normale Starts aller Versionen gesperrt; Debug v1/v3 erlaubt, v2/v4 gesperrt; fehlende Dateien, unvollstaendige Plaene, Condition-/Excel-/CSV-/Miss-ID-Fehler weiterhin abgewiesen. Global gueltige Produktionsfixtures aller vier Versionen unveraendert ladbar.
- URL-/Submit-Integration: nur eindeutiges debug=1 aktiviert Partial-Loading; Debug-Submit ohne Netzwerkanfrage, lokaler Download verfuegbar. Bestehender CSV-Downloadtest besteht.
- `python -m unittest discover -s scripts -p 'test_*.py'`: 18/18 bestanden.
- `python scripts/build_trial_specs.py --check`: 96 Ausgaben verifiziert (5/10/30 Trials).
- `python scripts/build_predictability.py --check`: erwarteter Exitcode 1, ausschliesslich bekannter High-Blocker Main Trial 28; valid_versions=[1,3], Produktionsstart gesperrt.
- JavaScript-Syntaxchecks und `git diff --check`: bestanden.
- Grenze: Node-VM-/DOM-Tests und Python-Quellenchecks; kein vollstaendiger Browserlauf und kein echter Upload ausgefuehrt.

## Preview-CSV-Fix (2026-09-10)

Ursache der Meldung `Preview could not be loaded.`: Die unveraenderte Datei `tabellen/stimulus_001.csv` endet mit einem Zeilenumbruch. PapaParse 5.4.1 liefert ohne `skipEmptyLines` 81 Datensaetze und einen `TooFewFields`-Fehler fuer den abschliessenden leeren Datensatz (row 80). Mit `skipEmptyLines: true` werden alle 80 Symbole fehlerfrei eingelesen. Die gemeinsame Preview fuer Customization und Standard verwendet jetzt diese Einstellung; echte CSV-Fehler bleiben gesperrt.

Checks: 104/104 JavaScript-Tests und 18/18 Python-Tests bestanden; JavaScript-Syntaxcheck bestanden. Zusaetzlich jeweils drei Preview-Durchlaeufe fuer v1/v3 mit echtem PapaParse 5.4.1 und Original-CSV im Node-DOM-Harness erfolgreich (14 geplante Preview-Ringe). Regressionstests pruefen Leerzeilenoption, erfolgreichen Abschluss und weiterhin abgewiesene CSV-Fehler. Kein vollstaendiger Browserlauf; der Parser wurde nur temporaer fuer die Diagnose geladen, keine neue Projektabhaengigkeit eingefuehrt.

Keine Stimuli, Quelldaten oder Trialplaene geaendert. Produktions-Gate, Main-Trial-28-Blocker und Debug ohne Upload bleiben erhalten.

## Sichtbare Preview-Schritte (aktueller Nutzerauftrag)

Gemeinsame Preview auf 180 ms pro Suchkombination verlangsamt (32 Schritte, 5,76 Sekunden). Die aktive Kombination aus Richtung, Hintergrund, Groesse und Typ wird unter dem bestehenden Suchstatus angezeigt. Ringe erscheinen kumulativ entsprechend der Auswahl; Apply entfernt vorherige Ringe und startet mit der aktuellen Auswahl neu. Eigentliche AI-Trials behalten 15 ms pro Schritt. Keine Aenderung an Quellen, Markierungszuordnung, Produktions-Gate oder Upload.

Verifikation: 105/105 JavaScript-Tests bestanden, einschliesslich schrittweisem Ringaufbau, Auswahlwechsel und erneutem Apply, Standard-Preview, unveraendertem AI-Timing und Cleanup. Syntaxchecks bestanden. Kein visueller Browserlauf; wahrgenommene Lesbarkeit ist lokal zu pruefen.
