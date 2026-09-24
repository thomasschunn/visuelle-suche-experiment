# Predictability-Validierung: aktueller Stand (2026-09-17)

Die korrigierte Nutzerdatei `Post_PO_Images/visual_search_data_PostPO_28.zip` ersetzt die bisherige benannte Kopie; das originale `visual_search_data(54).zip` bleibt erhalten. Die neue CSV enthaelt 100 Symbole und drei Targets, davon zwei orange. Der Quellenimport und der vollstaendige Predictability-Build validieren V1 bis V4 mit je 40 KI-Trials. `validation_status.json` meldet `experiment_start_allowed=true`, `valid_versions=[1,2,3,4]` und keine Fehler. `python scripts/build_predictability.py --check` besteht. Der fruehere Trial-28-Blocker ist geloest.

Die folgenden Abschnitte dokumentieren den historischen Zustand vor dem Austausch des Stimulus.

# Historische Predictability-Validierung (vor korrigiertem Main-Trial 28)

## Aktueller Stand: bestaetigter Validation Blocker (Trial 28)

Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip.
Problem: required orange misses = 2, available orange targets = 1.
Excel: 100 Symbole, 3 Targets, 2 Misses, 1 False Alarm, Agent Verdict: Pass. CSV: 1 oranges und 2 blaue Targets.

Quelldaten und High-Regel bleiben unveraendert. Vollstaendige gueltige Low-Condition-Plaene (v1/v3) werden erzeugt; v2/v4 bleiben blockiert. Der Gesamtbuild meldet weiterhin einen Validation Error (Exitcode 1). `data/generated/conditions/validation_status.json` sperrt den regulaeren Start ALLER Versionen, bis ein korrigierter Stimulus oder eine ausdrueckliche Ausnahmeentscheidung vorliegt und der Build erfolgreich validiert. Fehlender Status sperrt ebenfalls. Keine unvollstaendigen High-Plaene werden als Experimentplaene exportiert. Diese Regel ersetzt die fruehere Aussage, bei diesem Blocker ueberhaupt keine Condition-Plaene zu exportieren.


## Status

Kein gültiger Gesamtbuild möglich; nur vollstaendige LOW-Condition-JSONs (v1/v3) exportiert. Rohquellen unverändert.

Die Assetzuordnung ist vom Nutzer bestaetigt: Main-Trial 24 verwendet ZIP (50), ZIP (49) ist superseded. Die Quellen-JSONs fuer 5/10/30 Trials sind erzeugt und validiert. Der regulaere Predictability-Build erreicht jetzt die Symbolvalidierung und stoppt ausschliesslich am High-Fehler bei Main-Trial 28.

## Nachweis für Trial 28

| Quelle | Befund |
| --- | --- |
| Stimuli_log.xlsx / PostPO / A29 | Trial 28 |
| PostPO / G29 | 2 Misses |
| PostPO / H29 | 1 False Alarm |
| PostPO / F29 | Pass |
| Post_PO_Images/visual_search_data(54).zip / stimulus_001.csv / Zeile 2 | O, blau (#0064FF), groß |
| dieselbe CSV / Zeile 3 | L, blau (#0064FF), groß |
| dieselbe CSV / Zeile 4 | L, orange (#FF8C00), klein |

Es gibt genau einen orangefarbenen echten Defekt. Zwei orange Misses können ohne Quelländerung nicht gewählt werden. Die erzeugte Fehlermeldung lautet:

```text
main_task trial 28: HIGH requires 2 misses, but only 1 orange eligible symbols exist
```

## Historische Checks vor bestaetigter Assetzuordnung

Die folgenden Ergebnisse sind historisch; aktuelle Checks stehen im Abschnitt Partial-Debug-Modus.

## Ausgeführte Checks

```text
python scripts/test_predictability.py
python scripts/test_build_trial_specs.py
python scripts/build_predictability.py
python scripts/build_predictability.py --audit-candidates
```

- 8 Predictability-Tests und 7 Importtests bestanden.
- Regulärer Build: erwarteter Exit-Code 1, unbestätigte Assetzuordnung, keine Ausgabe.
- Kandidatenaudit: erwarteter Exit-Code 1. Beide Trial-24-Kandidaten werden ausschließlich im Speicher eingesetzt, nicht als bestätigte Quellen gespeichert.
- Je Kandidat: 40 Low-Trials mit exakten Excel-Anzahlen/Verdicts und ohne Dreierserien bei Farbe, Größe, Buchstabe validiert. 39 mögliche High-Trials mit allen High-/Anzahl-/Verdict-Prüfungen validiert. Trial 28 scheitert vor Zuordnung.
- Reproduzierbarkeit: Wiederholung mit demselben Seed liefert identische Listen; synthetische Tests prüfen zusätzlich einen anderen Seed, ungültige IDs, falsche Anzahlen/Verdicts, nicht-orange High-Fehler, Serien über Trialgrenzen und unerfüllbare Constraints.
- Alle vier Condition-Dateiformate und ihre v1/v3- beziehungsweise v2/v4-Gleichheit auf machbaren synthetischen Testfixtures geprüft. Diese Fixtures ersetzen keine Excel-/Stimulusquellen.

Der Seed ist 20260909. Es wurden keine Excel-Werte, Symbolfarben oder Fehlerraten angepasst. Keine Zufallslogik in der laufenden WebApp ergänzt.

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
