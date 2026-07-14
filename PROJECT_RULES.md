# PROJECT RULES

## Projektstruktur

* Die bestehende Ordnerstruktur beibehalten.
* Dateien nur erstellen, wenn eine bestehende Datei nicht sinnvoll erweitert werden kann.
* HTML-Dateien bleiben im Hauptordner.
* Wiederverwendbare Bestandteile kommen in `components/`.
* CSS-Dateien bleiben nach Bereichen getrennt:

  * `global.css` für globale Einstellungen und Variablen
  * einzelne CSS-Dateien für einzelne Seiten oder Komponenten
* JavaScript-Dateien nach Funktion trennen.

## Allgemeine Code-Regeln

* Der Code soll sauber, verständlich und einfach wartbar sein.
* Keine unnötigen Änderungen an bestehendem Code machen.
* Vor Änderungen immer prüfen, ob bereits vorhandener Code genutzt werden kann.
* Keine komplizierten Lösungen verwenden, wenn eine einfache Lösung möglich ist.
* Klassen und Variablen sinnvoll benennen.
* Keine unnötigen Kommentare hinzufügen.
* Bestehenden Stil des Projekts beibehalten.

## HTML-Regeln

* Einheitliche Einrückung verwenden.
* Semantische HTML-Elemente verwenden, wenn möglich:

  * `section`
  * `article`
  * `main`
  * `header`
  * `footer`
* Wiederholende Elemente sauber strukturieren.
* Klassen beschreiben den Inhalt und nicht das Aussehen.
* Keine Inline-CSS verwenden.
* Keine unnötigen Wrapper-Divs erstellen.

## CSS-Regeln

* Nach jeder schließenden Klammer `}` immer eine Leerzeile einfügen.

Beispiel:

```css
.card {
    padding:20px;
    background:white;
}

.button {
    color:black;
}
```

* Keine unnötigen Leerzeilen innerhalb einer CSS-Regel.
* CSS kompakt und übersichtlich schreiben.
* Einrückung immer mit 4 Leerzeichen.
* Eigenschaften nach Möglichkeit logisch gruppieren:

  1. Layout
  2. Größe/Abstände
  3. Farben
  4. Schrift
  5. Animationen/Transitions

Beispiel:

```css
.card {
    display:flex;
    padding:20px;

    background:var(--color-background);
    color:var(--color-dark);

    transition:var(--transition);
}
```

* Globale Farben, Abstände und Werte aus `global.css` verwenden.
* Keine festen Werte verwenden, wenn bereits eine CSS-Variable existiert.
* Responsive Design berücksichtigen.
* Mobile-Version zuerst schreiben.
* Desktop-Anpassungen in `@media(min-width:1024px)` ergänzen.

## Design-Regeln

* Das bestehende Design beibehalten.
* Farben aus den CSS-Variablen verwenden.
* Einheitliche Abstände nutzen.
* Einheitliche Border-Radius- und Schatten-Werte nutzen.
* Keine neuen Design-Stile einführen, die nicht zum Projekt passen.
* Animationen sparsam einsetzen.
* Webseiten sollen professionell, ruhig und übersichtlich wirken.

## Responsive Design

* Jede Seite muss auf Mobile und Desktop funktionieren.
* Mobile Layouts dürfen nicht kaputtgehen.
* Bei Desktop-Versionen prüfen:

  * Sind Inhalte zentriert?
  * Sind Container begrenzt?
  * Sind Karten richtig angeordnet?
* Keine Elemente nur für eine Bildschirmgröße bauen.

## JavaScript-Regeln

* Funktionen klar benennen.
* Keine unnötigen globalen Variablen erstellen.
* Bestehenden Code nicht komplett ersetzen, wenn eine kleine Änderung reicht.
* Vor dem Ändern prüfen, ob andere Dateien davon abhängig sind.
* Komponenten erst laden, bevor Funktionen ausgeführt werden, die diese benötigen.

## Komponenten

* Wiederverwendbare Elemente als Komponenten speichern.
* Header und Footer nicht mehrfach kopieren.
* Änderungen an Komponenten müssen auf allen Seiten funktionieren.
* Nach Änderungen prüfen, ob alle Seiten weiterhin funktionieren.

## Fehlerbehebung

Bei Problemen zuerst prüfen:

1. Wird die Datei überhaupt geladen?
2. Ist der Pfad korrekt?
3. Gibt es Tippfehler bei Klassen oder IDs?
4. Wird CSS von einer anderen Regel überschrieben?
5. Funktioniert die Struktur auf Mobile und Desktop?

Nicht direkt Code umbauen, bevor die Ursache gefunden wurde.

## Änderungen durch KI

Wenn Code geändert wird:

* Nur die benötigten Stellen ändern.
* Keine komplette Datei neu schreiben, wenn nicht notwendig.
* Bestehende Funktionen und Strukturen respektieren.
* Vor größeren Änderungen erklären, was geändert wird.
* Bei vollständigem Code immer die komplette Datei ausgeben.

## Dateiformatierung

* Markdown-Dateien übersichtlich mit Leerzeilen schreiben.
* CSS nach jedem `}` eine Leerzeile.
* HTML und JavaScript sauber einrücken.
* Keine unnötigen Leerzeichen am Zeilenende.

## Ziel des Projekts

Die Website soll:

* professionell wirken
* einfach erweiterbar sein
* auf allen Geräten funktionieren
* übersichtlich aufgebaut sein
* einen einheitlichen Design-Stil besitzen
