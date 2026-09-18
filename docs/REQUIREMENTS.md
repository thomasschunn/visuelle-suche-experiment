# Anforderungen an die neue Experimentversion

## Responsive Trial-Bildgroesse

Die fuenf manuellen Trainingsbilder, zehn PrePO-Bilder und dreissig PostPO-Bilder (alle 1000:800) verwenden dieselbe responsive Breitenregel. Sie passen bei normaler Browsergroesse mit oberem und unterem Freiraum in die sichtbare Hoehe. Die Breite ist zugleich durch den Platz neben der rechten Spalte und durch 1200 px begrenzt; auf groesseren Monitoren wachsen die Bilder bis zu dieser Grenze. Die rechte Trainings-/KI-Spalte behaelt ihre Groesse.

## Groesse der manuellen Trainingsmarker

Die frei setzbaren Marker im Training haben bei 1000 px Originalbildbreite 72 px Durchmesser und skalieren mit der dargestellten Bildbreite. So umfassen sie auch grosse Symbole (`size_px=35`). KI-Ringe und die Interaktion zum Entfernen bleiben unveraendert.

## Bildformat im manuellen Training

Die fuenf Trainingsbilder fuellen ihren Bildrahmen ohne seitliche graue Flaechen. Der Rahmen uebernimmt nach erfolgreichem Laden das tatsaechliche Seitenverhaeltnis des jeweiligen Bildes; Trainingsmarker und Trial-Antwortlogik bleiben unveraendert.

## KI-Ringposition in AI Practice und Main Task

KI-Ringe muessen auf den CSV-Symbolzentren der tatsaechlich dargestellten Bildflaeche liegen. Die Umrechnung beruecksichtigt die Layoutgroesse des Bildes und eventuelle `object-fit: contain`-Raender. Bild- und Symbolquellen sowie die zuletzt reduzierte Ringgroesse bleiben unveraendert.

## KI-Ringgroesse (aktueller Folgeauftrag)

Die automatisch um Symbole gesetzten KI-Ringe in Preview, AI Practice und Main Task werden gegenueber dem bisherigen Durchmesser um 25 % verkleinert. Mittelpunkt und CSV-Koordinaten bleiben unveraendert. Die Trainingsmarker haben eine separate Groesseneinstellung.

## Sichtbarkeit der Ringe

Die KI-Ringe in Preview, AI Practice und Main Task sowie die manuell gesetzten Trainingsmarker haben 75 % Deckkraft, damit darunterliegende Bilddetails sichtbar bleiben.

## Anzahl der KI-Markierungen beim Final Verdict

In AI Practice und Main Task erscheint beim Final Verdict zusaetzlich die Anzahl der von der KI gesetzten Ringe. Die Zahl stammt aus `ai_marked_symbol_ids` und stimmt dadurch mit den angezeigten KI-Markierungen ueberein.

## Rundencounter in KI-Trials

Oben rechts im KI-Panel zeigt ein Rundencounter die aktuelle Trialnummer. AI Practice (PrePO) zeigt `x/10`, Main Task (PostPO) zeigt `x/30`; beide Phasen zaehlen separat ab 1.

## Sichtbare Preview-Suche (aktueller Folgeauftrag)

Auf Nutzerwunsch laeuft die gemeinsame Customization-/Standard-Preview sichtbar schrittweise: eigener `PREVIEW_SEARCH_STEP_MS = 180` (32 Kombinationen, rund 5,76 Sekunden), Anzeige der aktiven Kombination und sukzessive Ringe in der gewaehlten Reihenfolge. Dies ersetzt ausschliesslich fuer die Preview die fruehere 15-ms-Vorgabe. `SEARCH_STEP_MS = 15` fuer AI Practice/Main bleibt erhalten. Keine automatische Teilnehmerantwort oder Trialbeendigung; Apply startet erneut, Proceed bleibt der Abschlussbutton.

