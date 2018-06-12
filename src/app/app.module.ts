import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';


import {AppComponent} from './app.component';
import {DebuggerComponent} from './debugger/debugger.component';
import {BsDropdownModule, ModalModule, TooltipModule} from 'ngx-bootstrap';
import {EmulatorModule} from './emulator/emulator.module';

@NgModule({
    declarations: [
        AppComponent,
        DebuggerComponent
    ],
    imports: [
        BrowserModule,
        BsDropdownModule.forRoot(),
        TooltipModule.forRoot(),
        ModalModule.forRoot(),
        EmulatorModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
