import {Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {CommandDispatcherService} from './services/command-dispatcher.service';
import {Setting, Settings} from './classes/settings';
import {DiskImage} from './emulator/classes/diskimage';
import {AudioService} from './services/audio.service';
import {Command, CommandType} from './classes/command';
import {TI994A} from './emulator/classes/ti994a';
import {Log} from './classes/log';
import {SettingsService} from './services/settings.service';
import {EventDispatcherService} from './services/event-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {ConsoleEvent, ConsoleEventType} from './classes/consoleevent';
import {DiskService} from './services/disk.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

    title = "JS99'er";

    diskImages: DiskImage[];
    settings: Settings;
    ti994A: TI994A;

    private commandSubscription: Subscription;
    private eventSubscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private element: ElementRef,
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private settingsService: SettingsService,
        private diskService: DiskService
    ) {}

    ngOnInit() {
        this.diskImages = this.diskService.createDefaultDiskImages();
        this.settings = this.settingsService.getSettings();
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    onCommand(command: Command) {
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

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                this.audioService.init(this.settings.isSoundEnabled(), this.ti994A.getPSG(), this.ti994A.getSpeech(), this.ti994A.getTape());
                break;
            case ConsoleEventType.DISK_DRIVE_CHANGED:
                const diskImage: DiskImage = event.data.diskImage;
                if (this.diskImages.indexOf(diskImage) === -1) {
                    this.diskImages.push(diskImage);
                }
                break;
        }
    }

    onKeyboardSelected() {
        window.dispatchEvent(new Event('resize'));
    }

    ngOnDestroy() {
        this.commandSubscription.unsubscribe();
        this.eventSubscription.unsubscribe();
    }
}
