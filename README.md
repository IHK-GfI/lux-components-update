# Update der Lux-Components mithilfe von Angular Schematics

Für automatisierte Updates von LUX-Components Versionen nutzen wir Angular Schematics. Das entsprechende Projekt nennt sich lux-components-update.

## Voraussetzungen 

Stellen Sie zunächst sicher, dass Sie die Node v6.9 oder höher installiert haben. Installieren Sie anschließend zwei NPM-Tools global:

```bash
npm install -g @angular/cli
npm install -g @angular-devkit/schematics-cli
```

## Ein neuen Lux-Components-Updater erstellen

Um eine neue Version des Lux-Components-Updater anzulegen, wird das Ausführen folgenden Befehls benötigt:

```bash
schematics lux-components-update:lux-create-version
```

## Ausführen eines Lux-Components-Updaters

Eine Update-Schematic kann über den folgenden Aufruf gestartet werden:

```bash
ng generate lux-components-update:lux-version-x.y.z
```

Dabei ist zu beachten, dass die aktuelle LUX-Components Version in der package.json eine Version unterhalb des Schematics-Generators sein muss 
(z.B. "lux-components": "1.7.9" wenn "ng generate lux-components-update:lux-version-1.7.10" genutzt werden soll).

Falls erst einmal ein Testdurchlauf ohne persistente Änderungen gewünscht ist, ist es möglich den Aufruf mit dem Flag --dry-run zu versehen:

```bash
ng generate lux-components-update:lux-version-x.y.z --dry-run
```

