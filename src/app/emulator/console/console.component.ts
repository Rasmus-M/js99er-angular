import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {TI994A} from '../classes/ti994a';
import {DiskImage} from '../classes/disk';
import {Settings} from '../../classes/settings';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../../classes/command';
import {ModuleService} from '../../services/module.service';
import {Log} from '../../classes/log';
import {DiskService} from '../../services/disk.service';
import {SettingsService} from '../../services/settings.service';

@Component({
    selector: 'app-console',
    templateUrl: './console.component.html',
    styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit, AfterViewInit, OnDestroy {

    @Input() diskImages: { [key: string]: DiskImage };
    @Output() consoleReady: EventEmitter<TI994A> = new EventEmitter<TI994A>();
    private ti994A: TI994A;
    private subscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private element: ElementRef,
        private commandDispatcherService: CommandDispatcherService,
        private softwareService: ModuleService,
        private diskService: DiskService,
        private settingsService: SettingsService
    ) {
    }

    ngOnInit() {
        this.subscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
    }

    ngAfterViewInit() {
        const canvas = this.element.nativeElement.querySelector('canvas');
        this.ti994A = new TI994A(document, canvas, this.diskImages, this.settingsService.getSettings(), null);
        this.consoleReady.emit(this.ti994A);
        // this.ti994A.start(false);
    }

    onCommand(command: Command) {
        switch (command.type) {
            case CommandType.START:
                this.ti994A.start(false);
                break;
            case CommandType.FAST:
                this.ti994A.start(true);
                break;
            case CommandType.FRAME:
                this.ti994A.frame();
                break;
            case CommandType.STEP:
                this.ti994A.step();
                break;
            case CommandType.STOP:
                this.ti994A.stop();
                break;
            case CommandType.RESET:
                this.ti994A.reset(true);
                this.ti994A.start(false);
                break;
            case CommandType.OPEN_MODULE:
                this.softwareService.loadModuleFromFile(command.data).subscribe(
                    (software) => {
                        this.ti994A.loadSoftware(software);
                    },
                    (error) => {
                        this.log.error(error);
                    }
                );
                break;
            case CommandType.OPEN_DISK:
                const data = command.data;
                this.diskService.loadDiskFiles(data.files, this.ti994A.getDiskDrives()[data.driveIndex]).subscribe(
                    (diskImage: DiskImage) => {
                        if (diskImage) {
                            this.log.info(diskImage.getName());
                        }
                    },
                    (error) => {
                        this.log.error(error);
                    }
                );
                break;
            case CommandType.OPEN_SOFTWARE:
                this.ti994A.loadSoftware(command.data);
                this.ti994A.getMemory().setPADWord(0x83C0, Math.floor(Math.random() * 0xFFFF));
                break;


        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
