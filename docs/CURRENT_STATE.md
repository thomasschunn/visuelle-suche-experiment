# Bestandsaufnahme

## Endabnahme

96 JavaScript- und 18 Python-Tests bestanden. DataPipe-Erfolgsvertrag korrigiert; abgelehnte Teilplaene werden nicht mehr exportiert; doppelte CSV-Zeilenreferenzen werden zur Laufzeit verworfen. Keine Produktionsfreigabe: Main-Trial 28, fehlende Originalreferenz und manueller Browser-/Uploadtest bleiben offen. Vollstaendige Ergebnisse und Startanleitung: [FINAL_QA_REPORT.md](FINAL_QA_REPORT.md).


## Datenspeicherung (aktueller Stand)

UUID pro Sitzung, optionale Prolific-URL-Felder, globale Condition-/Agent-Metadaten. Upload ausschliesslich nach Submit ueber bestehenden DataPipe-Endpunkt. Analyseexport mit flachen Surveywerten, Bereichspruefung 1-7/Yes-No 1-2, Originaltexten und flachen Standard-Auswahlspalten. Retry und lokaler CSV-Download bei Uploadfehlern; Debug ohne Upload. Vollstaendiges aktuelles Variablenverzeichnis: DATA_SCHEMA.md. Startsperre Main-Trial 28 unveraendert.


## Finaler Fragebogen (aktueller Stand)

Der finale Fragebogenblock ist fuer alle vier Versionen nach Responsibility eingebunden. Die alten drei cust_* Items sind durch die fuenf manip_* Checks ersetzt. Zwei unabhaengige Pattern-Zweige verwenden zentrale Yes/No-Codes und verpflichtenden Freitext ausschliesslich im Yes-Zweig. Sechs AI-Attitude-Items nutzen die vorgegebenen Not-at-all/Definitely-Anker. Texte stammen wortgetreu aus dem aktuellen Auftrag. Automatisierte Tests pruefen alle vier Yes/No-Kombinationen in jeder Version, Pflichtfelder und alle sieben Skalenwerte. Die globale Startsperre wegen Main-Trial 28 bleibt bestehen.


## Main Task und Post-Fragen (aktueller Stand)

experiment.js fuehrt nach den 30 geplanten Main-Trials unmittelbar Post-Einleitung, Satisfaction, Trust, separates Responsibility-Szenario und Responsibility-Fragen aus. Vorhandene Customization-Manipulationsfragen folgen erst danach. createPerceptionSurvey wird fuer Pre/Post gemeinsam verwendet; alle Antworten werden flach von Pluginindices 0-6 nach 1-7 konvertiert. Kein zweiter AI-Trialrenderer. Der Loader prueft weiterhin alle 30 Main-Trials gegen den generierten Main-Import. Automatisierte V1/V3-Tests pruefen Reihenfolge, wortgetreue Texte, alle sieben Skalenwerte und die Antwortfreigabe von Main-Trial 30. Kein vollstaendiger Browserdurchlauf: die globale Startsperre wegen Trial 28 bleibt bestehen.


## Abschnitt nach AI Practice (aktueller Stand)

Der gemeinsame Abschnitt ist in experiment.js zwischen AI Practice und Main Task eingebunden: bestehender Reminder, 10 geplante AI-Trials, separates Wahrnehmungsintro, Ownership, Satisfaction, Trust, dynamische Main-Ueberleitung (Start). Der vorhandene Wahrnehmungsintrotext bleibt unveraendert. Survey-Antworten werden validiert, von 0-6 nach 1-7 umgerechnet und flach gespeichert; das rohe response-Objekt wird entfernt. Auch die verbleibenden alten Abschluss-Likert-Fragen verwenden diese Konvertierung, damit dort keine 0-6-Werte exportiert werden. Die globale Startsperre bleibt aktiv. Flow-/Datentests fuer v1/v3 verwenden isolierte AI-Trial-Stubs; die echte AI-Trial-Engine hat separate Tests.


## Aktueller Stand: bestaetigter Validation Blocker (Trial 28)

Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip.
Problem: required orange misses = 2, available orange targets = 1.
Excel: 100 Symbole, 3 Targets, 2 Misses, 1 False Alarm, Agent Verdict: Pass. CSV: 1 oranges und 2 blaue Targets.

Quelldaten und High-Regel bleiben unveraendert. Vollstaendige gueltige Low-Condition-Plaene (v1/v3) werden erzeugt; v2/v4 bleiben blockiert. Der Gesamtbuild meldet weiterhin einen Validation Error (Exitcode 1). `data/generated/conditions/validation_status.json` sperrt den regulaeren Start ALLER Versionen, bis ein korrigierter Stimulus oder eine ausdrueckliche Ausnahmeentscheidung vorliegt und der Build erfolgreich validiert. Fehlender Status sperrt ebenfalls. Keine unvollstaendigen High-Plaene werden als Experimentplaene exportiert. Diese Regel ersetzt die fruehere Aussage, bei diesem Blocker ueberhaupt keine Condition-Plaene zu exportieren.


## Aktuell: gemeinsame AI-Trials und validierter Plan-Loader

