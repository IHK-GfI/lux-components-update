import { addAttribute, appendAttribute, removeAttribute, renameAttribute, updateAttribute } from './html';

describe('html', () => {
  describe('addAttribute', () => {
    it('Sollte sollte das Attribut luxTest1..5 hinzufügen', () => {
      let result = addAttribute(templateAdd001, 'lux-table', 'luxTest1', '123');
      result = addAttribute(result.content, 'lux-table', '[luxTest2]', '123');
      result = addAttribute(result.content, 'lux-table', '(luxTest3)', '123');
      result = addAttribute(result.content, 'lux-table', '[(luxTest4)]', '123');
      result = addAttribute(result.content, 'lux-table', 'luxTest5', '');

      expect(result.content).toContain('luxTest1="123"');
      expect(result.content).toContain('[luxTest2]="123"');
      expect(result.content).toContain('(luxTest3)="123"');
      expect(result.content).toContain('[(luxTest4)]="123"');
      expect(result.content).toContain('luxTest5=""');
      expect(result.content).not.toContain('let-element=""');
      expect(result.content).toContain('#testId ');
      expect(result.content).not.toContain('#testId=""');
      expect(result.content).toContain('testDirective ');
      expect(result.content).not.toContain('testDirective=""');
    });
  });

  describe('updateAttribute', () => {
    it('Sollte sollte das Attribut luxTest1..5 updaten', () => {
      let result = updateAttribute(templateUpdate001, 'lux-file-list', 'luxTest1', 'abc');
      result = updateAttribute(result.content, 'lux-file-list', 'luxTest2', 'true');
      result = updateAttribute(result.content, 'lux-file-list', 'luxTest3', 'onNewClick($event, param1)');
      result = updateAttribute(result.content, 'lux-file-list', 'luxTest4', 'newValue4');
      result = updateAttribute(result.content, 'lux-file-list', 'luxTest5', '');

      expect(result.content).toContain('luxTest1="abc"');
      expect(result.content).toContain('[luxTest2]="true"');
      expect(result.content).toContain('(luxTest3)="onNewClick($event, param1)"');
      expect(result.content).toContain('[(luxTest4)]="newValue4"');
      expect(result.content).toContain('[(luxTest5)]=""');
      expect(result.content).not.toContain('let-element=""');
      expect(result.content).toContain('#testId>');
      expect(result.content).not.toContain('#testId=""');
      expect(result.content).toContain('testDirective ');
      expect(result.content).not.toContain('testDirective=""');
    });
  });

  describe('appendAttribute', () => {
    it('Sollte sollte das Attribut luxTest1..5 ergänzen', () => {
      let result = appendAttribute(templateAppend001, 'lux-file-list', 'luxTest1', '_suffix');
      result = appendAttribute(result.content, 'lux-file-list', 'luxTest2', '_suffix');
      result = appendAttribute(result.content, 'lux-file-list', 'luxTest3', '_suffix');
      result = appendAttribute(result.content, 'lux-file-list', 'luxTest4', '_suffix');
      result = appendAttribute(result.content, 'lux-file-list', 'luxTest5', '_suffix');

      expect(result.content).toContain('luxTest1="value1_suffix"');
      expect(result.content).toContain('[luxTest2]="value2_suffix"');
      expect(result.content).toContain('(luxTest3)="value3_suffix"');
      expect(result.content).toContain('[(luxTest4)]="value4_suffix"');
      expect(result.content).toContain('[(luxTest5)]="_suffix"');
      expect(result.content).not.toContain('let-element=""');
      expect(result.content).toContain('#testId>');
      expect(result.content).not.toContain('#testId=""');
      expect(result.content).toContain('testDirective ');
      expect(result.content).not.toContain('testDirective=""');
    });
  });

  describe('renameAttribute', () => {
    it('Sollte sollte das Attribut luxTest1..5 umbenennen', () => {
      let result = renameAttribute(templateRename001, 'mat-chip-list', 'luxTest1', 'luxTestNeu1');
      result = renameAttribute(result.content, 'mat-chip-list', 'luxTest2', 'luxTestNeu2');
      result = renameAttribute(result.content, 'mat-chip-list', 'luxTest3', 'luxTestNeu3');
      result = renameAttribute(result.content, 'mat-chip-list', 'luxTest4', 'luxTestNeu4');
      result = renameAttribute(result.content, 'mat-chip-list', 'luxTest5', 'luxTestNeu5');

      expect(result.content).toContain('luxTestNeu1="123"');
      expect(result.content).not.toContain('luxTest1="123"');
      expect(result.content).toContain('[luxTestNeu2]="123"');
      expect(result.content).not.toContain('luxTest2="123"');
      expect(result.content).toContain('(luxTestNeu3)="123"');
      expect(result.content).not.toContain('luxTest3="123"');
      expect(result.content).toContain('[(luxTestNeu4)]="123"');
      expect(result.content).not.toContain('luxTest4="123"');
      expect(result.content).toContain('[(luxTestNeu5)]=""');
      expect(result.content).not.toContain('luxTest5=""');
      expect(result.content).toContain('#testId ');
      expect(result.content).not.toContain('#testId=""');
      expect(result.content).toContain('testDirective ');
      expect(result.content).not.toContain('testDirective=""');
      expect(result.content).not.toContain('></input>');
    });

    it('Sollte sollte keine End-Tags für Void-Elements hinzufügen', () => {
      const result = renameAttribute(templateRename002, 'input', 'typeWrong', 'type');

      expect(result.content).not.toContain('></input>');
      expect(result.content).not.toContain('></area>');
      expect(result.content).not.toContain('></base>');
      expect(result.content).not.toContain('></br>');
      expect(result.content).not.toContain('></col>');
      expect(result.content).not.toContain('></embed>');
      expect(result.content).not.toContain('></hr>');
      expect(result.content).not.toContain('></img>');
      expect(result.content).not.toContain('></link>');
      expect(result.content).not.toContain('></meta>');
      expect(result.content).not.toContain('></param>');
      expect(result.content).not.toContain('></source>');
      expect(result.content).not.toContain('></track>');
      expect(result.content).not.toContain('></wbr>');
    });
  });

  describe('removeAttribute', () => {
    it('Sollte sollte das Attribut luxTest1..5 entfernen', () => {
      let result = removeAttribute(templateRemove001, 'lux-file-list', 'luxTest1');
      result = removeAttribute(result.content, 'lux-file-list', 'luxTest2');
      result = removeAttribute(result.content, 'lux-file-list', 'luxTest3');
      result = removeAttribute(result.content, 'lux-file-list', 'luxTest4');
      result = removeAttribute(result.content, 'lux-file-list', 'luxTest5');

      expect(result.content).not.toContain('luxTest1');
      expect(result.content).not.toContain('luxTest2');
      expect(result.content).not.toContain('luxTest3');
      expect(result.content).not.toContain('luxTest4');
      expect(result.content).not.toContain('luxTest5');
      expect(result.content).toContain('testDirective ');
      expect(result.content).not.toContain('testDirective=""');
      expect(result.content).toContain('#filelistexamplewithoutform>');
      expect(result.content).not.toContain('#filelistexamplewithoutform=""');
      expect(result.content).toContain('[luxHint]=""');
    });
  });
});

