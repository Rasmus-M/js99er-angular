import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {TI994A} from '../emulator/classes/ti994a';
import {DiskImage} from '../emulator/classes/disk';
import {Settings} from '../classes/settings';
import {Sound} from '../classes/sound';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit, AfterViewInit {

  private canvas: HTMLCanvasElement;
  private diskImages: {[key: string]: DiskImage};
  private settings: Settings;
  private console: TI994A;
  private sound: Sound;

  constructor(private element: ElementRef) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
      this.canvas = this.element.nativeElement.querySelector('canvas');
      this.diskImages = {
          FLOPPY1: new DiskImage("Floppy 1", null),
          FLOPPY2: new DiskImage("Floppy 2", null),
          FLOPPY3: new DiskImage("Floppy 3", null)
      };
      this.settings = new Settings(true);
      this.settings.setF18AEnabled(true);
      this.console = new TI994A(document, this.canvas, this.diskImages, this.settings, null);
      this.sound = new Sound(true, this.console.getPSG(), this.console.getSpeech(), this.console.getTape());
      this.console.start(false);
  }
}