- Neu: `ai-trial.js` mit `createAiTrial`, `validateAiTrialInput`, `loadAiResources`; in index.html eingebunden. Die alte 80-Runden-Schleife, ANZAHL_RUNDEN, SEQUENZ_SCHRITT_MS, alte CSV-Markierungsgruppen/Fallback-Funktion und deren globaler Zeichenspeicher sind entfernt.
- experiment.js lädt vor `jsPsych.run` den passenden vorverarbeiteten v1–v4-Plan. Planmetadaten, 10/30-Reihenfolge, Excel-Verdicts/-Anzahlen und vollständige CSV-Symbolmetadaten werden geprüft. Fehlende/inkonsistente Quellen zeigen einen Konfigurationsfehler, ohne Trialstart oder Upload. Kein Rückgriff auf Prototypstimuli oder spontane Fehlerverteilung.
- Zwei Timeline-Knoten für 10 AI-Practice- und 30 Main-Trials verwenden dieselbe Factory. Die aktuellen Suchpräferenzen und Agent-ID werden erst bei Darstellung gelesen, nachdem der Standard-/Customization-Zweig beendet wurde.
- Die Suchvisualisierung zeigt die 32 Kombinationen der aktuellen Reihenfolge. Nach der Suche wird die konkrete geplante Ringmenge gemeinsam eingeblendet; es wird keine zusätzliche Reihenfolge der Fehlersymbole erfunden. Der Plan-Verdict wird als PASS/REJECT grün/rot hervorgehoben. Die getrennten Teilnehmerbuttons werden erst dann freigegeben und beenden ausschließlich per Klick.
- Nicht interaktive Ringe werden anhand der tatsächlich geladenen Bildbreite skaliert; die importierten Bilder sind nicht an die alte 1920px-Annahme gebunden. Keine Klick-/Drag-Handler am KI-Bild oder seinen Ringen. Animationen werden bei Ende abgeräumt; Bildladefehler erzeugen keine Antwort.
- Antwortdaten enthalten alle geforderten Felder, boolesche Übereinstimmung/Korrektheit und JSON-kodierte ID-Listen. Kein Symboltable-Duplikat. RT umfasst die Zeit ab Bildfreigabe einschließlich Suchanimation; Animationsdauer separat. DATA_SCHEMA.md dokumentiert Details.
- 67 Node-Tests bestanden: alle Kombinationen aus Phase, Version und PASS/REJECT, unveränderte Planaussage trotz abweichender Ringzahl, Markersperre, unmittelbarer Klickabschluss, Daten/Timing, Cleanup, Loader-Fehler und Quellenabgleich; bestehende Intro-/Preview-/Trainingschecks bleiben erfolgreich. Die bisherigen Tests der entfernten Altlogik wurden ersetzt.
- Echter Teilnehmerstart aktuell bewusst blockiert: vollständige Condition-Dateien fehlen weiterhin wegen des mathematischen High-Fehlers bei Main-Trial 28. Die Quellen-JSONs sind vorhanden, reichen ohne konkrete validierte Markierungspläne aber nicht zum Start. Tests verwenden ausdrücklich synthetische Fixtures und DOM/jsPsych-Stubs; kein Browser-/Uploadtest.
- Zwischen AI Practice und Main fehlen weiterhin die gesondert spezifizierten neuen Fragebögen/Übergangsseiten; dieser Schritt fügt keine fehlenden Referenztexte oder Surveyitems hinzu.

## Aktuell: Assetzuordnung bestätigt und Quellenimport erfolgreich

- Nutzerbestätigte Einzelzuordnung in scripts/source_asset_mapping.json gespeichert. ZIP-Nummern sind fortlaufende Generatorzähler, keine Trialnummern. Main-Trial 24 verwendet ausdrücklich visual_search_data(50).zip; (49) ist superseded und bleibt unverändert erhalten. Main 25–30 verwendet (51)–(56). Die Ausnahme wird beim Build geprüft und in SOURCE_MAPPING.md ausgegeben.
- Quellenbuild erfolgreich: training_trials.json (5), pre_trials.json (10), main_trials.json (30), eindeutige Assetkopien, source_cells.json und build_manifest.json. `--check` bestätigt alle 96 Ausgaben bytegenau.
- 7 Importtests und 8 Predictability-Tests bestanden. Der reguläre Predictability-Build scheitert jetzt nur noch an High/Main-Trial 28 (2 Misses, 1 oranges L/O). Keine Condition-Pläne erzeugt, kein Runtime-/Excel-/Rohasset-Umbau.
- Frühere Hinweise auf eine offene Trial-24-Zuordnung in den historischen Abschnitten sind damit erledigt.

## Aktuell: Predictability-Preprocessing implementiert, vollständiger Build blockiert

- Neu: scripts/build_predictability.py und scripts/test_predictability.py. Offline-Zuordnung mit Seed 20260909, Algorithmuskennung predictability-v1, stabilen CSV-Zeilen-IDs, markierten Symbolen, Miss-/FA-Listen und expliziter Fehlerreihenfolge. Keine Änderung der Browser-/Experimentlogik.
- Exakte kategoriale Suche statt zufälliger Versuche: mögliche Anzahlen je Farbe/Größe/Buchstabe werden vollständig aufgezählt. Low verwendet Backtracking und berücksichtigt die letzten zwei Fehler auch über Trial- und Phasengrenzen. Gleichstände und konkrete Symbolwahl werden per Seed/SHA-256 deterministisch entschieden. Definition des Ausgewogenheitsziels siehe scripts/README.md.
- Alle fünf geforderten Validierungen sind implementiert. High prüft Orange und die bestmögliche Größe-/Buchstabenbalance; Low prüft Serien und wiederholt die deterministische Optimierung. Anzahlen werden aus den tatsächlich markierten L/O beziehungsweise Nicht-L/O abgeleitet und gegen Excel geprüft; Verdict bleibt unverändert aus Excel.
- Acht Predictability-Tests plus sechs Importtests bestanden. Unter beiden rein hypothetischen Trial-24-Zuordnungen: Low 40/40 gültig, High 39/40 gültig, Main-Trial 28 mathematisch unmöglich (2 geforderte Misses, nur 1 oranges L/O). Vier vollständige Condition-Pläne werden zusätzlich ausschließlich auf expliziten synthetischen Testdaten geprüft; keine Ersatzdaten exportiert.
- Regulärer Build stoppt bereits an der unbestätigten Assetzuordnung. `--audit-candidates` prüft beide Möglichkeiten nur im Speicher und meldet für beide den High-Fehler. Keine finalen Condition-JSONs oder sonstigen generierten Trialdateien erstellt. Details: docs/PREDICTABILITY_VALIDATION.md.

