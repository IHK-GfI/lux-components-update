import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { SchematicContext } from '@angular-devkit/schematics';
import { UtilConfig } from '../utility/util';
import { appOptions, workspaceOptions } from '../utility/test';
import { removeImport, removeInterface, removeProvider } from './typescript';

const collectionPath = path.join(__dirname, '../collection.json');

describe('typescript', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: any = {};

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', collectionPath);

    appTree = await runner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Method] removeProvider', () => {
    it('Sollte den Provider (mehrere Provider - erster Provider) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxStorageService,
    LuxDialogService,
    DatePipe
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'LuxStorageService', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain('providers      : [\n    LuxDialogService,\n    DatePipe\n  ],');

      done();
    });

    it('Sollte den Provider (mehrere Provider - mittlerer Provider) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxDialogService,
    LuxStorageService,
    DatePipe
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'LuxStorageService', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain('providers      : [\n    LuxDialogService,\n    DatePipe\n  ],');

      done();
    });

    it('Sollte den Provider (mehrere Provider - mittlerer Provider - komplexer Provider) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxDialogService,
    {
      provide : HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi   : true
    },
    DatePipe
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'HTTP_INTERCEPTORS', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain('providers      : [\n    LuxDialogService,\n    DatePipe\n  ],');

      done();
    });

    it('Sollte den Provider (mehrere Provider - letzter Provider) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxDialogService,
    DatePipe,
    LuxStorageService
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'LuxStorageService', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain('providers      : [\n    LuxDialogService,\n    DatePipe\n  ],');

      done();
    });

    it('Sollte den Provider (nicht vorhanden) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  providers      : [
    LuxDialogService,
    DatePipe
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'LuxStorageService', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain('providers      : [\n    LuxDialogService,\n    DatePipe\n  ],');

      done();
    });

    it('Sollte den Provider (Provider-Abschnitt fehlt vollständig) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { environment } from '../environments/environment';

@NgModule({
  declarations   : [
    AppComponent
  ],
  imports        : [
    HttpClientModule,
  ],
    entryComponents: [
    LuxFilePreviewComponent
  ],
  bootstrap      : [
    AppComponent
  ]
})
export class AppModule {
}

        `
      );

      removeProvider(appTree, filePath,  'LuxStorageService', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).not.toContain('providers');

      done();
    });

  });

  describe('[Method] removeInterface', () => {
    it('Sollte das Interface (mehrere Interfaces - erstes Interface) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnInit, OnDestroy, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit, OnDestroy {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeInterface(appTree, filePath,  'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("export class AnbindungLazyComponent implements OnDestroy {");

      done();
    });

    it('Sollte das Interface (mehrere Interfaces - mittleres Interface) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnChanges, OnInit, OnDestroy, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnChanges, OnInit, OnDestroy {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeInterface(appTree, filePath,  'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("export class AnbindungLazyComponent implements OnChanges, OnDestroy {");

      done();
    });

    it('Sollte das Interface (mehrere Interfaces - mittleres Interface - mit extends) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnChanges, OnInit, OnDestroy, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent extends Aaa implements OnChanges, OnInit, OnDestroy {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeInterface(appTree, filePath,  'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("export class AnbindungLazyComponent extends Aaa implements OnChanges, OnDestroy {");

      done();
    });

    it('Sollte das Interface (mehrere Interfaces - letztes Interface) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnChanges, OnInit, OnDestroy, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnChanges, OnDestroy, OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeInterface(appTree, filePath,  'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("export class AnbindungLazyComponent implements OnChanges, OnDestroy {");

      done();
    });

    it('Sollte das Interface (nicht vorhanden) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnChanges, OnDestroy, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeInterface(appTree, filePath,  'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("export class AnbindungLazyComponent {");

      done();
    });

  });

  describe('[Method] removeImport', () => {
    it('Sollte den Import (mehrere Imports - erster Import) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnInit, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/core', 'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import { Component } from '@angular/core';");

      done();
    });

    it('Sollte den Import (mehrere Imports - mittlerer Import) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnDestroy, OnInit, Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/core', 'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import { OnDestroy, Component } from '@angular/core';");

      done();
    });

    it('Sollte den Import (mehrere Imports - mittlerer Import - ohne Leerzeichen) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { OnDestroy,OnInit,Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/core', 'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import { OnDestroy,Component } from '@angular/core';");

      done();
    });

    it('Sollte den Import (mehrere Imports - letzter Import) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { Component, OnInit } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/core', 'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import { Component } from '@angular/core';");

      done();
    });

    it('Sollte den Import (nur Paketname) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import '@angular/common/locales/global/de';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/common/locales/global/de', undefined, false);

      const content = appTree.read(filePath)?.toString();
      expect(content).not.toContain("import");

      done();
    });

    it('Sollte den Import (nur Paketname - nicht vorhanden) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import '@angular/common/locales/global/de';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, 'nichtDaAaa', undefined, false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import '@angular/common/locales/global/de';");

      done();
    });

    it('Sollte den Import (nicht vorhanden) entfernen', (done) => {
      const filePath = testOptions.path + '/src/app/test.component.ts';

      appTree.create(
        filePath,
        `
import { Component } from '@angular/core';

@Component({
  selector   : 'bp-anbindung-lazy',
  templateUrl: './anbindung-lazy.component.html'
})
export class AnbindungLazyComponent implements OnInit {

  constructor() {
  }

  ngOnInit() {     
  }

}

        `
      );

      removeImport(appTree, filePath, '@angular/core', 'OnInit', false);

      const content = appTree.read(filePath)?.toString();
      expect(content).toContain("import { Component } from '@angular/core';");

      done();
    });

  });
});
