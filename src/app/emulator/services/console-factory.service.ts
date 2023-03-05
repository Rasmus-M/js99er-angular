import { Injectable } from '@angular/core';
import {TI994A} from "../classes/ti994a";
import {DiskImage} from "../classes/diskimage";
import {Settings} from "../../classes/settings";
import {Console} from "../interfaces/console";
import {WasmService} from "../../services/wasm.service";

@Injectable({
  providedIn: 'root'
})
export class ConsoleFactoryService {

  constructor(
      private wasmService: WasmService
  ) { }

  create(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], settings: Settings, onBreakpoint: (CPU) => void): Console {
     return new TI994A(document, canvas, diskImages, settings, this.wasmService, onBreakpoint);
  }
}