## Aktuell: Quellen vorhanden, Import vorbereitet, Asset-Zuordnung noch offen

- Neue echte Quellen: Stimuli_log.xlsx, PrePO_Images.7z, Post_PO_Images.7z und ausgepackte ZIP-Verzeichnisse. Fünf Excel-Sheets, darunter die vier geforderten; PrePO mit 16 vollständigen Specs, PostPO mit 30 vollständigen Specs und leeren Platzhaltern für 31–60. Keine Auswahlspalte im aktuellen Workbook.
- Neu: scripts/build_trial_specs.py (Python-Standardbibliothek), scripts/source_asset_mapping.json, scripts/test_build_trial_specs.py, scripts/README.md. Validiert exakte Excel-Werte, CSV-/Generatorzahlen, Archivmitglieder und reproduzierbare Ausgabe. Keine Rohdateien verändert, keine WebApp-/Predictability-Umstellung.
- scripts/source_asset_mapping.json ist ein unbestätigter Zuordnungsentwurf. Main-Trial 24 passt sowohl zu ZIP (49) als auch (50); außerdem muss die numerische ZIP-Reihenfolge bestätigt werden. Der reguläre Build stoppt deshalb mit Exit-Code 1 vor Ausgabe. docs/SOURCE_MAPPING.md zeigt einen ausdrücklich vorläufigen Quellennachweis mit beiden Kandidaten; finale JSONs/Assets wurden nicht exportiert.
- Sechs Python-Tests bestanden: beide realen Kandidaten nur im Speicher geprüft, 5/10/30 Counts, sämtliche Misses/FAs/Verdicts gegen Excel, byteidentische Wiederholungen, absichtlich falsche Assetzuordnung, fehlende Zellen, neue uninterpretierte Auswahlspalte und Nicht-Neuberechnung von Excel-Verdicts. Tests verändern keine Rohquellen.
- Historische Aussagen weiter unten über fehlendes Excel bzw. fehlende Pre_PO-/Post_PO-Quellen sind überholt. Aktuelle offene Punkte stehen am Anfang von OPEN_QUESTIONS.md.

## Aktuell: Standard-Zweig für Version 3/4

- Neu: `standard.js` erstellt feste Preview, Änderungswunschfrage und drei bedingt eingebundene Freitextfragen. `experiment.js` verbindet diese mit den zwei vorhandenen Standard-Instruktionen und den gemeinsamen Fehler-/Practice-Seiten. Der Zweig läuft nur für Version 3/4 und endet nach der AI-Practice-Erinnerung; Version 1/2 bleibt im Customization-Zweig.
- `STANDARD_SEARCH_STARTS` in `conditions.js` definiert top left/dark/large/L. Sowohl die Standard-Preview als auch die bisherigen globalen Standards in `config.js` beziehen ihre Werte daraus. Vollständige Reihenfolgen: Direction top left → top right → bottom right → bottom left; Background dark → light; Size large → small; Type L → O.
- Eine gemeinsame Funktion `mountSearchPreview` in `customization.js` steuert beide Previews. Customization verwendet auswählbare Einstellungen; Standard übergibt unveränderliche Einstellungen und zeigt keine Eingabefelder. Preview/Proceed, CSV-Laden, 32 Schritte, Ringrendering, Wiederholungen, Fehlerbehandlung und Cleanup verwenden dieselbe Engine. Zeitkonstante bleibt SEARCH_STEP_MS=15.
- Standard-Fragen, Optionen und Folgefragen sind wortgleich aus dem aktuellen Auftrag übernommen. Vorläufig Einzelwahl, da Checkboxen ohne Referenz nicht belegt sind. Nur passende Folgefrage; bei „I wouldn‘t change anything“ keine. Speicherung siehe DATA_SCHEMA.md.
- Originalreferenz und finale Excel-Spezifikation fehlen. Colour-/Size-Textinkonsistenz und ungeklärte Auswahlart sind in OPEN_QUESTIONS.md dokumentiert. Keine zusätzliche Farblogik implementiert.
- Alle 56 Node-Tests bestanden. Version 3/4 jeweils mit allen vier Antwortpfaden vom DA02-Intro über wiederholte Preview bis einschließlich Fehlerhinweis und Practice-Erinnerung geprüft. Zusätzlich Regressionstests für Version 1/2, Training und unveränderte Condition-Auswahl. Syntax-/Diff-Checks bestanden; kein Browser-/CDN-Test und kein Upload.
- Die separate 10-Trial-AI-Practice-Phase ist weiterhin nicht implementiert; nach der hier geprüften Grenze folgt noch die alte KI-Rundenschleife. Dieser Schritt betrifft ausschließlich deren vorgelagerten Standard-Zweig.