const templateAdd001 = `
<example-base-structure
  exampleTitle="Tabelle"
  exampleIconName="fas fa-table"
  exampleDocumentationHref="https://github.com/IHK-GfI/lux-components/wiki/lux%E2%80%90table"
>
  <example-base-content>
    <div [ngStyle]="{ height: calculateProportions ? tableHeightPx + 'px' : 'unset' }" class="lux-table-example">
      <lux-table
        #testId
        testDirective
        [luxMinWidthPx]="minWidthPx"
        [luxData]="dataSource"
        [luxShowPagination]="pagination"
        [luxColWidthsPercent]="columnWidthOption"
        [luxShowFilter]="filter"
        [luxFilterText]="filterText"
        [luxPageSize]="pageSize"
        [luxClasses]="cssClass"
        [luxPageSizeOptions]="pageSizeOption"
        [luxMultiSelect]="multiSelect"
        [luxMultiSelectOnlyCheckboxClick]="multiSelectOnlyCheckboxClick"
        [luxNoDataText]="noDataText"
        [(luxSelected)]="selected"
        [luxCompareWith]="compareFn"
        (luxSelectedChange)="onSelectedChange($event)"
        [luxHideBorders]="hideBorders"
        [luxAutoPaginate]="autoPagination"
        [luxPagerDisabled]="pagerDisabled"
        [luxPagerTooltip]="pagerTooltip"
      >
        <lux-table-column
          luxColumnDef="name"
          [luxSortable]="nameConfig.sortable"
          [luxSticky]="nameConfig.sticky"
          [luxResponsiveAt]="nameConfig.responsiveAt"
          [luxResponsiveBehaviour]="nameConfig.responsiveBehaviour?.value"
        >
          <lux-table-column-header>
            <ng-template><span [luxTooltip]="'Tooltipp Spalte \\'Name\\''">Name</span></ng-template>
          </lux-table-column-header>
          <lux-table-column-content>
            <ng-template let-element>
              <span *ngIf="!element.editable">{{ element.name }}</span>
              <lux-input
                *ngIf="element.editable"
                luxAriaLabel="Name"
                luxTagId="table.row.control.name"
                class="lux-table-no-label"
                [(luxValue)]="element.name"
              ></lux-input>
            </ng-template>
          </lux-table-column-content>
          <lux-table-column-footer>
            <ng-template> Name Footer </ng-template>
          </lux-table-column-footer>
        </lux-table-column>
        <lux-table-column
          luxColumnDef="symbol"
          [luxSortable]="symbolConfig.sortable"
          [luxSticky]="symbolConfig.sticky"
          [luxResponsiveAt]="symbolConfig.responsiveAt"
          [luxResponsiveBehaviour]="symbolConfig.responsiveBehaviour?.value"
        >
          <lux-table-column-header>
            <ng-template>
              <span [luxTooltip]="'Tooltipp Spalte \\'Symbol\\''">Symbol</span>
            </ng-template>
          </lux-table-column-header>
          <lux-table-column-content>
            <ng-template let-element>
              <span *ngIf="!element.editable">{{ element.symbol | lowercase }}</span>
              <div fxLayout="row wrap">
                <lux-input
                  *ngIf="element.editable"
                  luxAriaLabel="Symbol"
                  luxTagId="table.row.control.symbol"
                  fxFlex="1 1 30%"
                  class="lux-table-no-label"
                  [(luxValue)]="element.symbol"
                ></lux-input>
              </div>
            </ng-template>
          </lux-table-column-content>
          <lux-table-column-footer>
            <ng-template> Symbol Footer </ng-template>
          </lux-table-column-footer>
        </lux-table-column>
        <lux-table-column
          *ngIf="!multiSelect || !multiSelectOnlyCheckboxClick"
          luxColumnDef="date"
          [luxSortable]="dateConfig.sortable"
          [luxSticky]="dateConfig.sticky"
          [luxResponsiveAt]="dateConfig.responsiveAt"
          [luxResponsiveBehaviour]="dateConfig.responsiveBehaviour?.value"
        >
          <lux-table-column-header>
            <ng-template>Datum</ng-template>
          </lux-table-column-header>
          <lux-table-column-content>
            <ng-template let-element
              ><span>{{ element.date | date: 'dd.MM.yyyy' }}</span></ng-template
            >
          </lux-table-column-content>
          <lux-table-column-footer>
            <ng-template> Datum Footer </ng-template>
          </lux-table-column-footer>
        </lux-table-column>
        <lux-table-column *ngIf="multiSelect && multiSelectOnlyCheckboxClick" luxColumnDef="Aktion" [luxSortable]="false">
          <lux-table-column-header>
            <ng-template>Aktion</ng-template>
          </lux-table-column-header>
          <lux-table-column-content>
            <ng-template let-element>
              <lux-button
                *ngIf="!element.editable"
                luxAriaLabel="Editieren"
                luxTagId="table.row.action.edit"
                class="lux-table-example"
                luxColor="primary"
                luxIconName="fas fa-edit"
                (luxClicked)="onEdit(element)"
              ></lux-button>
              <lux-button
                *ngIf="element.editable"
                luxAriaLabel="Speichern"
                luxTagId="table.row.action.save"
                class="lux-table-example"
                luxColor="primary"
                luxIconName="fas fa-save"
                (luxClicked)="onSave(element)"
              ></lux-button>
              <lux-button
                *ngIf="element.editable"
                luxAriaLabel="Abbrechen"
                luxTagId="table.row.action.cancel"
                class="lux-table-example"
                luxColor="primary"
                luxIconName="fas fa-undo"
                (luxClicked)="onCancel(element)"
              ></lux-button>
            </ng-template>
          </lux-table-column-content>
          <lux-table-column-footer>
            <ng-template> Aktion Footer </ng-template>
          </lux-table-column-footer>
        </lux-table-column>
      </lux-table>
    </div>
  </example-base-content>
  <example-base-simple-options>
    <table-example-simple-options [tableExample]="this"></table-example-simple-options>
  </example-base-simple-options>
  <example-base-advanced-options>
    <table-example-advanced-options [tableExample]="this"></table-example-advanced-options>
  </example-base-advanced-options>
  <example-base-options-actions>
    <lux-menu
      fxFlex="0 0 250px"
      luxMenuIconName="fas fa-ellipsis-v"
      [luxDisplayExtended]="true"
      [luxDisplayMenuLeft]="false"
      [luxMaximumExtended]="4"
    >
      <lux-menu-item
        luxLabel="Ersten 5 auswählen"
        [luxRaised]="true"
        [luxDisabled]="!multiSelect"
        (luxClicked)="preselect()"
        luxTagId="menu-select-5"
      >
      </lux-menu-item>
      <lux-menu-item
        luxLabel="Tabelle leeren"
        luxColor="warn"
        [luxDisabled]="dataSource.length === 0"
        [luxRaised]="true"
        (luxClicked)="clearData()"
        luxTagId="menu-clear"
      >
      </lux-menu-item>
      <lux-menu-item
        luxLabel="Tabelle befüllen (300)"
        luxColor="accent"
        (luxClicked)="loadData(true)"
        [luxRaised]="true"
        luxTagId="menu-fill-300"
      >
      </lux-menu-item>
      <lux-menu-item
        luxLabel="Tabelle befüllen (30)"
        luxColor="accent"
        (luxClicked)="loadData(false)"
        [luxRaised]="true"
        luxTagId="menu-fill-30"
      >
      </lux-menu-item>
    </lux-menu>
  </example-base-options-actions>
</example-base-structure>
        `;

