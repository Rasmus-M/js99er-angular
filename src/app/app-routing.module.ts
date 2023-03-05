import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from "./components/main/main.component";
import {WasmService} from "./services/wasm.service";

const appRoutes: Routes = [
    {path: 'cart/:cart', component: MainComponent, resolve: {source: WasmService}},
    {path: '**', component: MainComponent, resolve: {source: WasmService}},
];

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule.forRoot(
            appRoutes,
            {enableTracing: false, useHash: true}
        ),
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule {
}