## Aktuell: Customization für Version 1/2

- `customization.js` definiert und validiert die vier Startpräferenzen, bildet ihre vollständigen Reihenfolgen und die 32 Kombinationen. Direction ist die äußere, Type die innere Schleife entsprechend der vorhandenen Kategorienfolge Direction → Background → Size → Type.
- `experiment.js` behält den sechsseitigen Zweig ausschließlich für Version 1/2. Agent-ID wird nach Validierung uppercase als globale Datenproperty und Trialdatum gespeichert. Die Oberfläche zeigt pro Dimension die vollständige Reihenfolge, aktualisiert bei Auswahländerung.
- Apply übernimmt die Einstellungen und startet die echte Preview `bilder/stimulus_001.jpg` mit `tabellen/stimulus_001.csv`. Keine Wiederverwendung der alten fünf Rendergruppen für die L/O-Suche. 32 Schritte à zentralem `SEARCH_STEP_MS = 15` aus config.js; `SEQUENZ_SCHRITT_MS` bleibt ausschließlich für die noch alte reguläre KI-Suche bestehen.
- Preview-Ringe bleiben nicht interaktiv. CSV-markierte T/Q bleiben als bisherige Restmarkierungen am Ende erhalten; keine zusätzliche Kombination oder neue Zeitkonstante. Datenfehler/Ladefehler geben Apply/Proceed wieder frei; fehlende CSV-Markierungswerte werden in dieser Preview nicht durch erfundene Markierungen ersetzt.
- Während Laden/Suche sind Auswahl, Apply und Proceed gesperrt; nach dem letzten Schritt sind sie wieder verfügbar. Die Animation beendet keinen Trial. Proceed speichert auch Änderungen ohne erneutes Apply. Lauf-/Generationprüfung verhindert verspätete Animationen nach dem Verlassen der Seite; Wiederholungen löschen zuvor dargestellte Ringe.
- `participantCustomization` und globale jsPsych-Felder halten ID und vollständige aktuelle Reihenfolgen. Serialisierung siehe DATA_SCHEMA.md. Die reguläre KI-Trial-Animation verwendet vorerst weiter ihre alte Gruppierung; deren Umstellung und Low-/High-Verhalten sind nicht Bestandteil dieses Customization-Schritts.
- **Referenztreue bleibt blockiert:** Original-PowerPoint/PDF fehlt; Bestandswortlaut vorläufig übernommen. Timingdiskrepanz und Preview-Fehlermarkierungen stehen in OPEN_QUESTIONS.md.
- 48 Node-Tests bestanden, darunter Version 1/2 mit je drei Apply-Durchläufen, ID-Validierung, alle 32 Startkonfigurationen, sichtbare Reihenfolgen, 32 Schritte à 15 ms, nicht interaktive Ringe, aktuelle Werte bei Proceed, Wiederholung nach Ladefehler und verspätete Ladeantworten. Vorhandene Version-3/4- und Trainingstests bleiben erfolgreich. Kein Browser-/Uploadtest.

## Aktuell: gemeinsamer Anfang und Trainingsdatenerfassung

- Neu: `common-start.js` mit `createCommonBeginning(jsPsych)`. `experiment.js` bindet denselben Anfang ohne Condition-Verzweigung für alle vier Versionen ein: Brillencheck, Context, Task, Practice, fünf Trainings und Übergang. `index.html` lädt das Modul vor `experiment.js`.
- Originalreferenz weiterhin nicht vorhanden. Bestehende Texte übernommen; Task-Sätze stimmen mit dem Wortlaut des aktuellen Arbeitsauftrags überein. Practice-Button jetzt `Next`, da kein spezieller Referenzbutton belegt ist. Der übrige Flow nach dem Anfang bleibt bestehen.
- Training verwendet temporär die fünf bestehenden JPGs und lädt keine KI-/Zeichentabellen. Freie Marker bleiben entfernbar. Buttons `reject`/`pass` beenden sofort, mit Schutz gegen doppelte Antwort. Freigabe erst nach erfolgreichem Bildladen; RT beginnt bei dieser Freigabe, ohne Antwortzeitlimit.
- Datenfelder und zentrale Codierung (pass=1, reject=2) stehen in [DATA_SCHEMA.md](DATA_SCHEMA.md). `trial_index` wird im Trainings-`on_finish` phasenlokal auf 1–5 gesetzt, statt den globalen jsPsych-Index zu übernehmen.
- Die interne Defektklassifikation in `functions.js` zählt nun alle L/O unabhängig von Farbe/Größe; andere Zeichen nicht. Explizite CSV-KI-Markierungen bleiben unverändert.
- Alle 44 Tests bestanden: jedes der fünf Trainings mit beiden Entscheidungen in allen vier Versionen, Metadaten, RT, Markerzahl nach Entfernen, Doppelantwortschutz, phasenlokaler Index nach `on_finish`, identischer Anfang, Task-Wortlaut und Bildladefreigabe. Syntax- und Diff-Checks bestanden. Node-VM/DOM-Stubs, kein Browserlauf und kein Upload. Referenztreue über die gelieferten Task-Sätze hinaus bleibt blockiert.

Die nachstehenden Abschnitte dokumentieren frühere Arbeitsschritte; Aussagen zum noch alten Trainingsschema und der früher falschen Defektregel sind durch diesen Abschnitt ersetzt.

