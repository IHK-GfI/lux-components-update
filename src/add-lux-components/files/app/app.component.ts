import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LuxThemeService } from '@ihk-gfi/lux-components';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(public router: Router, themeService: LuxThemeService) {
    themeService.loadTheme();
    router.initialNavigation();
  }

}
