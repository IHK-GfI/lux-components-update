# LUX-Components-Update

Dieses Projekt enthält alle Updateskripte (umgesetzt mit Angular Schematics) für die LUX-Components.

Updateskripte:

- `update` (aktualisiert das Projekt auf die Version 11.0.0)
- `update-11.0.1` (aktualisiert das Projekt auf die Version 11.0.1)
- `update-11.1.0` (aktualisiert das Projekt auf die Version 11.1.0)
- `add-lux-components` (fügt die LUX-Components zu einem Angular-Projekt hinzu)
- `migrate-to-eslint` (migriert das Projekt von TS-Lint nach ES-Lint)
- `migrate-to-webcomponent` (wandelt das Projekt in eine Web Component)

## Voraussetzungen

Stellen Sie zunächst sicher, dass Sie die Angular-Schematics-Cli installiert haben:

```bash
npm install -g @angular-devkit/schematics-cli
```

## LUX-Components im Projekt aktualisieren

Um ein Updateskript zu starten, kann der folgende Befehl verwendet werden:

```bash
ng generate @ihk-gfi/lux-components-update:update
```

Falls erst einmal ein Testdurchlauf ohne persistente Änderungen gewünscht ist,
ist es möglich den Aufruf mit dem Flag "--dry-run" zu versehen:

```bash
ng generate @ihk-gfi/lux-components-update:update --dry-run
```

## LUX-Components im Projekt einrichten

Wenn man die LUX-Components in seinem Projekt einrichten möchte, kann der folgende Befehl verwendet werden:

```bash
ng generate @ihk-gfi/lux-components-update:add-lux-components
```

## Migration von TS-Lint nach ES-Lint
```bash
ng generate @ihk-gfi/lux-components-update:migrate-to-eslint
```

WICHTIG! Der Updater schreibt zusätzliche Befehle in die Console. Diese müssen manuell ausgeführt werden.

## Migration zur Web Component
```bash
ng generate @ihk-gfi/lux-components-update:migrate-to-webcomponent
```