Stand: 2026-09-09, nach Bereinigung der veralteten Experimentlogik. Maßstab: [REQUIREMENTS.md](REQUIREMENTS.md).

## Aktueller Stand nach Bereinigung

- Die vier URL-Conditions und globalen Datenproperties bleiben erhalten. Alle vier Teilnehmerflüsse starten weiterhin mit Brillencheck und fünf manuellen Trainingstrials.
- Aus `config.js`, `functions.js` und `experiment.js` entfernt: `RUNDEN_DAUER_SEK`, `RUNDEN_OHNE_DRIFT`, `ANZAHL_DRIFT_RINGE`, `FIXATION_DAUER_MS`, `berechneDrift()`, zufällige Driftauswahl, `wird_verschoben`, Ringversatz, Countdown und automatische Fixationstrials.
- Recalibrate-Button, `experimentAborted`, dadurch ausgelöstes Überspringen von Runden, Recalibration-Freitext und ausschließlich auf Recalibration bezogener Outro-Absatz entfernt. Keine Ersatztexte oder Fragen erfunden; übrige Referenztexte unverändert.
- Admin-Skip, Admin-Zustand, Admin-Weiter-Button und veraltete Admin-Konfiguration entfernt, auch im Debugmodus. `debug=1` bietet nur noch Weiter und die bestehende, per Button beendete Eyetracker-Kalibrierung. Debug weiterhin ohne Upload, normaler OSF/DataPipe-Export unverändert.
- Reguläre KI-Trials erhalten als minimalen Weiterweg Pass-/Reject-Buttons. Sie speichern `runde`, `is_training: false` und `entscheidung` als Pass/Reject, analog zum bestehenden Training. Entscheidungen sind ohne vorgeschriebene Wartefrist möglich, auch während der Suchanimation. Die alten Ringkorrekturzähler und Beendigungsgründe entfallen mit der zugehörigen Aufgabe. Die spätere vollständige KI-Aufgabenimplementierung bleibt ausstehend.
- `renderRing()` ist ausschließlich nicht interaktiv: kein Klickhandler, keine Positionsänderung, `pointer-events: none`. Dies gilt für KI-Trials und Customization-Demo. `renderTrainingMarker()` kapselt die bisherige frei platzierbare und entfernbare 40-px-Zählhilfe. CSS-Hover zum Löschen gilt nur für `.training-marker`; die alte Positionsanimation ist entfernt.
- Die beiden verbleibenden `setInterval`-Aufrufe animieren ausschließlich Demo beziehungsweise KI-Suche. Ihr Ablauf beendet keinen Trial. Beim Entscheiden oder Beenden eines KI-Trials werden Animationsintervalle gelöscht; verspätete Ladeantworten können keine neue Animation starten. Jede Suchanimation verwendet ihre eigenen geladenen Zeichendaten, damit verspätete Antworten früherer Trials sie nicht ersetzen.
- `Final Anomaly Scan` bleibt bewusst erhalten: Die fünfte Rendergruppe enthielt bereits unabhängig von Drift alle per CSV markierten Zeichen, die keiner der vier Suchpräferenzen entsprechen (`functions.js`, `ladeTabelleUndBereiteVor`). Nur die frühere Driftzuweisung zu dieser Gruppe wurde entfernt. Eine neue Suchreihenfolge wird ohne Referenz nicht festgelegt.
- Weiterhin offen: Defektregel im CSV-Fallback, Referenz-/Excel-Spezifikation, Low-/High-Verhalten, Trialzuordnung und 80 statt 10+30 KI-Trials, fehlende Stimuli 071–080, zusätzliche Fragebögen/Antwortcodierung sowie Upload-Erfolgsprüfung. Die historische Bestandsaufnahme unten beschreibt diese Punkte ausführlicher.

### Checks dieses Schritts

- `node --test tests/conditions.test.cjs tests/trial-interaction.test.cjs`: 33 Tests bestanden. Geprüft: alle vier Conditions, ungültige URLs, Debug-Kalibrierung ohne Skip, kein Zeitende trotz vielfacher Animationsschritte, Pass/Reject, nicht bearbeitbare KI-Ringe, entfernbare Trainingsmarker, Informationsbutton, Animation-Cleanup und verspätete CSV-Antworten. Synthetische Testdaten sind ausschließlich Testfixtures, keine experimentellen Stimuli.
- JavaScript-Syntaxchecks für alle vier Projekt-Skripte und `git diff --check` erfolgreich.
- Projektweite Suche nach allen acht geforderten Begriffen: Treffer nur in Dokumentation und im Test, der die Abwesenheit von `trial_duration` prüft; keine Verwendung in den Laufzeitdateien. Zusätzlich auf alte Drift-, Abbruch- und Admin-Skip-Bezeichner geprüft.
- Alle 150 JPG-/CSV-Dateien gegen die vor diesem Schritt erfassten SHA-256-Hashes geprüft: unverändert, keine Datei entfernt oder hinzugefügt.
- Prüfungen verwenden Node-VM mit DOM-/jsPsych-Stubs; kein Browser-/CDN-Test und kein Daten-Upload ausgeführt.

## Historischer Stand nach Einführung der Condition-Architektur

Dieser Abschnitt beschreibt den vorherigen Arbeitsschritt. Aussagen zu Admin-Skip, unveränderten Countdown-/Ringpfaden und damaligen Tests werden durch den aktuellen Stand oben ersetzt.

