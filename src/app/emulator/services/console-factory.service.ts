import { Injectable } from '@angular/core';
import {TI994A} from "../classes/ti994a";
import {DiskImage} from "../classes/disk-image";
import {Settings} from "../../classes/settings";
import {Console} from "../interfaces/console";
import {WasmService} from "../../services/wasm.service";
import {CPU} from "../interfaces/cpu";
import {DatabaseService} from "../../services/database.service";
import {SettingsService} from "../../services/settings.service";

@Injectable({
  providedIn: 'root'
})
export class ConsoleFactoryService {

  constructor(
      private settingsService: SettingsService,
      private wasmService: WasmService,
      private databaseService: DatabaseService
  ) { }

  create(document: HTMLDocument, canvas: HTMLCanvasElement, diskImages: DiskImage[], onBreakpoint: (cpu: CPU) => void): Console {
     const ti994A = new TI994A(document, canvas, diskImages, this.settingsService.getSettings(), this.databaseService, this.wasmService, onBreakpoint);
     ti994A.reset(false);
     return ti994A;
  }
}
