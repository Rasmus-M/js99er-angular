import {Component, OnInit} from '@angular/core';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {Settings} from './classes/settings';
import {DiskImage} from './emulator/classes/disk';
import {AudioService} from './services/audio.service';
import {Command, CommandType} from './classes/command';
import {TI994A} from './emulator/classes/ti994a';
import {Log} from './classes/log';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    title = "JS99'er";

    diskImages: { [key: string]: DiskImage };
    settings: Settings;

    private ti994A: TI994A;
    private log: Log = Log.getLog();

    constructor(
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService
    ) {}

    ngOnInit() {
        this.diskImages = {
            FLOPPY1: new DiskImage('Floppy 1', null),
            FLOPPY2: new DiskImage('Floppy 2', null),
            FLOPPY3: new DiskImage('Floppy 3', null)
        };
        this.settings = new Settings(true);
        this.commandDispatcherService.subscribe(this.onCommand);
    }

    onConsoleReady(ti994A) {
        this.ti994A = ti994A;
        this.audioService.init(this.settings.isSoundEnabled(), ti994A.getPSG(), ti994A.getSpeech(), ti994A.getTape());
    }

    onCommand(command: Command) {
        console.log(command);
        switch (command.type) {
        }
    }
}