- `conditions.js` enthält vier unveränderliche Definitionen: 1 = customization/low, 2 = customization/high, 3 = standard/low, 4 = standard/high. Standard verwendet den festen Namen DA02; Customization weiterhin die vorhandene Teilnehmereingabe.
- `index.html` lädt die Definitionen vor den übrigen Projekt-Skripten. `experiment.js` validiert die URL vor `initJsPsych`: fehlende, doppelte oder ungültige Versionsparameter zeigen eine Konfigurationsfehlerseite, ohne Timeline oder Upload zu starten.
- Alle drei Condition-Metadaten werden unmittelbar nach Initialisierung global gespeichert. Die alte Variable `aktuelleVersuchsGruppe` und das alte Datenfeld `versuchsgruppe` sind entfernt; maßgeblich ist `experiment_version` zusammen mit den beiden Condition-Feldern.
- Im normalen Ablauf entfällt das Setupmenü. Version 1/2 nutzt den bisherigen Customization-Zweig, Version 3/4 den Standard-Zweig. Alle vier starten mit dem Brillencheck und erhalten das bisherige Training.
- Ausschließlich `?version=N&debug=1` aktiviert ein Entwicklungstools-Menü mit Weiter, Admin Skip und Kalibrierung. Dieses Menü verändert die Condition nicht. Admin-Zustand ist separat; Version 3 ist kein Admin-Modus mehr. Debugläufe zeigen am Ende Daten lokal an und führen keinen OSF-Upload aus; der bestehende Teilnehmerexport bleibt erhalten.
- Kein zusätzlicher Condition-Selector implementiert. Entwicklungsaufrufe benötigen ebenfalls eine gültige URL-Version.
- Low/High ist ausgewählt und gespeichert, beeinflusst aber noch nicht die KI-Darstellung. Fehlende Referenzparameter bleiben Blocker. Countdown, Ringinteraktion, Trialzahlen, Fragen und bestehende Teilnehmertexte bleiben entsprechend dem engen Auftrag unverändert.
- `tests/conditions.test.cjs` prüft mit Node-VM und jsPsych-/DOM-Stubs den tatsächlichen Skriptstart: vier Versionen, Metadaten vor Timeline-Start, Ablaufzweige, Standardname, fehlende/ungültige/doppelte Parameter, Debug-Abgrenzung, Admin/Kalibrierung und Script-Ladereihenfolge. Alle 21 Tests bestanden (`node --test tests/conditions.test.cjs`). Syntaxchecks und `git diff --check` ebenfalls erfolgreich. Kein Browser-/CDN- oder Uploadtest.

## Historische Bestandsaufnahme vor der Condition-Architektur

Die folgenden Abschnitte 1–6 dokumentieren den ursprünglichen Prototyp auf Basis vollständiger Quellcodelektüre, rekursiven Dateiinventars und Prüfung aller 75 CSVs. Aussagen zu alten Gruppen, fehlenden Condition-Metadaten, Dateiinventar und fehlenden Tests sind durch den aktuellen Abschnitt oben überholt; die übrigen Altlasten bestehen fort. Historische Zeilenangaben beziehen sich auf den ursprünglichen Stand.

## 1. Dateien und Verzeichnisse

| Pfad | Inhalt und Verwendung |
| --- | --- |
| `index.html` | Einstieg; lädt CDN-Abhängigkeiten und anschließend `config.js`, `functions.js`, `experiment.js` sowie `style.css`. HTML-Sprache `de`, überwiegend englische Teilnehmertexte. Pipe-Plugin ohne festgelegte Versionsnummer eingebunden. |
| `config.js` | OSF-ID, Teilnehmerkennung/Dateiname, globale Zustände, 5 Trainingstrials, 80 reguläre Runden, Drift ab Runde 10, 3 Drift-Ringe, 15 Sekunden Antwortcountdown, 600 ms Sequenzschritt, 3000 ms Fixation und Standard-Suchpräferenzen. |
| `functions.js` | `berechneDrift`, `renderRing`, `ladeTabelleUndBereiteVor`: Driftberechnung, skalierte Ringdarstellung und CSV-basierte Markierungs-/Suchgruppenlogik. |
| `experiment.js` | Gesamte Timeline, Setup-/Admin-/Kalibrierungsansichten, Instruktionen, Training, Standard-/Customization-Flows, Demo, alte KI-Runden, Abschlussfragebögen und Export. |
| `style.css` | Stimulus-/Panel-Layout, Buttons, Scanstatus und Ringdarstellung einschließlich anklickbarer Ringe und Lösch-Hover. Viel weiteres Styling ist direkt in `experiment.js` eingebettet. |
| `.vscode/launch.json` | Chrome-Debugstart gegen `http://localhost:8080`; startet selbst keinen Webserver. |
| `bilder/` | 75 JPGs: regulär 001–070 sowie Training 001–005. Keine weiteren Bilddateien gefunden; keine identischen SHA-256-Hashes unter diesen JPGs. |
| `tabellen/` | 75 gleichnamige CSVs; jedes CSV hat ein passendes JPG und umgekehrt. 70 reguläre Tabellen mit je 80 Zeichen, 5 Trainingstabellen mit je 40 Zeichen; insgesamt 5800 Datensätze. |
| `.git/` | Bestehende Git-Metadaten. Ausgangsstatus ohne lokale Änderungen; Statusprüfung über auf den Befehl begrenztes `safe.directory`, keine globale Git-Konfiguration geändert. |
| `docs/REQUIREMENTS.md` | In diesem Schritt angelegte Anforderungen und ausdrücklich getrennte Codebefunde. |
| `docs/CURRENT_STATE.md` | Diese Bestandsaufnahme. |
| `docs/OPEN_QUESTIONS.md` | In diesem Schritt angelegte Quellenblocker und echte Unklarheiten. |
| `AGENTS.md` | In diesem Schritt angelegte dauerhafte Arbeitsregeln. Vorher keine AGENTS.md im Workspace vorhanden. |

