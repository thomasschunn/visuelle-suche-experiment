# Bedienungsanleitung der WebApp

Diese Anleitung beschreibt die WebApp aus Sicht einer Person, die das Experiment startet, testet oder betreut. Die sichtbaren Fragen und Schaltflächen der WebApp sind auf Englisch; hier werden sie auf Deutsch erklärt. Die Anleitung beschreibt den aktuellen Programmstand und ersetzt keine noch fehlende wissenschaftliche Originalvorlage.

## Was macht die WebApp?

Die Teilnehmenden betrachten Bilder mit kleinen Buchstaben und entscheiden für jedes Bild, ob das dargestellte Bauteil **Pass** oder **Reject** ist. **L** und **O** zählen als Defekte, unabhängig von Farbe und Größe. Andere Buchstaben zählen nicht. Bei **mehr als 10 Defekten** ist die richtige Entscheidung **Reject**, bei **10 oder weniger** **Pass**.

Alle Versionen verwenden denselben grundlegenden Ablauf und dieselben fünf manuellen Trainingsbilder, zehn Übungen mit KI und 30 Bilder der Hauptaufgabe. Sie unterscheiden sich in der Vorbereitung der KI und darin, wie die vorab festgelegten KI-Fehler verteilt sind.

## Die vier Versionen

| Version | Vorbereitung der KI | Muster der KI-Fehler |
| --- | --- | --- |
| 1 | Einstellungen selbst wählen und der KI eine ID geben | Low: Fehler auf verschiedene Symbolmerkmale verteilt |
| 2 | Einstellungen selbst wählen und der KI eine ID geben | High: KI-Fehler betreffen orange Symbole |
| 3 | Feste KI **DA02**; keine eigenen Einstellungen | Low: Fehler auf verschiedene Symbolmerkmale verteilt |
| 4 | Feste KI **DA02**; keine eigenen Einstellungen | High: KI-Fehler betreffen orange Symbole |

Die Versionsnummer wird **über den Link** gewählt. In der WebApp gibt es dafür kein Auswahlmenü. Die Bedingungen „Low“, „High“, „Customization“ und „Standard“ sind interne Bezeichnungen und erscheinen nicht als solche in den regulären Teilnehmerbildschirmen. Die KI-Vorschau verwendet immer dasselbe Beispielbild; sie ist keine zusätzliche PrePO- oder PostPO-Runde. Die Trial-Reihenfolge und KI-Markierungen werden vor dem Start festgelegt, nicht zufällig während eines Durchlaufs ausgewählt.

## WebApp öffnen

**Wenn die WebApp bereits auf einer Website liegt:** Den vollständigen Link der Studienleitung verwenden. Am Ende muss genau einmal `version=1`, `version=2`, `version=3` oder `version=4` stehen. Beispiele mit einer Platzhalteradresse:

```text
https://IHRE-ADRESSE/index.html?version=1
https://IHRE-ADRESSE/index.html?version=2
https://IHRE-ADRESSE/index.html?version=3
https://IHRE-ADRESSE/index.html?version=4
```

**Zum Testen auf dem eigenen Computer:** Im Projektordner ein Terminal öffnen, zum Beispiel in VS Code über „Terminal“ → „Neues Terminal“. Dort diesen Befehl eingeben und das Terminal geöffnet lassen:

```text
python -m http.server 8000 --bind 127.0.0.1
```

Danach einen der folgenden Links im Browser öffnen:

| Version | Lokaler Link |
| --- | --- |
| 1 | http://127.0.0.1:8000/index.html?version=1 |
| 2 | http://127.0.0.1:8000/index.html?version=2 |
| 3 | http://127.0.0.1:8000/index.html?version=3 |
| 4 | http://127.0.0.1:8000/index.html?version=4 |

