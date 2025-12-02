import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {DiskImage} from "../../emulator/classes/disk-image";
import {TI994A} from "../../emulator/classes/ti994a";
import {firstValueFrom, Subscription} from "rxjs";
import {Log} from "../../classes/log";
import {ActivatedRoute, Params, UrlSegment} from "@angular/router";
import {AudioService} from "../../services/audio.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {EventDispatcherService} from "../../services/event-dispatcher.service";
import {SettingsService} from "../../services/settings.service";
import {DiskService} from "../../services/disk.service";
import {DatabaseService} from "../../services/database.service";
import {ModuleService} from "../../services/module.service";
import {MoreSoftwareService} from "../../services/more-software.service";
import $ from "jquery";
import {MatTabChangeEvent} from "@angular/material/tabs";
import {Command, CommandType} from "../../classes/command";
import {Setting, Settings} from "../../classes/settings";
import {ConsoleEvent, ConsoleEventType} from "../../classes/console-event";
import {Software} from "../../classes/software";
import {Js99erComponent} from "../../js99er.component";
import {map, mergeMap} from "rxjs/operators";
import {ConfigService} from "../../services/config.service";
import {ConsoleComponent} from "../../emulator/console/console.component";
import {Util} from "../../classes/util";
import {Location} from "@angular/common";
import {DialogService} from "../../services/dialog.service";
import {HttpClient} from "@angular/common/http";
import {Breakpoint} from "../../classes/breakpoint";

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.css'],
    standalone: false
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {

    static DEFAULT_CART_NAME = 'software/extended_basic.rpk';

    diskImages: DiskImage[] = [];
    ti994A: TI994A;
    tabIndex: number;

    title = Js99erComponent.TITLE;
    version = Js99erComponent.VERSION;
    date = Js99erComponent.DATE;

    private diskURL: string;
    private cartURL: string;
    private cartName = MainComponent.DEFAULT_CART_NAME;
    private ramDiskDSRURL: string;
    private started = false;
    private autoRun = false;
    public sidePanelVisible = true;
    public toolbarVisible = true;
    private commandSubscription: Subscription;
    private eventSubscription: Subscription;
    private log: Log = Log.getLog();

    constructor(
        private element: ElementRef,
        private route: ActivatedRoute,
        private location: Location,
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private settingsService: SettingsService,
        private diskService: DiskService,
        private databaseService: DatabaseService,
        private moduleService: ModuleService,
        private moreSoftwareService: MoreSoftwareService,
        private configService: ConfigService,
        private dialogService: DialogService,
        private httpClient: HttpClient
    ) {}

    ngOnInit() {
        this.dialogService.init();
        this.configure();
        this.diskImages = this.diskService.createDefaultDiskImages();
        this.commandSubscription = this.commandDispatcherService.subscribe((command) => {
            this.onCommand(command);
        });
        this.eventSubscription = this.eventDispatcherService.subscribe((event) => {
            this.onEvent(event);
        });
        this.route.url.subscribe((urlSegments) => {
            this.onUrlChanged(urlSegments);
        });
        this.route.queryParams.subscribe((params: Params) => {
            this.onQueryParametersChanged(params);
        });
        const logInfo = "Welcome to " + Js99erComponent.TITLE + " version " + Js99erComponent.VERSION + " (" + Js99erComponent.DATE + ")";
        this.log.info(logInfo);
        this.log.info(Util.repeat("-", logInfo.length));
    }

    ngAfterViewInit(): void {
        $(this.element.nativeElement).one("click touchstart", () => {
            this.audioService.resumeSound();
        });
        $(document).one("keydown", () => {
            this.audioService.resumeSound();
        });
    }

    configure() {
        const config = this.configService.config;
        if (config) {
            this.sidePanelVisible = config.sidePanelVisible !== undefined ? config.sidePanelVisible : true;
            this.toolbarVisible = config.toolbarVisible !== undefined ? config.toolbarVisible : true;
            if (config.settings) {
                this.settingsService.setSettings(config.settings);
            }
            if (config.diskURL) {
                this.diskURL = config.diskURL;
            }
            if (config.cartridgeURL) {
                this.cartURL = config.cartridgeURL;
            }
            if (config.ramDiskDSRURL) {
                this.ramDiskDSRURL = config.ramDiskDSRURL;
            }
        }
    }

    onQueryParametersChanged(params: Params) {
        const diskUrl = params['diskUrl'];
        if (diskUrl) {
            this.loadDiskFromUrl(diskUrl);
        }
        const cartUrl = params['cartUrl'];
        if (cartUrl) {
            this.autoRun = true;
            this.loadCartridgeFromURL(cartUrl);
        } else {
            const cartName = params['cart'];
            if (cartName) {
                this.autoRun = true;
                if (this.started) {
                    this.loadCartridge(cartName);
                } else {
                    this.cartName = cartName;
                }
            }
        }
    }

    onUrlChanged(urlSegments: UrlSegment[]) {
        if (!urlSegments.length) {
            return;
        }
        switch (urlSegments[0].path) {
            case 'log':
                this.tabIndex = 0;
                break;
            case 'disk':
                this.tabIndex = 1;
                break;
            case 'tape':
                this.tabIndex = 2;
                break;
            case 'keyboard':
                this.tabIndex = 3;
                break;
            case 'debugger':
                this.tabIndex = 4;
                break;
            case 'graphics':
                this.tabIndex = 5;
                break;
            case 'options':
                this.tabIndex = 6;
                break;
            case 'about':
                this.tabIndex = 7;
                break;
        }
    }

    onTabSelected(event: MatTabChangeEvent) {
        this.tabIndex = event.index;
        switch (event.index) {
            case 0:
                this.location.go("/log");
                break;
            case 1:
                this.location.go("/disk");
                break;
            case 2:
                this.location.go("/tape");
                break;
            case 3:
                this.location.go("/keyboard");
                break;
            case 4:
                this.location.go("/debugger");
                break;
            case 5:
                this.location.go("/graphics");
                break;
            case 6:
                this.location.go("/options");
                break;
            case 7:
                this.location.go("/about");
                break;
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
                } else if (setting === Setting.PSG) {
                    this.ti994A.setPSG();
                    this.audioService.init(this.settingsService.isSoundEnabled(), this.ti994A.getPSG(), this.ti994A.getSpeech(), this.ti994A.getTape());                }
                break;
            case CommandType.SAVE_STATE:
                this.saveState();
                break;
            case CommandType.RESTORE_STATE:
                this.restoreState();
                break;
            case CommandType.TOGGLE_SIDE_PANEL:
                this.sidePanelVisible = command.data;
                break;
        }
    }

    onEvent(event: ConsoleEvent) {
        this.log.info(event.type);
        switch (event.type) {
            case ConsoleEventType.READY:
                this.ti994A = event.data;
                this.audioService.init(this.settingsService.isSoundEnabled(), this.ti994A.getPSG(), this.ti994A.getSpeech(), this.ti994A.getTape());
                this.loadDefaultDisk().then(
                    () => {
                        return this.loadDefaultCartridge();
                    }
                ).then(
                    () => {
                        return this.restoreRAMDisk();
                    }
                ).then(
                    () => {
                        this.commandDispatcherService.start();
                    }
                );
                break;
            case ConsoleEventType.STARTED:
                this.audioService.setSoundEnabled(this.settingsService.isSoundEnabled());
                if (this.autoRun) {
                    window.setTimeout(
                        () => {
                            this.ti994A.getKeyboard().simulateKeyPresses(" 2", null);
                        },
                        2000
                    );
                    this.autoRun = false;
                }
                break;
            case ConsoleEventType.STOPPED:
                this.audioService.setSoundEnabled(false);
                break;
        }
    }

    loadDefaultDisk() {
        return this.diskURL ? this.loadDiskFromUrl(this.diskURL) : Promise.resolve();
    }

    loadDefaultCartridge() {
        if (this.cartURL) {
            return this.loadCartridgeFromURL(this.cartURL);
        } else if (this.cartName !== MainComponent.DEFAULT_CART_NAME) {
            return this.loadCartridge(this.cartName);
        } else  {
            return firstValueFrom(
                this.databaseService.whenReady()
            ).then(
                (supported) => {
                    if (supported) {
                        return this.loadLatestSoftware();
                    } else {
                        return Promise.resolve();
                    }
                }
            );
        }
    }

    loadDiskFromUrl(url: string): Promise<void> {
        return firstValueFrom(
            this.diskService.fetchDiskFileFromURL(url)
        ).then(
            (file) => {
                file.arrayBuffer().then(
                    (value) => {
                        const bytes = new Uint8Array(value);
                        if (Util.isDiskImage(bytes)) {
                            const diskImage = this.diskImages[0];
                            diskImage.loadBinaryImage(bytes);
                            this.eventDispatcherService.diskAdded(diskImage);
                        }
                    }
                );
            }
        ).catch(
            (error) => {
                this.log.error(error);
            }
        );
    }

    loadCartridge(cartName: string): Promise<void> {
        this.log.info("Load cart: " + cartName);
        if (cartName.startsWith('software/')) {
            return this.loadCartridgeFromURL(cartName);
        } else {
            return firstValueFrom(
                this.moreSoftwareService.getByName(cartName.replace(/_/g, ' '))
            ).then(
                (cart: Software) => {
                    this.loadCartridgeFromURL(cart.url);
                }
            ).catch(
                (error) => {
                    this.log.error(error);
                }
            );
        }
    }

    loadCartridgeFromURL(url: string): Promise<void> {
        return firstValueFrom(
            this.moduleService.loadModuleFromURL(url)
        ).then(
            (software: Software) => {
                this.commandDispatcherService.loadSoftware(software);
            }
        ).catch(
            (error) => {
                this.log.error(error);
            }
        );
    }

    loadLatestSoftware(): Promise<void> {
        return firstValueFrom(
            this.databaseService.getSoftware(ConsoleComponent.LATEST_SOFTWARE)
        ).then(
            (software: Software) => {
                return this.commandDispatcherService.loadSoftware(software);
            }
        ).catch(
            (error) => {
                console.log("Failed to load latest software from database");
                if (this.cartName) {
                    return this.loadCartridge(this.cartName);
                } else {
                    return Promise.resolve();
                }
            }
        );
    }

    restoreRAMDisk(): Promise<void> {
        return firstValueFrom(
            this.databaseService.whenReady()
        ).then(
            (supported) => {
                if (supported) {
                    const ramDisk = this.ti994A.getRAMDisk();
                    if (ramDisk) {
                        return this.databaseService.restoreRAMDisk(ramDisk);
                    }
                }
                return Promise.resolve(true);
            }
        ).then(
            (ramdiskRestoredOrNotAvailable) => {
                if (!ramdiskRestoredOrNotAvailable && this.ramDiskDSRURL) {
                    let url = this.ramDiskDSRURL;
                    if (url.startsWith('http')) {
                        url = 'proxy?url=' + url;
                    } else {
                        url = 'assets/' + url;
                    }
                    return this.httpClient.get(url, {responseType: 'arraybuffer'});
                } else {
                    return false;
                }
            }
        ).then(
            (result) => {
                if (result) {
                    result.subscribe((dsr) => {
                        this.ti994A.getRAMDisk()?.setDSR(Util.byteArrayToNumberArray(new Uint8Array(dsr)));
                    });
                }
            }
        );
    }

    saveState() {
        if (this.databaseService.isSupported()) {
            this.databaseService.deleteAllDiskImages().pipe(
                map(() => this.diskService.saveDiskImages(this.diskImages))
            ).pipe(
                map(() => {
                    this.log.info('Disk images saved OK.');
                    const diskDrives = this.ti994A.getDiskDrives();
                    return this.diskService.saveDiskDrives(diskDrives);
                })
            ).pipe(
                mergeMap(() => {
                    this.log.info('Disk drives saved OK.');
                    return this.databaseService.putSettings('settings', this.settingsService.getSettings());
                })
            ).pipe(
                map(() => {
                    this.log.info('Settings saved OK.');
                    const state = this.ti994A.getState();
                    return this.databaseService.putMachineState('ti994a', state);
                })
            ).subscribe({
                next: () => {
                    this.log.info("Machine state saved OK.");
                },
                error: (error) => {
                    this.log.error(error);
                }
            });
        }
    }

    restoreState() {
        const wasRunning = this.ti994A.isRunning();
        if (wasRunning) {
            this.commandDispatcherService.stop();
        }
        this.databaseService.getDiskImages().pipe(
            map((diskImages: DiskImage[]) => {
                this.diskImages = diskImages;
                this.log.info("Disk images restored OK.");
                const diskDrives = this.ti994A.getDiskDrives();
                return this.diskService.restoreDiskDrives(diskDrives, diskImages);
            })
        ).pipe(
            mergeMap(() => {
                this.log.info("Disk drives restored OK.");
                return this.databaseService.getSettings('settings');
            })
        ).pipe(
            mergeMap((settings: Settings) => {
                if (settings) {
                    this.settingsService.restoreSettings(settings);
                }
                return this.databaseService.getMachineState("ti994a");
            })
        ).subscribe(
            {
                next: (state: any) => {
                    this.ti994A.restoreState(state);
                    this.log.info("Console state restored");
                    if (state.tape.recordPressed) {
                        this.eventDispatcherService.tapeRecording();
                    } else if (state.tape.playPressed) {
                        this.eventDispatcherService.tapePlaying();
                    } else {
                        const tape = this.ti994A.getTape();
                        this.eventDispatcherService.tapeStopped(tape.isPlayEnabled(), tape.isRewindEnabled());
                    }
                    const breakpoints: Breakpoint[] = state.cpu.breakpoints;
                    if (breakpoints) {
                        this.eventDispatcherService.breakpointsRestored(breakpoints);
                    }
                    if (wasRunning) {
                        this.commandDispatcherService.start();
                    } else {
                        this.ti994A.getPSG().mute();
                    }
                    this.eventDispatcherService.stateRestored();
                    this.log.info("Machine state restored OK.");
                },
                error: (error) => {
                    this.log.error(error);
                }
            }
        );
    }

    ngOnDestroy() {
        if (this.commandSubscription) {
            this.commandSubscription.unsubscribe();
        }
        if (this.eventSubscription) {
            this.eventSubscription.unsubscribe();
        }
    }
}