## Datenspeicherung (aktueller Stand)

UUID pro Sitzung, optionale Prolific-URL-Felder, globale Condition-/Agent-Metadaten. Upload ausschliesslich nach Submit ueber bestehenden DataPipe-Endpunkt. Analyseexport mit flachen Surveywerten, Bereichspruefung 1-7/Yes-No 1-2, Originaltexten und flachen Standard-Auswahlspalten. Retry und lokaler CSV-Download bei Uploadfehlern; Debug ohne Upload. Vollstaendiges aktuelles Variablenverzeichnis: DATA_SCHEMA.md. Der validierte Condition-Status erlaubt nun alle vier Versionen.


## Finaler Fragebogen (aktueller Stand)

Finaler Block nach Responsibility: wortgetreue Einleitung aus Nutzerauftrag, fuenf Manipulation Checks (1-7 Strongly Disagree bis Strongly Agree), Defekt-Pattern, KI-Fehler-Pattern, sechs AI-Attitude-Items (1-7 Not at all bis Definitely). Alle Skalenitems verpflichtend. Pattern jeweils Yes/No, zentral YES_NO_CODES in config.js (yes=1, no=2). Nur Yes zeigt anschliessend die Pflichtfrage Which pattern did you notice? No speichert null als Text. Vorgegebene flache Variablennamen verwenden; keine rohen Pluginindices exportieren.


## Main Task und Post-Fragen (aktueller Stand)

Main Task: exakt 30 Trials ausschliesslich aus dem generierten Condition-Plan (gegen main_trials.json validiert), dieselbe createAiTrial()-Engine wie AI Practice. Direkt danach: vorgegebene Post-Task-Einleitung, Satisfaction (3 identische Items), Trust (2 identische Items), aktuelles Responsibility-Szenario und zwei Fragen. Texte wortgetreu aus dem Nutzerauftrag. Satisfaction/Trust als post_satisfaction_1..3 und post_trust_1..2; Responsibility als responsibility_self und responsibility_agent. Alle Werte numerisch 1-7. Informationsseiten: Next, kein Timeout. Der alte high-porosity-Text und AI-system-Itemtext sind abgeloest.


## Abschnitt nach AI Practice (aktueller Stand)

Nach dem bestehenden AI-Practice-Reminder folgen exakt 10 pre_trials, Wahrnehmungsintro, Psychological Ownership (4 Items), Satisfaction (3), Trust (2), danach die Main-Task-Ueberleitung mit aktuellem Agentennamen und Button Start. Die neun Items und die Ueberleitung werden wortgetreu aus dem Nutzerauftrag uebernommen. Skala 1 - Strongly Disagree bis 7 - Strongly Agree; flache pre_ownership_1..4, pre_satisfaction_1..3, pre_trust_1..2 als Zahlen 1-7, keine rohen 0-6-Antworten exportieren.


## Aktueller Stand: korrigierter Main-Trial 28

Main Trial 28 verwendet das vom Nutzer gelieferte `Post_PO_Images/visual_search_data_PostPO_28.zip`; das urspruengliche `visual_search_data(54).zip` bleibt erhalten. Excel: 100 Symbole, 3 Targets, 2 Misses, 1 False Alarm, Agent Verdict Pass. Die neue CSV hat zwei orange und ein blaues Target. Der vollstaendige Build erzeugt und validiert V1 bis V4; `validation_status.json` meldet `experiment_start_allowed=true` und keine Fehler. Die High-Regel bleibt unveraendert.


Stand: 2026-09-09. Verbindliche Grundlage ist der Arbeitsauftrag. Die unten separat aufgeführten Codebefunde beschreiben den Prototyp und sind keine zusätzlichen experimentellen Vorgaben. Referenzquellen fehlen derzeit; siehe [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).

## 1. Arbeitsweise und Umfang