Dafür muss Python auf dem Computer verfügbar sein. Mit `Strg+C` im Terminal wird der lokale Server beendet. `127.0.0.1` funktioniert nur auf diesem Computer; für Teilnehmende auf anderen Geräten braucht die WebApp eine bereitgestellte Webadresse. Die Dateien sollten über eine Webadresse geladen werden, nicht durch Doppelklick auf `index.html`, weil die App weitere Dateien nachlädt. Für die extern eingebundenen Bibliotheken und den regulären Daten-Upload ist Internetzugang nötig.

Fehlt die Version im Link, steht sie doppelt darin oder ist sie nicht 1 bis 4, zeigt die WebApp einen Konfigurationsfehler und startet nicht. Für einen anderen Durchlauf einen Link mit der gewünschten Version öffnen.

## Debug-Modus: testen ohne Daten-Upload

Zum Testen `&debug=1` **hinter die Versionsnummer** setzen. Beispiel:

```text
http://127.0.0.1:8000/index.html?version=2&debug=1
```

Das funktioniert bei allen vier Versionen. Auch im Debug-Modus muss eine gültige Versionsnummer im Link stehen. Nur der genaue Zusatz `debug=1` aktiviert ihn.

Zu Beginn erscheint dann „Development Tools“ mit zwei Möglichkeiten:

- **Continue with URL version:** mit der Version aus dem Link zum normalen Ablauf weitergehen.
- **Eyetracker Kalibrierung:** einen Bildschirm mit neun roten Punkten ansehen und per Button zum Menü zurückkehren. Das ist ein Entwicklungstool, keine zusätzliche Experimentalversion.

Im Debug-Modus wird am Ende **nichts an DataPipe/OSF hochgeladen**. Auf dem Speicherbildschirm kann man stattdessen die Antworten als CSV-Datei herunterladen. Der Debug-Modus überspringt keine regulären Fragen oder Trials und ändert die Versionsnummer nicht.

## Ablauf eines Durchlaufs

1. **Sehhilfe und Einführung:** Zuerst wird nach Brille oder Kontaktlinsen für Bildschirmarbeit gefragt. Danach folgen Kontext, Aufgabenregel und Übungserklärung.
2. **Fünf manuelle Trainingsrunden:** Die Teilnehmenden zählen die Defekte selbst. Ein Klick auf das Bild setzt einen weißen Zählkreis; ein Klick auf einen gesetzten Kreis entfernt ihn. Mit **Pass** oder **Reject** wird die Runde beendet. Hier gibt es noch keine KI-Hilfe.
3. **Einführung der KI und Versionszweig:** Bei Version 1/2 wird eine ID aus zwei Buchstaben und zwei Ziffern eingegeben und die Suchreihenfolge der KI eingestellt. **Apply** zeigt die Vorschau mit den gewählten Einstellungen; man kann Einstellungen ändern und Apply erneut nutzen. **Proceed** übernimmt die aktuellen Einstellungen. Bei Version 3/4 heißt die KI fest **DA02**. Die Vorschau lässt sich mit **Preview** starten und mit **Proceed** verlassen; danach folgt eine Frage zu möglichen Änderungswünschen.
4. **Zehn Übungen mit KI (PrePO):** Die KI zeigt eine Suche, ihre weißen Markierungskreise und anschließend ihre Empfehlung **PASS** oder **REJECT**. Die Empfehlung kann falsch sein. Die Teilnehmenden treffen ihre eigene Entscheidung mit dem passenden Button. In KI-Trials können sie Kreise weder setzen noch entfernen.
5. **Fragen nach den KI-Übungen:** Es folgen Fragen zur Wahrnehmung der KI, unter anderem zu Zugehörigkeit, Zufriedenheit und Vertrauen. Danach startet die Hauptaufgabe mit **Start**.
6. **30 Hauptaufgaben (PostPO):** Der Ablauf pro Bild ist wie in den zehn KI-Übungen: Suche und Empfehlung ansehen, dann selbst **Pass** oder **Reject** wählen.
7. **Abschlussfragen:** Es folgen Fragen zu Zufriedenheit, Vertrauen, Verantwortung, Wahrnehmung der Bedingungen, erkannten Mustern und Einstellung gegenüber KI. Wo eine Antwort verlangt wird, kann die Seite erst nach der Eingabe verlassen werden. Wird ein Muster mit **Yes** bestätigt, folgt eine Pflichtfrage dazu.
8. **Abschluss:** Erst ein Klick auf **Submit** beendet den Durchlauf und öffnet den Speicherbildschirm.

