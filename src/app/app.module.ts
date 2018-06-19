import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';
import {AngularFontAwesomeModule} from 'angular-font-awesome';
import {HttpClientModule} from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import {EmulatorModule} from './emulator/emulator.module';
import {AppComponent} from './app.component';
import {DebuggerComponent} from './debugger/debugger.component';
import {MainControlsComponent} from './main-controls/main-controls.component';
import {ModuleService} from './services/module.service';
import {AudioService} from './services/audio.service';
import {ZipService} from './services/zip.service';

@NgModule({
    declarations: [
        AppComponent,
        DebuggerComponent,
        MainControlsComponent
    ],
    imports: [
        BrowserModule,
        BsDropdownModule.forRoot(),
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        AngularFontAwesomeModule,
        HttpClientModule,
        EmulatorModule,
        FormsModule
    ],
    providers: [
        ModuleService,
        AudioService,
        ZipService
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