const templateRename001 = `
<div class="lux-chips" fxLayout="column">
  <lux-form-control 
    testDirective
    [luxScalableHeight]="true"
    [luxFormComponent]="this"
    [luxHideBottomBorder]="!luxInputAllowed"
    [luxIgnoreDefaultLabel]="!luxInputAllowed"
  >
    <mat-chip-list
      [ngClass]="[
        luxOrientation.toLocaleLowerCase() === 'vertical' ? 'mat-chip-list-stacked' : 'mat-chip-list-horizontal',
        luxOrientation === 'horizontal' && luxInputAllowed ? 'lux-chips-list-offset' : 'lux-chips-list'
      ]"
      luxTest1="123"
      [luxTest2]="123"
      (luxTest3)="123"
      [(luxTest4)]="123"
      [(luxTest5)]=""
      [disabled]="luxDisabled"
      [aria-orientation]="luxOrientation"
      [multiple]="luxMultiple"
      #testId
    >
      <!-- Direkte Chip-Components -->
      <ng-container *ngFor="let chip of chipComponents; let i = index">
        <mat-chip
          class="lux-chip"
          [ngClass]="{ 'lux-chip-selected': chip.luxSelected, 'lux-chip-disabled': chip.luxDisabled }"
          [removable]="chip.luxRemovable"
          [disabled]="chip.luxDisabled"
          [selectable]="!chip.luxDisabled"
          [selected]="chip.luxSelected"
          [color]="chip.luxColor"
          (keydown.delete)="chip.remove(i)"
          (selectionChange)="chip.select($event.selected, i)"
          (click)="chip.click(i)"
        >
          <ng-template *ngTemplateOutlet="chip.templateRef"></ng-template>
          <lux-icon
            class="lux-chip-icon lux-chip-icon lux-cursor"
            [ngClass]="{ 'lux-chip-icon-selected': chip.luxSelected, 'lux-chip-icon-disabled': chip.luxDisabled }"
            matChipRemove
            luxIconName="cancel"
            luxMargin="0 0 0 6px"
            luxPadding="2px"
            (click)="chip.remove(i)"
            *ngIf="chip.luxRemovable"
          ></lux-icon>
        </mat-chip>
      </ng-container>

      <!-- Chips via ChipGroup-Components -->
      <ng-container *ngFor="let chipGroup of chipGroupComponents">
        <ng-container *ngFor="let label of chipGroup.luxLabels; let i = index">
          <mat-chip
            class="lux-chip"
            [ngClass]="{ 'lux-chip-selected': chipGroup.luxSelected, 'lux-chip-disabled': chipGroup.luxDisabled }"
            [removable]="chipGroup.luxRemovable"
            [disabled]="chipGroup.luxDisabled"
            [selectable]="!chipGroup.luxDisabled"
            [selected]="chipGroup.luxSelected"
            [color]="chipGroup.luxColor"
            (keydown.delete)="chipGroup.remove(i)"
            (selectionChange)="chipGroup.select($event.selected, i)"
            (click)="chipGroup.click(i)"
          >
            <ng-container
              *ngTemplateOutlet="chipGroup.tempRef ? chipGroup.tempRef : noTemplateRef; context: { $implicit: label }"
            ></ng-container>
            <lux-icon
              class="lux-chip-icon lux-chip-icon lux-cursor"
              [ngClass]="{ 'lux-chip-icon-selected': chipGroup.luxSelected, 'lux-chip-icon-disabled': chipGroup.luxDisabled }"
              matChipRemove
              luxIconName="cancel"
              luxMargin="0 0 0 6px"
              luxPadding="2px"
              (click)="chipGroup.remove(i)"
              *ngIf="chipGroup.luxRemovable"
            ></lux-icon>
          </mat-chip>
        </ng-container>
      </ng-container>

      <ng-container *ngIf="luxInputAllowed">
        <input
          [id]="uid"
          [matChipInputFor]="testId"
          [matChipInputAddOnBlur]="true"
          [matAutocomplete]="auto"
          [attr.aria-labelledby]="uid + '-label'"
          [disabled]="luxDisabled"
          (matChipInputTokenEnd)="inputAdd(input)"
          (keyup)="inputChanged(input.value)"
          (click)="onAutocompleteClick()"
          type="text"
          fxFlex="1 1 auto"
          #input
        />
        <mat-autocomplete
          [class]="'lux-autocomplete-panel'"
          (optionSelected)="autoCompleteAdd(input, $event.option.value)"
          (opened)="onAutoCompleteOpened()"
          #auto="matAutocomplete"
        >
          <mat-option *ngFor="let option of filteredOptions" [value]="option">
            {{ option }}
          </mat-option>
        </mat-autocomplete>
      </ng-container>
    </mat-chip-list>
  </lux-form-control>
</div>

<ng-template #noTemplateRef let-label>
  {{ label }}
</ng-template>
        `;

