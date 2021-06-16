import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import localeDeExtra from '@angular/common/locales/extra/de';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {
  LuxActionModule,
  LuxCommonModule,
  LuxComponentsConfigModule,
  LuxComponentsConfigParameters,
  LuxDirectivesModule,
  LuxErrorModule,
  LuxFormModule,
  LuxIconModule,
  LuxLayoutModule,
  LuxPipesModule,
  LuxPopupsModule
} from '@ihk-gfi/lux-components';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';
import { ProfilComponent } from './profil/profil.component';

registerLocaleData(localeDE, localeDeExtra);

const luxComponentsConfig: LuxComponentsConfigParameters = {
  generateLuxTagIds: environment.generateLuxTagIds,
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