Keine README, Paketmanifest-/Lockdatei, Buildkonfiguration, automatisierte Tests oder lokal gespeicherten jsPsych-/PapaParse-Bibliotheken vorhanden. Keine PPT/PPTX, PDF, XLS/XLSX/XLSM/XLSB oder ODS gefunden; das Inventar enthält ausschließlich die oben aufgeführten Dateitypen.

## 2. Vorhandene CSV-Struktur

- Gemeinsame Spalten: `shape,center_x,center_y,color_hex,size_px,is_small,rotation,bg_luminance,bg_dark`.
- Reguläre Tabellen zusätzlich: `ist_fehler,bekommt_kreis`; Training ohne diese beiden Spalten.
- Vorhandene Zeichen: L, O, Q, T. Vorhandene Farben: `#0064FF` und `#FF8C00`.
- `bekommt_kreis` steuert bestehende KI-Markierungen. `ist_fehler` wird durch die aktuelle Logik nicht ausgewertet.
- CSVs enthalten Zeichenpositionen und Eigenschaften, aber keine vier Sheets und keine explizite Zuordnung zu den vier neuen Versionen oder Pre_PO/Post_PO.

## 3. Bereits nutzbare Bausteine

- Eine gemeinsame Anwendung mit bedingten Timeline-Zweigen besteht bereits.
- `createInfoScreen` erzeugt Informationsseiten mit eigenem Button und Standardtext `Next`; zugehörige Handler beenden die Seiten per Klick.
- Glasses/contacts check verlangt eine Auswahl, bevor der Button sichtbar wird; die Antwort wird global gespeichert.
- Kontext, Aufgabenbeschreibung und Practice-Erklärung sind vorhanden. Der Instruktionstext beschreibt bereits alle L/O als Defekte und die Schwelle größer 10.
- Fünf Trainingstrials ohne KI ermöglichen frei gesetzte und wieder entfernbare Zählkreise sowie Pass/Reject ohne Antworttimeout. Die vorbereiteten Trainings-CSV-Pfade werden dort nicht geladen; keine automatische Korrektheitsauswertung.
- KI-Einführung und getrennte Standard-/Customization-Instruktionen existieren. Customization enthält Namensvalidierung, vier Präferenz-Dropdowns und wiederholbare Demo mit Apply/Proceed.
- CSV-Download und Normalisierung von Boolean-Werten sowie skalierte Ringpositionen können als technische Grundlage dienen; ihre fachliche Logik muss angepasst werden.
- Vorhandene Survey-Bausteine: drei Customization-Items, zwei Trust-Items und Responsibility-Szenario mit zwei Items. Referenztreue derzeit nicht überprüfbar.
- CSV-Erzeugung und bestehender DataPipe-POST sind vorhanden und grundsätzlich zu erhalten.

## 4. Tatsächlicher Ablauf des Prototyps

Setupmenü mit Standard (alte Gruppe 1), Customization (alte Gruppe 2), Admin Skip (alte Gruppe 3) oder wiederholbarer 9-Punkt-Kalibrierung. Danach gegebenenfalls Admin-Konfiguration.

Für Gruppe 1/2: Brillencheck → Kontext → Aufgabe → Practice-Erklärung → 5 manuelle Trainingstrials → gemeinsame KI-Einführung. Standard zeigt anschließend zwei eigene Infoseiten; Customization zeigt zwei eigene Infoseiten, Identifikation, Einstellungen/Demo, KI-Fehlerhinweis und AI-Practice-Erinnerung.

Anschließend folgt für alle Gruppen dieselbe Schleife mit bis zu 80 KI-Runden. Ab Runde 2 liegt davor ein automatisch endender Fixationstrial. Admin überspringt die Runden vor 10. Recalibrate setzt `experimentAborted` und überspringt alle verbleibenden Runden. Eine separate AI-Practice-/Main-Task-Aufteilung existiert nicht.

Danach: gegebenenfalls Recalibration-Freitext → Customization-Fragen → Trust → Responsibility-Szenario und Fragen → Outro → Export (oder Datenanzeige im Admin-Modus).

## 5. Bekannte Abweichungen und Altlasten