- Direkt im bestehenden Workspace arbeiten; keine bestehenden Stimuli oder Referenzdateien löschen.
- Keine experimentellen Spezifikationen oder Excel-Werte erfinden. Fehlende Quellen und echte Unklarheiten als Blocker dokumentieren.
- Das Projekt muss nach jedem Schritt nachvollziehbar bleiben; relevante Checks ausführen.
- Der erste Schritt umfasste Bestandsaufnahme und Dokumentation, der zweite die zentrale Condition-Architektur. Der aktuelle Folgeauftrag erlaubt die gezielte Entfernung der alten Timer-, Drift-, Recalibrate-, Admin-Skip- und Fixationslogik sowie die Trennung von KI-Ringen und Trainingsmarkern. Fehlende neue experimentelle Spezifikationen weiterhin nicht erfinden.

## 2. Eine Codebasis, vier Experimentalversionen

| Version | Ausgestaltung | Vorhersagbarkeit |
| --- | --- | --- |
| 1 | Customization | Low Predictability |
| 2 | Customization | High Predictability |
| 3 | Standard | Low Predictability |
| 4 | Standard | High Predictability |

Alle Versionen werden aus derselben Codebasis erzeugt. Keine vier kopierten Projekte. Die technische Operationalisierung von Low/High ist ohne Referenz nicht festgelegt.

### Zentrale Condition-Architektur (Folgeauftrag)

- Zentrale Definition in `conditions.js` mit `version`, `customizationEnabled`, `customizationCondition` (`customization`/`standard`), `predictabilityCondition` (`low`/`high`), `agentNameMode` (`participant`/`fixed`) und `fixedAgentName` (Standard: `DA02`).
- Auswahl ausschließlich über genau einen gültigen URL-Parameter `?version=1`, `?version=2`, `?version=3` oder `?version=4`; kein zufälliger oder stiller Default.
- Ohne gültige Version verständlichen Konfigurationsfehler anzeigen und das Experiment nicht starten.
- Im normalen Teilnehmerfluss kein Condition-Menü. Entwicklungstools nur mit explizitem `debug=1`; Admin und Kalibrierung getrennt von der Condition verwalten. Ein Debug-Condition-Selector ist optional und derzeit nicht implementiert; auch Debug benötigt eine gültige URL-Version.
- Sofort nach jsPsych-Initialisierung, vor dem ersten Trial, globale Datenproperties setzen: `experiment_version`, `customization_condition`, `predictability_condition`.
- Alle vier URL-Versionen und ungültige Werte testen. Die Condition-Architektur bei der nachfolgenden Bereinigung erhalten.

## 3. Verbindliche Ablaufreihenfolge

Aktueller Folgeauftrag: gemeinsamen Anfang für alle vier Versionen in einem gemeinsamen Modul aufbauen: Glasses/contacts → Context → Task → Practice → exakt fünf manuelle Trainings → „You have finished the practice...“-Übergang. Exakte Originaltexte verwenden; ohne vorliegende PowerPoint/PDF bleibt deren Verifikation ein dokumentierter Blocker. Die im Auftrag gelieferten Task-Sätze sind verbindlich. Vorhandene fünf Trainingsbilder dürfen vorläufig verwendet werden; temporären Status in OPEN_QUESTIONS.md kennzeichnen.

Training zeigt ausschließlich Bild und frei setz-/entfernbare Zählmarker ohne KI oder Timer. `reject`/`pass` beendet unmittelbar. Pro Trial speichern: `phase = manual_training`, `trial_index`, `stimulus_id`, `participant_verdict` (`pass`/`reject`), `participant_verdict_code` (1/2), `rt`, `manual_marker_count_at_response`. Zentrale Pass-/Reject-Codierung und deren Zuordnung in DATA_SCHEMA.md dokumentieren. Alle fünf Trainingstrials testen.

Die Verzweigung wird hier zur eindeutigen Nummerierung als ein eigener Schritt geführt.

