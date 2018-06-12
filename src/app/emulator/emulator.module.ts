import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConsoleComponent} from './console/console.component';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ConsoleComponent
    ],
    exports: [
        ConsoleComponent
    ]
})
export class EmulatorModule {
}