| Befund | Codebezug | Auswirkung gegenüber REQUIREMENTS.md |
| --- | --- | --- |
| Alte Gruppen statt vier Versionen | `experiment.js:46`, `config.js` | Gruppe 1 bedeutet bisher Standard; Low/High fehlt vollständig. Alte IDs sind nicht die neuen Versions-IDs. Setupbezeichnungen sind im zugänglichen Startmenü sichtbar. |
| Falsche interne Defektregel | `functions.js:77` | `ist_ziel` zählt nur blaue L und orange O; widerspricht der bereits richtigen Instruktion und verfälscht Korrekturzähler/Fallback-Markierungen. |
| Erfundene Ersatzmarkierung möglich | `functions.js:82` | Fehlt `bekommt_kreis`, greift ein Fallback auf `ist_ziel`; fehlende Spezifikationswerte werden nicht als Blocker behandelt. |
| Countdown und Fixationstimeout | `experiment.js:781`, `experiment.js:859` | KI-Runden enden nach standardmäßig 15 Sekunden nach dem Scan automatisch; Fixationstrials nach 3000 ms. Beides widerspricht der wörtlichen Vorgabe, keinen Trial automatisch per Zeitlimit zu beenden. |
| KI-Ringe bearbeitbar | `functions.js:45`, `experiment.js:886` | `renderRing` erlaubt Löschen auch während der Demo/Scansequenz; nach dem Scan können Ringe hinzugefügt werden. Auch CSS signalisiert Löschbarkeit. |
| KI-Aufgabe weiterhin Ringkorrektur/Recalibrate | `experiment.js:784` | Reguläre KI-Runden bieten keine Pass-/Reject-Buttons und keine entsprechende Entscheidungsspeicherung; stattdessen Recalibrate, Timeout und Admin-Weiter. |
| Alte Driftmanipulation | `functions.js:4`, `functions.js:90` | Exponentieller Drift und zufällige Auswahl kleiner markierter Zeichen; keine belegte Umsetzung der neuen Predictability-Manipulation. |
| Falsche Trialzahl, fehlende Dateien | `config.js:10`, `experiment.js:743` | 80 Runden statt 10 AI Practice + 30 Main; reguläre Dateien 071–080 fehlen. Ab 071 drohen Bild-/Ladefehler; CSV-Fehler werden nur in der Konsole gemeldet. |
| Unvollständiger Standard-Flow | `experiment.js:422`, `experiment.js:734` | KI-Fehlerhinweis und AI-Practice-Erinnerung nur für Customization eingebunden; Standard erhält keine entsprechende Demo/Exploration trotz Instruktion. |
| Fehlende Messzeitpunkte/Fragebögen | `experiment.js:931` ff. | Psychological Ownership und Satisfaction fehlen; Trust nur einmal am Ende. Kein Übergang zur Main Task, keine Pattern- oder AI-Attitude-Fragen. Customization-Fragen können höchstens vorhandene Manipulationscheck-Bausteine sein, ihre Referenzzuordnung ist offen. |
| Falsche Fragebogenreihenfolge | `experiment.js:948` ff. | Customization-Items stehen vor Trust/Responsibility; gefordert sind Manipulation Checks nach Responsibility und zusätzliche Messung nach AI Practice. |
| Likert-Codierung nicht sichergestellt | `experiment.js:935` ff. | Labels zeigen 1–7, Antworten gehen unverändert vom Survey-Likert-Plugin in den Export. Keine Umrechnung/Validierung auf gespeicherte 1–7 im Projekt; tatsächliche Pluginwerte nicht lokal im Browser verifiziert. |
| Zentrale Yes/No-Codierung fehlt | gesamter Code | Kein gemeinsames Mapping 1=Yes/2=No. Brillencheck hat eigenständige 1/0-Codierung für zwei andere Aussagen. |
| Unbestätigte Referenztexte/Buttons | Intro, Demo, Fragebögen, Outro | Texte einschließlich 90%-Aussage sowie Buttons `Start Training`, `Proceed`, `start`, `Finish & Save Data` sind ohne Originalreferenz nicht freigegeben/verifizierbar. Keine eigenmächtige Ersetzung in diesem Schritt. |
| Alte Abschlussgeschichte | `experiment.js:974`, `experiment.js:990` | Responsibility erwähnt eine Pause, die im Ablauf fehlt; Outro thematisiert Recalibration statt des neuen Ablaufs. |
| Datenexport meldet zu früh Erfolg | `experiment.js:9` | `Data Saved!` erscheint unmittelbar nach Start des Fetch, ohne HTTP-Erfolg abzuwarten/zu prüfen; Fehler nur Konsole. Kein belegter erfolgreicher Upload. |
| Unvollständige Metadaten | `config.js`, `experiment.js:880` | Teilnehmer-ID steckt im Dateinamen; neue Versions-/Predictability-Metadaten fehlen. KI-Name und gewählte Präferenzen werden nicht explizit als globale Datenproperties gespeichert. |

Weitere technische Altlasten: alte `color`-/`shape`-Suchkategorien in `functions.js` ohne aktuelle UI-Auswahl; viele globale Variablen, DOM-Handler und Inline-Styles in einer großen Timeline-Datei. Diese sind Bestandsbefunde, kein Auftrag zu einem Refactor in diesem Schritt.

## 6. Ausgeführte Prüfungen und Grenzen

- Gesamtes Dateiinventar und alle Quell-/Konfigurationsdateien geprüft; alle CSVs eingelesen, Header/Zeilenzahlen und paarige Bilddateinamen geprüft.
- JavaScript-Syntax: `node --check config.js`, `node --check functions.js`, `node --check experiment.js` erfolgreich.
- Bestehende Dateien vor/nach Dokumentation per SHA-256 auf unveränderten Inhalt geprüft; Git-Diff/Status auf reine Dokumentation geprüft.
- Keine Browserdurchläufe, visuellen Stimulusvalidierungen oder Uploads ausgeführt. CDN-Pluginlaufzeit, wissenschaftliche Referenztreue und tatsächlicher DataPipe-Erfolg sind damit nicht bestätigt.

Fehlende Quellen und offene Spezifikationen: [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
