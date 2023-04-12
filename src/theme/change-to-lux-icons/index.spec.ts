import { callRule, SchematicContext } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { of as observableOf } from 'rxjs';
import { appOptions, workspaceOptions } from '../../utility/test';
import { UtilConfig } from '../../utility/util';
import { changeToLuxIcons } from './index';

describe('update140000', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;
  let context: SchematicContext;

  const testOptions: { project: string; path: string; verbose: boolean } = {
    project: '',
    path: '/',
    verbose: false
  };

  beforeEach(async () => {
    const collectionPath = path.join(__dirname, '../../collection.json');
    runner = new SchematicTestRunner('schematics', collectionPath);

    const collection = '@schematics/angular';
    appTree = await runner.runExternalSchematic(collection, 'workspace', workspaceOptions);
    appTree = await runner.runExternalSchematic(collection, 'application', appOptions, appTree);

    context = runner.engine.createContext(
      runner.engine.createSchematic('change-to-lux-icons', runner.engine.createCollection(collectionPath))
    );

    UtilConfig.defaultWaitMS = 0;

    testOptions.project = appOptions.name;
    testOptions.path = workspaceOptions.newProjectRoot + '/' + appOptions.name;
    testOptions.verbose = true;
  });

  describe('[Rule] changeToLuxIcons', () => {
    it('Sollte auf die neuen Icons wechseln', (done) => {
      const filePath = testOptions.path + '/changeToLuxIcons/Test.component.html';
      appTree.create(filePath, appComponentHtmlContent);

      callRule(changeToLuxIcons(testOptions), observableOf(appTree), context).subscribe({
        next: (success) => {
          const content = success.read(filePath)?.toString();

          expect(content).toContain('luxIconName="lux-control-button-power-1"');
          expect(content).toContain('luxIconName="lux-factory"');
          expect(content).toContain('luxIconName="lux-interface-alert-alarm-bell-2"');
          expect(content).toContain('luxIconName="lux-interface-home-3"');
          expect(content).toContain('luxIconName="lux-interface-lighting-light-bulb"');

          expect(content).not.toContain('luxIconName="fa-power-off"');
          expect(content).not.toContain('luxIconName="far fa-building"');
          expect(content).not.toContain('luxIconName="fas fa-bell"');
          expect(content).not.toContain('luxIconName="fas fa-home"');
          expect(content).not.toContain('luxIconName="far fa-lightbulb"');

          done();
        },
        error: (reason) => expect(reason).toBeUndefined()
      });
    });
  });
});

const appComponentHtmlContent = `
<div class="lux-app-container">
  <lux-app-header
    luxAppTitle="LUX Components"
    luxAppTitleShort="Components"
    luxUserName="Max Mustermann"
    luxIconName="far fa-lightbulb"
    luxImageSrc="assets/png/example.png"
    luxAriaTitleIconLabel="Titelicon  / Zur Hauptseie"
    luxAriaTitleImageLabel="Titelbild  / Zur Hauptseie"
    luxAriaTitleLinkLabel="LUX Components / Zur Hauptseie"
    [luxLocaleSupported]="['de', 'en']"
    *ngIf="this.luxAppHeader !== 'none' && themeName !== 'authentic'"
    (luxClicked)="router.navigate(['/'])"
  >
    <lux-side-nav
      luxDashboardLink="https://github.com/IHK-GfI/lux-components/wiki"
      [luxOpenLinkBlank]="true"
      luxSideNavExpandedChange="onSideNavExpandedChange($event)"
      [luxSideNavExpandedChange]="onSideNavExpandedChange($event)"
      (luxSideNavExpandedChange)="onSideNavExpandedChange($event)"
      [(luxSideNavExpandedChange)]="onSideNavExpandedChange($event)"
    >
      <lux-side-nav-header>
        <h3 class="lux-side-nav-header-greeting">Navigation</h3>
      </lux-side-nav-header>
      <lux-side-nav-item
        luxLabel="Home"
        luxIconName="fas fa-home"
        (luxClicked)="goToHome()"
        luxTagId="home-side-nav-item"
        [luxSelected]="url.endsWith('home')"
      >
      </lux-side-nav-item>
      <lux-side-nav-footer>
        <div fxLayout="row" fxLayoutAlign="center center" fxLayoutGap="8px">
          <lux-button luxLabel="Aufklappen" [luxRaised]="true" (luxClicked)="navigationService.onExpandAll()"></lux-button>
        </div>
      </lux-side-nav-footer>
    </lux-side-nav>
    <lux-app-header-action-nav>
      <lux-app-header-action-nav-item
        fxShow="true" fxShow.xs="false"
        luxIconName="fas fa-bell"
        luxColor="accent"
        luxAriaLabel="Nachrichten anzeigen"
        luxTagId="action0"
        (luxClicked)="actionClicked('#0 Action clicked!')"
      >
      </lux-app-header-action-nav-item>
      <lux-app-header-action-nav-item>
        <lux-app-header-action-nav-item-custom>
          <lux-menu luxMenuLabel="IHK" luxMenuIconName="fas fa-caret-down" [luxMenuTriggerIconShowRight]="true" [luxDisplayExtended]="false">
            <lux-menu-item luxLabel="IHK 101" luxIconName="far fa-building" (luxClicked)="actionClicked('IHK 101-Action clicked!')"></lux-menu-item>
          </lux-menu>
        </lux-app-header-action-nav-item-custom>
      </lux-app-header-action-nav-item>
    </lux-app-header-action-nav>
    <lux-app-header-right-nav>
      <lux-menu-item luxLabel="Abmelden" luxIconName="fa-power-off" luxTagId="abmelden-menu-item"></lux-menu-item>
    </lux-app-header-right-nav>
  </lux-app-header>
`;
