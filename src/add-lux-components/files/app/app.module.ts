import { LOCALE_ID, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  LuxActionModule,
  LuxAppFooterButtonService,
  LuxAppFooterLinkService,
  LuxCommonModule,
  LuxComponentsConfigModule,
  LuxComponentsConfigParameters,
  LuxConsoleService,
  LuxDirectivesModule,
  LuxErrorModule,
  LuxErrorService,
  LuxFormModule,
  LuxIconModule,
  LuxLayoutModule,
  LuxMasterDetailMobileHelperService,
  LuxPipesModule,
  LuxPopupsModule,
  LuxSnackbarService,
  LuxStepperHelperService
} from '@ihk-gfi/lux-components';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';
import { ProfilComponent } from './profil/profil.component';

import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';

registerLocaleData(localeDE, localeDeExtra);

const luxComponentsConfig: LuxComponentsConfigParameters = {
  generateLuxTagIds: true,
  labelConfiguration: {
    allUppercase: true,
    notAppliedTo: ['lux-side-nav-item', 'lux-menu-item', 'lux-link']
  },
  lookupServiceUrl: '/lookup/'
};

@NgModule({
  declarations: [AppComponent, HomeComponent, ErrorComponent, ProfilComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LuxDirectivesModule,
    LuxIconModule,
    LuxLayoutModule,
    LuxActionModule,
    LuxFormModule,
    LuxCommonModule,
    LuxPipesModule,
    LuxPopupsModule,
    LuxErrorModule,
    FlexLayoutModule,
    LuxComponentsConfigModule.forRoot(luxComponentsConfig)
  ],
  providers: [
    LuxAppFooterButtonService,
    LuxAppFooterLinkService,
    LuxSnackbarService,
    LuxErrorService,
    LuxMasterDetailMobileHelperService,
    LuxStepperHelperService,
    LuxConsoleService,
    { provide: LOCALE_ID, useValue: 'de-DE' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
