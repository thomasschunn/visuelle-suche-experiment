# Predictability-Validierung

## Aktueller Stand: bestaetigter Validation Blocker (Trial 28)

Main Trial 28 -> Post_PO_Images/visual_search_data(54).zip.
Problem: required orange misses = 2, available orange targets = 1.
Excel: 100 Symbole, 3 Targets, 2 Misses, 1 False Alarm, Agent Verdict: Pass. CSV: 1 oranges und 2 blaue Targets.

Quelldaten und High-Regel bleiben unveraendert. Vollstaendige gueltige Low-Condition-Plaene (v1/v3) werden erzeugt; v2/v4 bleiben blockiert. Der Gesamtbuild meldet weiterhin einen Validation Error (Exitcode 1). `data/generated/conditions/validation_status.json` sperrt den regulaeren Start ALLER Versionen, bis ein korrigierter Stimulus oder eine ausdrueckliche Ausnahmeentscheidung vorliegt und der Build erfolgreich validiert. Fehlender Status sperrt ebenfalls. Keine unvollstaendigen High-Plaene werden als Experimentplaene exportiert. Diese Regel ersetzt die fruehere Aussage, bei diesem Blocker ueberhaupt keine Condition-Plaene zu exportieren.


## Status

Kein gültiger Gesamtbuild möglich; keine Condition-JSONs exportiert. Rohquellen unverändert.

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
