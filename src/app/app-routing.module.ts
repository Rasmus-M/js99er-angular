import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from "./components/main/main.component";

const appRoutes: Routes = [
    {path: 'cart/:cart', component: MainComponent},
    {path: '**', component: MainComponent},
];

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule.forRoot(
            appRoutes,
            {enableTracing: false}
        ),
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {
}
