import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocompleteModule } from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatTabsModule} from '@angular/material/tabs';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltipModule} from "@angular/material/tooltip";
import {EmulatorModule} from './emulator/emulator.module';
import {RoutingModule} from './routing.module';
import {Js99erComponent} from './js99er.component';
import {MainComponent} from './components/main/main.component';
import {DebuggerComponent} from './components/debugger/debugger.component';
import {MainControlsComponent} from './components/main-controls/main-controls.component';
import {OptionsComponent} from './components/options/options.component';
import {LogComponent} from './components/log/log.component';
import {KeyboardComponent} from './components/keyboard/keyboard.component';
import {DiskComponent} from './components/disk/disk.component';
import {TapeComponent} from './components/tape/tape.component';
import {SoftwareMenuComponent} from './components/software-menu/software-menu.component';
import {MoreSoftwareComponent} from './components/more-software/more-software.component';
import {AboutComponent} from './components/about/about.component';
import {GraphicsComponent} from './components/graphics/graphics.component';
import {ModuleService} from './services/module.service';
import {AudioService} from './services/audio.service';
import {DiskService} from './services/disk.service';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {ObjectLoaderService} from './services/object-loader.service';
import {SettingsService} from './services/settings.service';
import {EventDispatcherService} from './services/event-dispatcher.service';
import {ConfigService} from "./services/config.service";
import {DebuggerDialogComponent} from "./components/debugger-dialog/debugger-dialog.component";
import {MatGridListModule} from "@angular/material/grid-list";
import {HexInputFieldComponent} from "./components/hex-input-field/hex-input-field.component";
import {ErrorDialogComponent} from "./components/error-dialog/error-dialog.component";

@NgModule({
    declarations: [
        Js99erComponent,
        DebuggerComponent,
        MainControlsComponent,
        OptionsComponent,
        LogComponent,
        KeyboardComponent,
        DiskComponent,
        TapeComponent,
        SoftwareMenuComponent,
        MoreSoftwareComponent,
        AboutComponent,
        GraphicsComponent,
        MainComponent,
        DebuggerDialogComponent,
        HexInputFieldComponent,
        ErrorDialogComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
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
        MatDialogModule,
        MatListModule,
        MatAutocompleteModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        FontAwesomeModule,
        HttpClientModule,
        EmulatorModule,
        RoutingModule,
        MatTooltipModule,
        MatGridListModule
    ],
    providers: [
        ModuleService,
        DiskService,
        AudioService,
        CommandDispatcherService,
        EventDispatcherService,
        ObjectLoaderService,
        SettingsService,
        ConfigService
    ],
    bootstrap: [
        Js99erComponent
    ]
})
export class Js99erModule {
}
