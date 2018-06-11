import { Component, OnInit } from '@angular/core';
import {TI994A} from '../emulator/classes/ti994a';
import {DiskImage} from '../emulator/classes/disk';
import {Settings} from '../classes/settings';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit {

  ti994a: TI994A;
  diskImages: {[key: string]: DiskImage};
  settings: Settings;

  constructor() { }

  ngOnInit() {
      this.diskImages = {
          FLOPPY1: new DiskImage("Floppy 1", null)
      };
      this.settings = new Settings(true);
      this.ti994a = new TI994A(document, document.querySelector('canvas'), this.diskImages, this.settings, null);
      this.ti994a.start(false);
  }
}
