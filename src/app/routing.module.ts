import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MainComponent} from "./components/main/main.component";
import {WasmService} from "./services/wasm.service";

const routes: Routes = [
    {path: 'log', component: MainComponent, resolve: {source: WasmService}},
    {path: 'disk', component: MainComponent, resolve: {source: WasmService}},
    {path: 'tape', component: MainComponent, resolve: {source: WasmService}},
    {path: 'keyboard', component: MainComponent, resolve: {source: WasmService}},
    {path: 'debugger', component: MainComponent, resolve: {source: WasmService}},
    {path: 'graphics', component: MainComponent, resolve: {source: WasmService}},
    {path: 'options', component: MainComponent, resolve: {source: WasmService}},
    {path: 'about', component: MainComponent, resolve: {source: WasmService}},
    {path: '**', component: MainComponent, resolve: {source: WasmService}},
];

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        RouterModule.forRoot(
            routes,
            {enableTracing: false, useHash: true}
        )
    ],
    exports: [
        RouterModule
    ]
})
export class RoutingModule {
}
