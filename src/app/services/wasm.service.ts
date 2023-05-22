import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class WasmService implements Resolve<any> {

    private exports: any;
    private buffer: ArrayBuffer;

    constructor() {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return this.instantiateWasm();
    }

    private instantiateWasm() {
        const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
        return WebAssembly.instantiateStreaming(fetch('./assets/wasm/index.wasm'), {env: {
                memory,
                abort: (message, fileName, lineNumber, columnNumber) => { console.error(message); }
            }}).then(
            (source: WebAssembly.WebAssemblyInstantiatedSource) => {
                this.exports = source.instance.exports;
                this.buffer = memory.buffer;
            }
        );
    }

    public getExports() {
        return this.exports;
    }

    public getMemoryBuffer(): ArrayBuffer {
        return this.buffer;
    }
}
