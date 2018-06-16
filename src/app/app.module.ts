import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';
import {AngularFontAwesomeModule} from 'angular-font-awesome';
import {EmulatorModule} from './emulator/emulator.module';

import {AppComponent} from './app.component';
import {DebuggerComponent} from './debugger/debugger.component';
import {MainControlsComponent} from './main-controls/main-controls.component';

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
        EmulatorModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
