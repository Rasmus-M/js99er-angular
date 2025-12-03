import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { Js99erModule } from './app/js99er.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(Js99erModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.log(err));