1. Glasses/contacts check.
2. Experimentkontext.
3. Aufgabenbeschreibung.
4. Practice-Erklärung.
5. Genau 5 Training Trials ohne KI.
6. Einführung der KI.
7. Customization-Flow für Version 1/2 beziehungsweise Standard-Flow für Version 3/4.
8. Erklärung, dass die KI Fehler machen kann.
9. Genau 10 AI-Practice-Trials.
10. Psychological Ownership + Satisfaction + Trust.
11. Übergang zur Main Task.
12. Genau 30 Main-Task-Trials.
13. Satisfaction + Trust.
14. Responsibility-Szenario + Responsibility-Fragen.
15. Manipulation Checks.
16. Pattern-Fragen.
17. AI-Attitude-Fragen.
18. Abschluss und Datenspeicherung.

Items, Bildzuordnungen, konkrete Darstellungen und genaue Texte dürfen nicht aus diesen Schrittnamen erfunden werden.

## 4. Defekt- und Entscheidungsregel

### Customization-Zweig (aktueller Folgeauftrag)

- Nur Version 1/2: AI assistance introduction → Customization introduction → Agent-ID → Interface/Preview → AI mistakes information → AI practice reminder. Exakte Referenztexte; fehlende Originale als Blocker dokumentieren.
- Agent-ID: zwei Buchstaben, zwei Ziffern, Groß-/Kleinschreibung akzeptieren, uppercase als `agent_id` speichern; ungültige Eingaben blockieren.
- Vier Dimensionen: Direction (top left, top right, bottom right, bottom left), Background (dark, light), Size (large, small), Type (L, O). Startpräferenz zuerst, anschließend Alternativen; Direction zyklisch in der genannten Reihenfolge. Vollständige Reihenfolgen sichtbar anzeigen.
- Apply übernimmt Einstellungen und startet die Preview erneut; mehrfach nutzbar. Proceed speichert aktuelle Einstellungen dauerhaft in Teilnehmerdaten und beendet den Trial.
- Speichern: `agent_id` und je Dimension `custom_<dimension>_start`/`custom_<dimension>_order`, wobei Background als `background` benannt wird.
- Preview auf echter Stimulusdatei, nicht interaktive Ringe; vorhandene Anfangsvorlage nicht paraphrasieren, während der Suche `... searching ...`, am Ende Final verdict. Danach Apply/Proceed erneut nutzbar.
- `SEARCH_STEP_MS` zentral in config.js zunächst 15 ms. 32 Kombinationen entsprechen 480 ms; Diskrepanz zu ungefähr 4 Sekunden dokumentieren, nicht auf 125 ms korrigieren. Version 1/2 und wiederholtes Apply testen.

### Standard-Zweig (aktueller Folgeauftrag)

- Ausschließlich Version 3/4, Agent DA02. Reihenfolge: Einführung der Markierungs-/Pass-/Reject-Hilfe → Funktionen kennenlernen → Standard-Preview → Änderungswünsche → passende bedingte Freitextfragen → AI mistakes information → AI practice reminder.
- Preview ohne Einstellmöglichkeiten, mit Preview und Proceed. Dieselbe Suchengine wie Customization, feste zentral definierte Reihenfolge mit Direction, Background, Size, Type. Keine zusätzliche Colour-Dimension aus widersprüchlichen Screens ableiten.
- Hauptfrage exakt: „If you were able to change anything about the agent‘s features to improve it, what would it be?“ Optionen exakt: „The agent‘s name“, „The agent‘s search strategy“, „Something else“, „I wouldn‘t change anything“.
- Mehrfachauswahl nur bei durch Referenz bestätigten Checkboxen. Ohne diesen Beleg Einzelwahl und fehlende Layoutangabe dokumentieren.
- Folgefragen passend zur Auswahl: „How would you change the agent‘s name?“, „How would you change the agent‘s search strategy?“, „What else would you change and how?“. Bei keiner Änderung keine Folgefrage. Auswahlen und Freitexte eindeutig speichern.
- Textinkonsistenz „Colour blue → orange“ gegenüber „Size large → small“ in OPEN_QUESTIONS.md dokumentieren. Version 3/4 bis zur Grenze vor AI Practice testen.

