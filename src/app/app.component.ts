import {Component, ElementRef, OnInit} from '@angular/core';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {Setting, Settings} from './classes/settings';
import {DiskImage} from './emulator/classes/disk';
import {AudioService} from './services/audio.service';
import {Command, CommandType} from './classes/command';
import {TI994A} from './emulator/classes/ti994a';
import {Log} from './classes/log';
import {SettingsService} from './services/settings.service';

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
        private element: ElementRef,
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService,
        private settingsService: SettingsService
    ) {}

    ngOnInit() {
        this.diskImages = {
            FLOPPY1: new DiskImage('Floppy 1', null),
            FLOPPY2: new DiskImage('Floppy 2', null),
            FLOPPY3: new DiskImage('Floppy 3', null)
        };
        this.settings = this.settingsService.getSettings();
        this.commandDispatcherService.subscribe(this.onCommand.bind(this));
    }

    onConsoleReady(ti994A) {
        this.ti994A = ti994A;
        this.audioService.init(this.settings.isSoundEnabled(), ti994A.getPSG(), ti994A.getSpeech(), ti994A.getTape());
    }

    onCommand(command: Command) {
        console.log(command);
        switch (command.type) {
            case CommandType.CHANGE_SETTING:
                const setting: Setting = command.data.setting;
                if (setting === Setting.SOUND) {
                    const value: boolean = command.data.value;
                    this.audioService.setSoundEnabled(value);
                }
                break;
        }
    }

    onKeyboardSelected() {
        window.dispatchEvent(new Event('resize'));
    }
}
