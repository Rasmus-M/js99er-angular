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
import {DiskService} from './services/disk.service';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {ObjectLoaderService} from './services/object-loader.service';

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
        DiskService,
        AudioService,
        ZipService,
        CommandDispatcherService,
        ObjectLoaderService
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
