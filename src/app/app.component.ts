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
import {MatTabChangeEvent} from '@angular/material';
import {DatabaseService} from './services/database.service';
import {DiskDrive} from './emulator/classes/diskdrive';
import {ActivatedRoute, NavigationStart, ParamMap, Router, RouterEvent, RouterState, UrlSegment} from '@angular/router';
import {ModuleService} from './services/module.service';
import {Software} from './classes/software';
import {MoreSoftwareService} from './services/more-software.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

    diskImages: DiskImage[];
    ti994A: TI994A;
    tabIndex: number;

    private title = "JS99'er";
    private version = "7.0.0";

    private routerSubscription: Subscription;
    private commandSubscription: Subscription;
    private eventSubscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private element: ElementRef,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private settingsService: SettingsService,
        private diskService: DiskService,
        private databaseService: DatabaseService,
        private moduleService: ModuleService,
        private moreSoftwareService: MoreSoftwareService
    ) {}

    ngOnInit() {
        this.log.info("Welcome to " + this.title + " version " + this.version);
        this.log.info("--------------------------------");
        this.diskImages = this.diskService.createDefaultDiskImages();
        this.routerSubscription = this.router.events.subscribe(this.onRouterEvent.bind(this));
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
    }

    onRouterEvent(event: RouterEvent) {
        if (event instanceof NavigationStart) {
            const cartName = decodeURI(event.url.split("/").pop());
            if (cartName) {
                this.log.info("Load cart: " + cartName);
                this.moreSoftwareService.getByName(cartName).subscribe(
                    (cart: Software) => {
                        this.moduleService.loadRPKModuleFromURL("assets/" + cart.url).subscribe(
                            (software: Software) => {
                                this.commandDispatcherService.loadSoftware(software, true);
                            },
                            (error) => {
                                this.log.error(error + " " + cart.url);
                            }
                        );
                    },
                    (error) => {
                        this.log.error(error);
                    }
                );
            }
        }
    }

    onCommand(command: Command) {
        this.log.info(command.type);
        switch (command.type) {
            case CommandType.CHANGE_SETTING:
                const setting: Setting = command.data.setting;
                if (setting === Setting.SOUND) {
                    const value: boolean = command.data.value;
                    this.audioService.setSoundEnabled(value);
                }
                break;
            case CommandType.SAVE_STATE:
                this.saveState();
                break;
            case CommandType.RESTORE_STATE:
                this.restoreState();
                break;
        }
    }

    onEvent(event: ConsoleEvent) {
        this.log.info(event.type);
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                this.audioService.init(this.settingsService.isSoundEnabled(), this.ti994A.getPSG(), this.ti994A.getSpeech(), this.ti994A.getTape());
                break;
        }
    }

    onTabSelected(event: MatTabChangeEvent) {
        this.tabIndex = event.index;
    }

    saveState() {
        const that = this;
        const database = this.databaseService;
        if (database.isSupported()) {
            database.deleteAllDiskImages(function (success) {
                if (success) {
                    that.saveDiskImages(that.diskImages, 0, function (success1) {
                        if (success1) {
                            that.log.info('Disk images saved OK.');
                            const diskDrives = that.ti994A.getDiskDrives();
                            that.saveDiskDrives(diskDrives, 0, function (success2) {
                                if (success2) {
                                    that.log.info('Disk drives saved OK.');
                                    const state = that.ti994A.getState();
                                    database.putMachineState('ti994a', state, function (success3) {
                                        if (success3) {
                                            that.log.info('Machine state saved OK.');
                                        } else {
                                            that.log.info('Machine state could not be saved.');
                                        }
                                    });
                                } else {
                                    that.log.info('Disk drives could not be saved.');
                                }
                            });
                        } else {
                            that.log.info('Disk images could not be saved.');
                        }
                    });
                } else {
                    that.log.info('Could not delete old disk images.');
                }
            });
        }
    }

    restoreState() {
        const that = this;
        const database = this.databaseService;
        const wasRunning = this.ti994A.isRunning();
        if (wasRunning) {
            this.commandDispatcherService.stop();
        }
        database.getDiskImages(function (diskImages) {
            if (diskImages) {
                that.diskImages = diskImages;
                that.log.info("Disk images restored OK.");
                const diskDrives = that.ti994A.getDiskDrives();
                that.loadDiskDrives(diskDrives, diskImages, 0, function (success) {
                    if (success) {
                        that.log.info("Disk drives restored OK.");
                        database.getMachineState("ti994a", function (state) {
                            if (state) {

                                const f18AEnabled = typeof(state.vdp.gpu) === "object";
                                if (f18AEnabled && !that.settingsService.isF18AEnabled()) {
                                    that.log.error("Please enable F18A before restoring the state");
                                    return;
                                } else if (!f18AEnabled && that.settingsService.isF18AEnabled()) {
                                    that.log.error("Please disable F18A before restoring the state");
                                    return;
                                }

                                that.ti994A.restoreState(state);
                                that.log.info("Console state restored");

                                const settings: Settings = new Settings();
                                settings.setSoundEnabled(that.settingsService.isSoundEnabled());
                                settings.setSpeechEnabled(state.speech.enabled);
                                settings.set32KRAMEnabled(state.memory.enable32KRAM);
                                settings.setF18AEnabled(that.settingsService.isF18AEnabled());
                                settings.setFlickerEnabled(state.vdp.enableFlicker);
                                settings.setPCKeyboardEnabled(state.keyboard.pcKeyboardEnabled);
                                settings.setMapArrowKeysEnabled(state.keyboard.mapArrowKeysToFctnSDEX);
                                settings.setGoogleDriveEnabled(that.settingsService.isGoogleDriveEnabled());
                                settings.setAMSEnabled(state.memory.enableAMS);
                                settings.setGRAMEnabled(state.memory.enableGRAM);
                                settings.setPixelatedEnabled(that.settingsService.isPixelatedEnabled());
                                that.settingsService.restoreSettings(settings);

                                if (state.tape.recordPressed) {
                                    that.eventDispatcherService.tapeRecording();
                                } else if (state.tape.playPressed) {
                                    that.eventDispatcherService.tapePlaying();
                                } else {
                                    const tape = that.ti994A.getTape();
                                    that.eventDispatcherService.tapeStopped(tape.isPlayEnabled(), tape.isRewindEnabled());
                                }

                                that.commandDispatcherService.setBreakpointAddress(state.cpu.breakpoint);

                                if (wasRunning) {
                                    that.commandDispatcherService.start();
                                } else {
                                    that.ti994A.getPSG().mute();
                                }

                                that.eventDispatcherService.stateRestored();

                                that.log.info("Machine state restored OK.");
                            } else {
                                that.log.error("Machine state could not be restored.");
                            }
                        });
                    } else {
                        that.log.error("Disk drives could not be restored.");
                    }
                    // updateDiskImageList();
                });
            } else {
                that.log.error("Disk images could not be restored.");
            }
        });
    }

    saveDiskImages(diskImages: DiskImage[], index: number, callback: (boolean) => void) {
        const that = this;
        if (index === diskImages.length) {
            callback(true);
            return;
        }
        const diskImage = diskImages[index];
        this.databaseService.putDiskImage(diskImage, function (ok) {
            if (ok) {
                that.saveDiskImages(diskImages, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }

    saveDiskDrives(diskDrives: DiskDrive[], index: number, callback) {
        const that = this;
        if (index === diskDrives.length) {
            callback(true);
            return;
        }
        const diskDrive = diskDrives[index];
        this.databaseService.putDiskDrive(diskDrive, function (ok) {
            if (ok) {
                that.saveDiskDrives(diskDrives, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }

    loadDiskDrives(diskDrives: DiskDrive[], diskImages: DiskImage[], index: number, callback: (boolean) => void) {
        const that = this;
        if (index === diskDrives.length) {
            callback(true);
            return;
        }
        const diskDriveName = diskDrives[index].getName();
        this.databaseService.getDiskDrive(diskDriveName, function (diskDriveState) {
            if (diskDriveState) {
                if (diskDriveState.diskImage) {
                    let diskImage: DiskImage = null;
                    for (let i = 0; i < diskImages.length && !diskImage; i++) {
                        if (diskImages[i].getName() === diskDriveState.diskImage) {
                            diskImage = diskImages[i];
                        }
                    }
                    diskDrives[index].setDiskImage(diskImage);
                    that.log.info("Disk image " + diskDrives[index].getDiskImage().getName() + " restored to " + diskDrives[index].getName() + ".");
                } else {
                    diskDrives[index].setDiskImage(null);
                }
                that.loadDiskDrives(diskDrives, diskImages, index + 1, callback);
            } else {
                callback(false);
            }
        });
    }

    ngOnDestroy() {
        this.routerSubscription.unsubscribe();
        this.commandSubscription.unsubscribe();
        this.eventSubscription.unsubscribe();
    }
}