const templateRename002 = `
<input typeWrong="text" />
<area />
<base />
<br />
<col />
<embed />
<hr />
<img />
<link />
<meta />
<param />
<source />
<track />
<wbr /> 

<input typeWrong="text">
<area>
<base>
<br>
<col>
<embed>
<hr>
<img>
<link>
<meta>
<param>
<source>
<track>
<wbr>
    `;

const templateRemove001 = `
<div fxFlex="auto" fxLayout="column">
      <h3>Ohne ReactiveForm</h3>
      <lux-file-list
        testDirective
        [luxLabel]="label"
        [luxDownloadActionConfig]="downloadActionConfig"
        [luxMaximumExtended]="maximumExtended"
        [luxCapture]="capture"
        [luxAccept]="accept"
        [luxHint]=""
        [luxHintShowOnlyOnFocus]="hintShowOnlyOnFocus"
        [luxDnDActive]="dndActive"
        [luxSelectedFiles]="selected"
        [luxContentsAsBlob]="contentAsBlob"
        [luxUploadReportProgress]="reportProgress"
        (luxSelectedFilesChange)="onSelectedChange($event)"
        luxTest1="true"
        [luxTest2]="true"
        (luxTest3)="true"
        [(luxTest4)]="true"
        [(luxTest5)]=""
        (luxFocusIn)="log(showOutputEvents, 'luxFocusIn', $event)"
        (luxFocusOut)="log(showOutputEvents, 'luxFocusOut', $event)"
        #filelistexamplewithoutform
      >
      </lux-file-list>
    </div>
        `;

