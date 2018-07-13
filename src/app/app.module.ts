import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AngularFontAwesomeModule} from 'angular-font-awesome';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {MatMenuModule, MatTabsModule, MatCardModule, MatButtonModule, MatCheckboxModule, MatSelectModule, MatIconModule, MatDividerModule,
        MatToolbarModule, MatTableModule, MatInputModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {EmulatorModule} from './emulator/emulator.module';
import {AppComponent} from './app.component';
import {DebuggerComponent} from './components/debugger/debugger.component';
import {MainControlsComponent} from './components/main-controls/main-controls.component';
import {ModuleService} from './services/module.service';
import {AudioService} from './services/audio.service';
import {ZipService} from './services/zip.service';
import {DiskService} from './services/disk.service';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {ObjectLoaderService} from './services/object-loader.service';
import {SoftwareMenuService} from './services/software-menu.service';
import {SettingsService} from './services/settings.service';
import {SettingsComponent} from './components/settings/settings.component';
import {LogComponent} from './components/log/log.component';
import {EventDispatcherService} from './services/event-dispatcher.service';
import {KeyboardComponent} from './components/keyboard/keyboard.component';
import {DiskComponent} from './components/disk/disk.component';
import {TapeComponent} from './components/tape/tape.component';
import { SoftwareMenuComponent } from './components/software-menu/software-menu.component';

@NgModule({
    declarations: [
        AppComponent,
        DebuggerComponent,
        MainControlsComponent,
        SettingsComponent,
        LogComponent,
        KeyboardComponent,
        DiskComponent,
        TapeComponent,
        SoftwareMenuComponent
    ],
    imports: [
        BrowserModule,
        MatMenuModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatCheckboxModule,
        MatSelectModule,
        MatIconModule,
        MatDividerModule,
        MatToolbarModule,
        MatTableModule,
        MatInputModule,
        BrowserAnimationsModule,
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
        EventDispatcherService,
        ObjectLoaderService,
        SoftwareMenuService,
        SettingsService

    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