### Globale Defektregel (für alle Zweige)

- Jedes L und jedes O ist ein Defekt, unabhängig von Farbe und Größe.
- Alle anderen Buchstaben sind keine Defekte.
- Mehr als 10 Defekte: `reject`.
- 10 oder weniger Defekte: `pass`.

## 5. Interaktion und Navigation

- Im Training ohne KI dürfen Teilnehmende eigene Kreise als Zählhilfe setzen und wieder entfernen.
- Sobald die KI eingesetzt wird, dürfen Teilnehmende keine Kreise setzen, entfernen oder verändern.
- Die menschliche Aufgabe in KI-Trials besteht ausschließlich darin, `pass` oder `reject` zu klicken.
- Kein Trial darf durch ein Zeitlimit automatisch beendet werden; keine Timeouts für Teilnehmerantworten.
- Informationsseiten enden ausschließlich über ihren vorgesehenen Button.
- Ist kein spezieller Buttontext in der Referenz vorgesehen, lautet der Buttontext `Next`.

### Gezielte Bereinigung der Altlogik (aktueller Folgeauftrag)

- Alte Antwortdauer-/Driftparameter, Driftberechnung, Ringversatz und automatische Countdown-Enden entfernen.
- Recalibrate, den ausschließlich damit verknüpften Abbruchzustand und Admin-Skip innerhalb regulärer Trials entfernen; überholte automatische Fixationstrials ebenfalls entfernen.
- KI-Ringe standardmäßig nicht interaktiv rendern. Entfernbare Trainingsmarker über eine getrennte Funktion oder einen expliziten Interaktivitätsparameter bereitstellen.
- Zeitgesteuerte KI-Suchanimationen bleiben erlaubt; sie dürfen keinen Teilnehmer-Trial beenden.
- `Final Anomaly Scan` nur entfernen, wenn er ausschließlich zur alten Driftlogik gehört. Bestehende CSV-Markierungen nicht durch die Bereinigung verlieren.
- Nach der Änderung projektweit nach `RUNDEN_DAUER`, `trial_duration`, `setTimeout`, `countdown`, `Recalibrate`, `berechneDrift`, `wird_verschoben`, `ANZAHL_DRIFT` suchen und Treffer auf unbeabsichtigte Laufzeitverwendung prüfen.

## 6. Referenztreue und participant-facing Inhalte

- Texte und Fragen aus der Referenz nicht eigenmächtig umformulieren.
- Interne PowerPoint-Anmerkungen wie `Customization Condition`, `Standard Condition` oder `Predictability` nicht Teilnehmenden anzeigen.
- Bestehende Codekommentare mit Hinweisen auf Vorlagen sind kein Ersatz für die Originalquellen.
- Benötigt werden PowerPoint/PDF-Referenz, Excel-Spezifikation mit mindestens vier Sheets sowie Pre_PO- und Post_PO-Bilder. Deren Verfügbarkeit ausdrücklich prüfen.

## 7. Daten und Export

### Gemeinsame AI-Trial-Laufzeit (aktueller Folgeauftrag)