const templateUpdate001 = `
<div fxFlex="auto" fxLayout="column">
      <h3>Ohne ReactiveForm</h3>
      <lux-file-list
        testDirective 
        [luxLabel]="label"
        [luxDownloadActionConfig]="downloadActionConfig"
        [luxMaximumExtended]="maximumExtended"
        [luxCapture]="capture"
        [luxAccept]="accept"
        [luxHint]=""
        [luxHintShowOnlyOnFocus]="hintShowOnlyOnFocus"
        [luxDnDActive]="dndActive"
        [luxSelectedFiles]="selected"
        [luxContentsAsBlob]="contentAsBlob"
        [luxUploadReportProgress]="reportProgress"
        (luxSelectedFilesChange)="onSelectedChange($event)"
        luxTest1="value1"
        [luxTest2]="value2"
        (luxTest3)="onClick($event)"
        [(luxTest4)]="value4"
        [(luxTest5)]="value5"
        (luxFocusIn)="log(showOutputEvents, 'luxFocusIn', $event)"
        (luxFocusOut)="log(showOutputEvents, 'luxFocusOut', $event)"
        #testId 
      >
      </lux-file-list>
    </div>
            `;

const templateAppend001 = `
<div fxFlex="auto" fxLayout="column">
      <h3>Ohne ReactiveForm</h3>
      <lux-file-list
        testDirective 
        [luxLabel]="label"
        [luxDownloadActionConfig]="downloadActionConfig"
        [luxMaximumExtended]="maximumExtended"
        [luxCapture]="capture"
        [luxAccept]="accept"
        [luxHint]=""
        [luxHintShowOnlyOnFocus]="hintShowOnlyOnFocus"
        [luxDnDActive]="dndActive"
        [luxSelectedFiles]="selected"
        [luxContentsAsBlob]="contentAsBlob"
        [luxUploadReportProgress]="reportProgress"
        (luxSelectedFilesChange)="onSelectedChange($event)"
        luxTest1="value1"
        [luxTest2]="value2"
        (luxTest3)="value3"
        [(luxTest4)]="value4"
        [(luxTest5)]=""
        (luxFocusIn)="log(showOutputEvents, 'luxFocusIn', $event)"
        (luxFocusOut)="log(showOutputEvents, 'luxFocusOut', $event)"
        #testId 
      >
      </lux-file-list>
    </div>
            `;
