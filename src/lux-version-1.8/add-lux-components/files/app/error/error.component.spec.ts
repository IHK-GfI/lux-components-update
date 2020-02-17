import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  LuxActionModule,
  LuxAppFooterButtonService,
  LuxAppFooterLinkService,
  LuxIconModule,
  LuxLayoutModule,
  LuxFormModule,
  LuxStorageService,
  LuxComponentsConfigModule,
  LuxComponentsConfigParameters,
} from '@IHK-GfI/lux-components';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;
  const luxComponentsConfig: LuxComponentsConfigParameters = {};

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorComponent ],
      imports     : [
        LuxLayoutModule,
        LuxActionModule,
        LuxIconModule,
        LuxFormModule,
        RouterTestingModule.withRoutes([]),
        LuxComponentsConfigModule.forRoot(luxComponentsConfig),
        NoopAnimationsModule
      ],
      providers   : [
        LuxAppFooterButtonService,
        LuxAppFooterLinkService,
        LuxStorageService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
