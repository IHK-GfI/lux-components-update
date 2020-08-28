# LUX-Components-Update

Dieses Projekt enthält Updateskripte (umgesetzt mit Angular Schematics) für die LUX-Components. 
D.h. alle Projekte auf Basis der LUX-Components können über dieses Projekt einfach aktualisiert 
werden. 

## Voraussetzungen 

Stellen Sie zunächst sicher, dass Sie die Node-Version 6.9 oder höher installiert haben. 
Installieren Sie anschließend das folgende NPM-Paket global:

```bash
npm install -g @angular-devkit/schematics-cli
```

## LUX-Components aktualisieren

Um ein Updateskript zu starten, kann der folgende Befehl verwendet werden: 

```bash
ng generate @ihk-gfi/lux-components-update:lux-version-x.y.z
```

Dabei ist zu beachten, dass die LUX-Componentsversion in der package.json 
genau eine Version unterhalb des Updateskripts sein muss. D.h.
für das Updateskript "ng generate @ihk-gfi/lux-components-update:lux-version-1.8.4"
muss die LUX-Componentsversion 1.8.3 in der package.json stehen.

Falls erst einmal ein Testdurchlauf ohne persistente Änderungen gewünscht ist, 
ist es möglich den Aufruf mit dem Flag "--dry-run" zu versehen:

```bash
ng generate @ihk-gfi/lux-components-update:lux-version-x.y.z --dry-run
```

## Ein neuen Lux-Components-Updater erstellen

Um eine neue Version des Lux-Components-Updater anzulegen, 
kann der folgende Befehl verwendet werden: 

```bash
schematics .:lux-create-version --dry-run=false
```
