# Trial-Spezifikationen bauen

## Aktueller Stand: bestaetigter Validation Blocker (Trial 28)

Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip.
Problem: required orange misses = 2, available orange targets = 1.
Excel: 100 Symbole, 3 Targets, 2 Misses, 1 False Alarm, Agent Verdict: Pass. CSV: 1 oranges und 2 blaue Targets.

Quelldaten und High-Regel bleiben unveraendert. Vollstaendige gueltige Low-Condition-Plaene (v1/v3) werden erzeugt; v2/v4 bleiben blockiert. Der Gesamtbuild meldet weiterhin einen Validation Error (Exitcode 1). `data/generated/conditions/validation_status.json` sperrt den regulaeren Start ALLER Versionen, bis ein korrigierter Stimulus oder eine ausdrueckliche Ausnahmeentscheidung vorliegt und der Build erfolgreich validiert. Fehlender Status sperrt ebenfalls. Keine unvollstaendigen High-Plaene werden als Experimentplaene exportiert. Diese Regel ersetzt die fruehere Aussage, bei diesem Blocker ueberhaupt keine Condition-Plaene zu exportieren.


## Predictability-Preprocessing

```text
python scripts/test_predictability.py
python scripts/build_predictability.py --audit-candidates
python scripts/build_predictability.py
python scripts/build_predictability.py --check
```

Der vollständige Build benutzt den Import im Speicher und schreibt erst nach Validierung aller vier Conditions. Aktuell blockieren die offene Trial-24-Zuordnung sowie ein mathematisch unmöglicher High-Trial 28; siehe docs/PREDICTABILITY_VALIDATION.md. `--audit-candidates` ist strikt schreibfrei und bestätigt keine Zuordnung. Bestehende ältere Outputs werden bei einem Fehler nicht als neu gültig erklärt; `--check` muss vor Verwendung erfolgreich sein.

Fester Standardseed: **20260909**; explizit änderbar mit `--seed INTEGER`, im Plan und jedem Trial gespeichert. Algorithmus: `predictability-v1`. Symbol-IDs ergeben sich aus Stimulus-ID und CSV-Datenzeile. Farbe, Größe und Buchstabe stammen unverändert aus CSV. Der Import von vorhandenen CSV-Markierungsflags findet hier nicht statt: Die konkrete Markierung wird gemäß Excel-Misses/FAs vorab neu bestimmt.

Ausgewogenheit wird als technisches Optimierungsziel operationalisiert: Summe der quadrierten Differenzen klein/groß sowie L/O und T/Q; bei Low zusätzlich orange/blau. Getrennte Buchstabenpaare respektieren die vorgegebenen unterschiedlichen Miss-/FA-Anzahlen. Zuerst wird die kleinste machbare Unausgewogenheit pro Trial gewählt, bei Gleichstand die der bis dahin kumulierten Fehlerliste. Weitere Gleichstände sowie konkrete Symbole innerhalb einer Kategorie werden durch Seed/SHA-256 aufgelöst. High kann dadurch bei vorhandenen Symbolen nicht unnötig einseitig sein. Die Vorgabe legt keine anderen Gewichte fest; diese explizite, überprüfbare technische Definition ist keine Änderung an Excel.

Die Suche zählt mögliche Anzahlen je Kategorie exakt auf und prüft bei Low mögliche Fehlerreihenfolgen. Backtracking berücksichtigt die Machbarkeit späterer Trials; ein gescheiterter zufälliger Versuch wird nicht als Unmöglichkeit ausgegeben. Keine Dreierserien bei Farbe, Größe oder Buchstabe; die Sequenz erstreckt sich über alle 10 AI-Practice- und danach 30 Main-Trials, ohne Reset bei leeren Trials oder Phasenwechsel. High besitzt keine zusätzliche Low-Serienvorgabe.

Erfolgreiche Builds würden `data/generated/conditions/v1_trials.json` bis `v4_trials.json` erzeugen: v1 customization-low, v2 customization-high, v3 standard-low, v4 standard-high. Je 40 KI-Trials. v1/v3 teilen dieselbe Low-Zuordnung, v2/v4 dieselbe High-Zuordnung. Das manuelle Training hat keine KI-Zuordnung und bleibt in training_trials.json. Die WebApp muss diese vorverarbeiteten Pläne in einem späteren Schritt konsumieren; keine neue Laufzeitverteilung und keine Änderung ihrer bisherigen Suchanimation in diesem Schritt.

