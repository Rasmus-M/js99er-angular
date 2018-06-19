import {Component, OnInit} from '@angular/core';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {Settings} from './classes/settings';
import {DiskImage} from './emulator/classes/disk';
import {AudioService} from './services/audio.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [CommandDispatcherService]
})
export class AppComponent implements OnInit {

    title = "JS99'er";

    diskImages: {[key: string]: DiskImage};
    settings: Settings;

    constructor(private audioService: AudioService) {
    }

    ngOnInit() {
      this.diskImages = {
          FLOPPY1: new DiskImage("Floppy 1", null),
          FLOPPY2: new DiskImage("Floppy 2", null),
          FLOPPY3: new DiskImage("Floppy 3", null)
      };
      this.settings = new Settings(true);
      this.settings.setF18AEnabled(true);
    }

    onConsoleReady(ti994A) {
        this.audioService.init(this.settings.isSoundEnabled(), ti994A.getPSG(), ti994A.getSpeech(), ti994A.getTape());
    }
}