Informationsseiten werden über ihren angezeigten Button verlassen, häufig **Next**. Es gibt **kein Zeitlimit für Teilnehmerantworten**. Die Pass-/Reject-Buttons einer KI-Runde werden erst nach Bildladung und Suchanzeige freigegeben; die Suche beendet die Runde nicht automatisch. Die Bildgröße passt sich an kleinere und größere Browserfenster an.

## Was passiert beim Speichern?

Im regulären Durchlauf versucht die WebApp **erst nach Submit**, die Antworten über DataPipe an das bestehende OSF-Projekt zu senden. Die Anzeige **„Data saved. You may close this window now.“** bedeutet, dass die WebApp eine erfolgreiche Antwort erhalten hat. Auf dem Speicherbildschirm gibt es außerdem **Download CSV** für eine lokale Kopie.

Wenn **„Upload could not be confirmed“** erscheint, den Tab offen lassen und **Retry** verwenden oder mit **Download CSV** eine Sicherung herunterladen. Eine fehlende Bestätigung bedeutet nicht sicher, dass auf dem Server nichts angekommen ist. Bei **„Data validation failed“** wird nichts hochgeladen; die angebotene Roh-CSV dient nur zur Fehlerrettung und sollte an die Studienleitung weitergegeben werden. Im Debug-Modus erscheint eine Meldung, dass kein Upload gesendet wurde; dort die CSV bei Bedarf herunterladen.

Die Daten werden während des Durchlaufs im geöffneten Tab gehalten. **Vor einem bestätigten Upload oder einem CSV-Download den Tab nicht schließen und die Seite nicht neu laden.** Ein Neuladen beginnt eine neue Sitzung. Ein angefangener Durchlauf wird nicht automatisch wiederhergestellt.

## Wenn etwas nicht funktioniert

| Beobachtung | Was tun? |
| --- | --- |
| „Configuration error“ gleich nach dem Öffnen | Den Link prüfen: genau ein `version`-Wert von 1 bis 4. |
| Lokal erscheint keine WebApp | Prüfen, ob das Terminal mit dem lokalen Server noch läuft und ob der Link mit `http://127.0.0.1:8000/` beginnt. |

| Speichern wird nicht bestätigt | **Retry** versuchen oder **Download CSV** nutzen; den Tab bis dahin offen lassen. |
| Es sollen keine Testdaten hochgeladen werden | Den Link mit `&debug=1` verwenden und am Ende die CSV lokal herunterladen. |

## Hinweis für die Studienleitung

Die aktuellen Pläne für **alle vier Versionen** sind rechnerisch validiert und der technische Start ist freigeschaltet. Ein vollständiger Test im echten Browser, ein echter DataPipe-/OSF-Uploadtest und der Abgleich einiger Einführungs- und Layouttexte mit der fehlenden Original-PowerPoint/PDF stehen weiterhin aus. Diese Punkte sind in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) und im aktuellen Abschnitt von [FINAL_QA_REPORT.md](FINAL_QA_REPORT.md) beschrieben. Die CSV-Spalten sind bei Bedarf in [DATA_SCHEMA.md](DATA_SCHEMA.md) erklärt.

Die Bildquellen liegen in `Training_Images`, `PrePO_Images` und `Post_PO_Images`. Die WebApp lädt die daraus vorbereiteten Bilder und Symboldaten aus `data/generated/assets`. Diese vorbereiteten Dateien gehören zum Programm und sollten nicht einzeln umbenannt oder gelöscht werden.