## Quellenimport

Python 3, nur Standardbibliothek. Keine Paketinstallation notwendig. Befehle ab Projektroot:

```text
python scripts/build_trial_specs.py --audit
python scripts/test_build_trial_specs.py
python scripts/build_trial_specs.py
python scripts/build_trial_specs.py --check
```

Eingaben: unveränderte `Stimuli_log.xlsx`, die vorhandenen ZIP-Dateien unter `PrePO_Images/` und `Post_PO_Images/`, die fünf bestehenden Trainings-JPG/CSV-Paare sowie `scripts/source_asset_mapping.json`. Die ebenfalls vorhandenen .7z-Roharchive bleiben erhalten; der Build liest die bereits im Workspace ausgepackten ZIP-Verzeichnisse. Er entpackt ausschließlich die zwei ausdrücklich erwarteten Mitglieder jedes ZIPs in neue, eindeutige Ausgabepfade und überschreibt keine Rohstimuli.

**Bestaetigte Zuordnung:** `source_asset_mapping.json` enthaelt die vom Nutzer geprueften Einzelzuordnungen. Main-Trial 24 verwendet ZIP (50); ZIP (49) bleibt unveraendert erhalten und wird als superseded ausgeschlossen. Die Ausnahme wird im Build validiert und explizit in SOURCE_MAPPING.md ausgegeben. Der reine Quellenimport ist erfolgreich; der Predictability-Gesamtbuild bleibt wegen High-Trial 28 blockiert.

Nach bestätigter Zuordnung erzeugt der Build:

- `data/generated/training_trials.json`: 5 Trials; existierende Trainingsassets temporär, Zahlen gegen Sheet Training geprüft.
- `data/generated/pre_trials.json`: erste 10 Trials aus PrePO (16 vollständig spezifiziert).
- `data/generated/main_trials.json`: erste 30 Trials aus PostPO (Zeilen für 31–60 nicht vollständig spezifiziert).
- `data/generated/assets/<phase>_<trial>/`: unveränderte Bild-/CSV-Inhalte aus den Eingaben, ohne Namenskollisionen.
- `data/generated/source_cells.json`: sämtliche gelesenen Excel-Zellen inklusive Generator Settings, Times und Notizen; keine Änderung oder Implementierung der Predictability-Regeln.
- `data/generated/build_manifest.json`: SHA-256-Provenienz für Workbook, Mapping und Assets.
- `docs/SOURCE_MAPPING.md`: vollständige Zuordnung inklusive Misses, False Alarms und Excel-Verdict.

Der Import liest Worksheet-Beziehungen und Zelltypen aus OOXML, übernimmt gecachte Excel-Formelergebnisse und bricht bei fehlendem Formelcache ab. Er berechnet keine Excel-Formeln neu. Aktuelle Tabellen haben keine Auswahlspalte. Veränderte Header einschließlich neuer Auswahlspalten blockieren den Build, bis deren tatsächliche Semantik explizit integriert wird; es gibt keine geratenen Auswahlregeln.

Validierung: Anzahl/Reihenfolge, Pflichtwerte, ganzzahlige Anzahlen, Excel-interne Hits/Misses/FAs-Konsistenz, CSV-Symbol-/Defektzahlen, Generator-Settings-L/O-Zahlen, erwartete ZIP-Mitglieder und JPEG-Kennung. Agent Verdict bleibt exakt `Pass`/`Reject` aus Excel, auch wenn eine Entscheidung abweichend wäre. Kein Ableiten aus Kreisen. Training enthält `null` für KI-Felder; das Sheet gibt dafür keine Werte vor.

Alle Daten werden vor dem ersten Ausgabeschreibzugriff geprüft. Dateien werden einzeln atomar ersetzt; `--check` schreibt nichts und erkennt fehlende oder veraltete Ausgaben. Deterministische Serialisierung ohne Zeitstempel erlaubt byteidentische Wiederholungen. Die WebApp wird in diesem Schritt noch nicht auf die generierten Specs umgestellt.
