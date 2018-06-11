import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { DebuggerComponent } from './debugger/debugger.component';
import { ConsoleComponent } from './console/console.component';


@NgModule({
  declarations: [
    AppComponent,
    DebuggerComponent,
    ConsoleComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