- Alte KI-Hauptrunden durch eine gemeinsame `createAiTrial()` für genau 10 AI-Practice- und 30 Main-Trials ersetzen. Eingaben: Stimulus, Symbolmetadaten, konkrete KI-Markierungen, Plan-Verdict, Condition und aktuelle Suchreihenfolge.
- Ablauf: Bild/Agent-Panel → Suchvisualisierung → geplante KI-Ringe → Final Verdict → Pass-/Reject-Klick → sofortiges Trial-Ende. Keine Ringbearbeitung, Recalibration, Countdowns, Antworttimeouts oder automatischen Trial-Enden.
- Empfehlung direkt aus Plan als PASS/REJECT, mit grün/rot unterstützt; getrennt von Teilnehmerbuttons. Fehlende gültige Pläne nicht durch ad-hoc-Markierungen ersetzen.
- Pro Trial mindestens phase, trial_index, stimulus_id, experiment_version, customization_condition, predictability_condition, agent_id, specified_misses, specified_false_alarms, agent_verdict, participant_verdict, participant_verdict_code, agreement_with_agent, response_correct bei eindeutiger Ground Truth, rt, search_animation_duration_ms und konkrete Miss-/FA-/Markierungs-IDs speichern. Keine redundanten Symboltabellen in Antwortdaten.
- PASS/REJECT, High/Low und Customization/Standard testen. Verbleibende Quellenfehler dürfen nicht umgangen werden.

### Reproduzierbares Predictability-Preprocessing (aktueller Folgeauftrag)

- Keine zufällige Neuverteilung zur Laufzeit. Fester Seed und konkrete Symbolzuordnungen in generierten JSONs.
- Pro KI-Trial `ai_marked_symbol_ids`, daraus `miss_symbol_ids` (nicht markierte L/O) und `false_alarm_symbol_ids` (markierte Nicht-L/O). Defekte unabhängig von Farbe/Größe; Anzahlen exakt aus Excel.
- High: alle Fehler orange; Größe und Buchstaben soweit durch Symbole möglich ausgewogen. Mathematisch unerfüllbare Vorgaben als Validation Error behandeln.
- Low: Fehler möglichst gleichmäßig über orange/blau, klein/groß und Buchstaben verteilen. Sequenzielle Fehlerliste darf bei Farbe, Größe oder Buchstabe keine Serie länger als zwei enthalten.
- High/Low müssen je Trial dieselben Miss-/FA-Anzahlen und den exakten Excel-Verdict behalten.
- Validierungen `validateHighPredictability`, `validateLowPredictability`, `validateMissCount`, `validateFalseAlarmCount`, `validateAgentVerdict` automatisiert ausführen. Bei Fehlern Build abbrechen, keine ungültigen Trialdateien exportieren.
- Vier Pläne erzeugen, sofern Quellen/Constraints gültig sind: v1 customization-low, v2 customization-high, v3 standard-low, v4 standard-high. Offene Assetzuordnung nicht stillschweigend bestätigen.

### Import der tatsächlichen Quelldateien (aktueller Folgeauftrag)

- Nutzerbestätigte Zuordnung: PrePO 1–16 = ZIP-Zähler 10–25; Main 1–23 = 26–48; Main 24 ausdrücklich = (50), nicht (49); Main 25–30 = 51–56. ZIP (49) als superseded ignorieren, erhalten und die Ausnahme explizit im Source Mapping dokumentieren. Keine alleinige allgemeine Nummernformel als Zuordnungsgrundlage.

- Tatsächliche Excel- und Pre_PO-/Post_PO-Quellen prüfen; keine fehlenden Werte/Dateizuordnungen erfinden. Die inzwischen bereitgestellte Arbeitsmappe ist Stimuli_log.xlsx, mit Training, PrePO, PostPO, Generator Settings als ersten vier Sheets.
- Reproduzierbarer Build unter scripts/, Roh-Excel unverändert. Statische JSONs für Training, AI Practice und Main Task erzeugen, wenn die Quellzuordnung eindeutig geklärt ist.
- KI-Trialfelder mindestens phase, trial_index, stimulus_id, image_path, symbol_table_path, specified_misses, specified_false_alarms, agent_verdict. Misses, False Alarms und vorgegebene Verdicts exakt aus Excel übernehmen, nicht aus Kreisen rekonstruieren.
- Exakt 10 AI-Practice- und 30 Main-Task-Trials. Ohne explizite Auswahlspalte erste 10 beziehungsweise 30 verwenden. Pre_PO gehört zu AI Practice, Post_PO zu Main. SOURCE_MAPPING.md mit Sheet/Trial/Dateien/Misses/FAs/Verdict erstellen.
- Predictability-Zuweisung in diesem Schritt noch nicht umstellen. Mehrdeutige Asset-Zuordnungen blockieren finale Outputs bis zur Klärung.

