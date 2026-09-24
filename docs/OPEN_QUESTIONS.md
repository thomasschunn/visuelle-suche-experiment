# Offene Quellenfragen und Blocker

Dieser Stand ersetzt die historischen Listen bereits geloester Fragen.

## Main-Trial 28: geloest

Das vom Nutzer gelieferte `Post_PO_Images/visual_search_data_PostPO_28.zip` ersetzt die alte benannte Kopie. Das urspruengliche `visual_search_data(54).zip` bleibt erhalten. Die neue CSV hat 100 Symbole, drei Targets (zwei orange, eines blau) und stimmt mit Stimuli_log.xlsx, PostPO Zeile 29 ueberein. Der volle Build validiert V1 bis V4; dieser Blocker ist geschlossen.

## Fehlende PowerPoint/PDF

Im Workspace fehlt weiterhin die Original-PowerPoint/PDF. Die vom Nutzer gelieferten Surveyitems, Taskregeln, Post-/Responsibility-/Finaltexte und Submittext sind implementiert. Nicht abschliessend verifizierbar: Glasses/Context/Practice, AI-/Customization-Einfuehrung, Agent-ID-Instruktion, Preview-Anfangstexte, AI-Fehlerhinweis (einschliesslich 90%-Aussage), AI-Practice-Reminder und Wahrnehmungsintro sowie Referenzlayout und spezielle Buttontexte.

## Standard-Preview und Auswahlformat

Die berichtete Textinkonsistenz Colour blue -> orange versus Size large -> small ist ohne Referenz nicht aufloesbar. Die Engine nutzt unveraendert Direction, Background, Size, Type. Bei der Aenderungswunschfrage fehlen Belege fuer Checkboxen; bis dahin gilt die ausdruecklich erlaubte Einzelwahl. Standardstarts top_left/dark/large/L stammen aus dem bestehenden Prototyp.

## Suchanimation und Preview-Asset

32 Kombinationen * 15 ms = 480 ms; Times nennt zugleich ungefaehr 4 Sekunden. SEARCH_STEP_MS bleibt ausdruecklich 15; keine eigenmaechtige Korrektur auf 125 ms. Die Verschachtelung Direction/Background/Size/Type ist gegenueber Beispielen im Times-Sheet (Background/Direction) noch nicht abschliessend geklaert.

Preview verwendet das vorhandene stimulus_001. Dessen CSV markiert 10 L/O und 4 T/Q. Restmarkierungen ausserhalb der Type=L/O-Schritte werden am Ende gezeigt. Welches finale Preview-Asset und welcher Referenz-Verdicttext gelten, bleibt offen. Dieser Preview-Verdict ist nicht mit den verbindlichen Excel-Verdicts der AI-/Main-Trials gleichzusetzen.

## Trainingsassets

Die vom Nutzer gelieferten Archive `visual_search_data_training_1.zip` bis `visual_search_data_training_5.zip` liegen unter `Training_Images/` und sind den Trainingsrunden 1 bis 5 zugeordnet. Ihre CSVs stimmen mit Sheet Training ueberein (je 40 Symbole, Targets 8/11/12/9/7). Die bisherigen Trainings-JPG/CSV-Paare bleiben als historische Dateien erhalten.

## Bereits geklaerte Quellen (keine Blocker)

Stimuli_log.xlsx mit Training, PrePO, PostPO, Generator Settings, Times sowie PrePO_Images.7z und Post_PO_Images.7z liegen vor. Die Zuordnung ist bestaetigt: Pre 1-16 = ZIP 10-25; Main 1-23 = ZIP 26-48; Main 24 ausdruecklich ZIP 50, ZIP 49 superseded und erhalten; Main 25-30 = ZIP 51-56. SOURCE_MAPPING.md dokumentiert jede verwendete Datei. Die alten fehlenden stimulus_071..080 sind fuer das aktuelle Experiment nicht erforderlich.

## Preview-Tempo: aktueller Nutzerauftrag

Die Preview soll sichtbar nacheinander durchlaufen. Dafuer ist PREVIEW_SEARCH_STEP_MS nun 180 ms (5,76 Sekunden fuer 32 Kombinationen), als UI-Umsetzung dieses Auftrags, nicht als aus Times abgeleiteter Wert. Die fruehere Anweisung, die Preview nicht zu verlangsamen, ist damit abgeloest. SEARCH_STEP_MS fuer AI Practice/Main bleibt 15 ms; der Referenzwiderspruch und die offene Verschachtelungsfrage sind dadurch nicht referenzseitig geklaert.