- Likert-Antworten als Zahlen 1–7 speichern; sichtbare Skalenlabels allein erfüllen diese Vorgabe nicht.
- Yes/No zentral und leicht änderbar codieren: `1 = Yes`, `2 = No`.
- Bestehenden OSF/DataPipe-Datenexport grundsätzlich erhalten.

## 8. Codebefunde der ersten Bestandsaufnahme (historisch, nicht Soll)

Die folgende Tabelle beschreibt den Stand vor Einführung von `conditions.js`. Aktuelle Condition-Verwaltung und Änderungen sind in CURRENT_STATE.md im Abschnitt „Aktueller Stand der Condition-Architektur“ dokumentiert. Insbesondere alte Gruppen und fehlende Low/High-Metadaten gelten inzwischen als abgelöst.

| Bereich | Nachweisbarer Bestand |
| --- | --- |
| Technik | Statische HTML/CSS/JavaScript-Anwendung; `index.html` lädt jsPsych 7.3.4, HTML-Button-, Survey-Text- und Survey-Likert-Plugins, PapaParse 5.4.1 und das Pipe-Plugin über CDNs. |
| Konfiguration | `config.js` enthält OSF-Experiment-ID, zufällige Teilnehmerkennung und CSV-Dateinamen sowie globale Parameter. Konfiguriert sind 5 Trainingstrials und 80 reguläre Runden. |
| Alte Gruppen | `experiment.js`: Gruppe 1 = Standard, Gruppe 2 = Customization, Gruppe 3 = Admin Skip. Die vierte Menüoption startet eine Kalibrierung und ist keine vierte Experimentalversion. |
| Stimuli | 70 reguläre JPG/CSV-Paare (`stimulus_001` bis `stimulus_070`) und 5 Trainingspaare (`stimulus_training_001` bis `stimulus_training_005`). |
| Geometrie | Code rechnet mit Originalkoordinaten auf 1920 × 1080 und skaliert die Ringe anhand der Containerbreite. Dies ist eine Codeannahme, keine hier bestätigte Bildspezifikation. |
| CSV | Alle Tabellen enthalten `shape`, `center_x`, `center_y`, `color_hex`, `size_px`, `is_small`, `rotation`, `bg_luminance`, `bg_dark`. Reguläre Tabellen zusätzlich `ist_fehler`, `bekommt_kreis`. |
| KI-Konfiguration | Feste Kategorienfolge Direction → Background → Size → Type; Standardwerte top left / dark / large / L. Standard-KI-Name DA02; Customization verlangt zwei Buchstaben und zwei Ziffern. Keine Bestätigung dieser Vorgaben ohne Referenz. |
| Bisherige KI | CSV-Markierung über `bekommt_kreis`, fünf Rendergruppen und exponentieller räumlicher Drift nach Runde 9. Keine Low-/High-Predictability-Verzweigung. |
| Daten | Training speichert Runde, Trainingsflag und Pass/Reject-Entscheidung. KI-Runden speichern alte Gruppe, Beendigungsgrund und Ringkorrektur-Zähler. Brillencheck speichert `wearing_glasses` global als 1/0; dies ist kein Yes/No-Item. |
| Export | `initJsPsych.on_finish` sendet CSV per POST an `https://pipe.jspsych.org/api/data/`; Admin zeigt stattdessen Daten an. |

Die bekannten Abweichungen stehen in [CURRENT_STATE.md](CURRENT_STATE.md). Bestehende Werte, Items und Algorithmen dürfen ohne Referenz nicht als neue Spezifikation übernommen werden.
