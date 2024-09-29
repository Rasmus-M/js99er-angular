import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {DiskImage} from "../../emulator/classes/diskimage";
import {TI994A} from "../../emulator/classes/ti994a";
import {Subscription} from "rxjs";
import {Log} from "../../classes/log";
import {ActivatedRoute, ParamMap} from "@angular/router";
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
import {ConsoleEvent, ConsoleEventType} from "../../classes/consoleevent";
import {Software} from "../../classes/software";
import {Js99erComponent} from "../../js99er.component";
import {map, mergeMap} from "rxjs/operators";
import {ConfigService} from "../../services/config.service";
import {ConsoleComponent} from "../../emulator/console/console.component";
import {Util} from "../../classes/util";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {

    static DEFAULT_CART_NAME = 'software/extended_basic.rpk';

    diskImages: DiskImage[];
    ti994A: TI994A;
    tabIndex: number;

    title = Js99erComponent.TITLE;
    version = Js99erComponent.VERSION;
    date = Js99erComponent.DATE;

    private cartURL: string;
    private cartName = MainComponent.DEFAULT_CART_NAME;
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
        private audioService: AudioService,
        private commandDispatcherService: CommandDispatcherService,
        private eventDispatcherService: EventDispatcherService,
        private settingsService: SettingsService,
        private diskService: DiskService,
        private databaseService: DatabaseService,
        private moduleService: ModuleService,
        private moreSoftwareService: MoreSoftwareService,
        private configService: ConfigService
    ) {}

    ngOnInit() {
        this.configure();
        this.diskImages = this.diskService.createDefaultDiskImages();
        this.commandSubscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
        this.eventSubscription = this.eventDispatcherService.subscribe(this.onEvent.bind(this));
        this.route.paramMap.subscribe(this.onParametersChanged.bind(this));
        const logInfo = "Welcome to " + Js99erComponent.TITLE + " version " + Js99erComponent.VERSION + " (" + Js99erComponent.DATE + ")";
        this.log.info(logInfo);
        this.log.info(Util.repeat("-", logInfo.length));
    }

    ngAfterViewInit(): void {
        $(this.element.nativeElement).one("click touchstart", () => {
            AudioService.resumeSound();
        });
        $(document).one("keydown", () => {
            AudioService.resumeSound();
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
            if (config.cartridgeURL) {
                this.cartURL = config.cartridgeURL;
            }
        }
    }

    onParametersChanged(params: ParamMap) {
        const cartName = params.get('cart');
        if (cartName) {
            this.autoRun = true;
            if (this.started) {
                this.loadCartridge(cartName);
            } else {
                this.cartName = cartName;
            }
        }
    }

    onTabSelected(event: MatTabChangeEvent) {
        this.tabIndex = event.index;
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
                if (this.cartURL) {
                    this.loadCartridgeFromURL(this.cartURL);
                } else if (this.cartName !== MainComponent.DEFAULT_CART_NAME) {
                    this.loadCartridge(this.cartName);
                } else  {
                    this.databaseService.whenReady().subscribe((
                        supported) => {
                        this.databaseService.getSoftware(ConsoleComponent.LATEST_SOFTWARE).subscribe({
                            next: (software: Software) => {
                                this.commandDispatcherService.loadSoftware(software);
                            },
                            error: () => {
                                console.log("Failed to load latest software from database");
                                if (this.cartName) {
                                    this.loadCartridge(this.cartName);
                                }
                            }
                        });
                    });
                }
                this.commandDispatcherService.start();
                break;
            case ConsoleEventType.STARTED:
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
        }
    }

    loadCartridge(cartName: string) {
        this.log.info("Load cart: " + cartName);
        if (cartName.startsWith('software/')) {
            this.loadCartridgeFromURL(cartName);
        } else {
            this.moreSoftwareService.getByName(cartName.replace(/_/g, ' ')).subscribe(
                (cart: Software) => {
                    this.loadCartridgeFromURL(cart.url);
                },
                (error) => {
                    this.log.error(error);
                }
            );
        }
    }

    loadCartridgeFromURL(url: string) {
        this.moduleService.loadModuleFromURL(url).subscribe(
            (software: Software) => {
                this.commandDispatcherService.loadSoftware(software);
            },
            (error) => {
                this.log.error(error + " " + url);
            }
        );
    }

    saveState() {
        const that = this;
        const database = this.databaseService;
        if (database.isSupported()) {
            database.deleteAllDiskImages().pipe(
                map(() => that.diskService.saveDiskImages(that.diskImages))
            ).pipe(
                map(() => {
                    that.log.info('Disk images saved OK.');
                    const diskDrives = that.ti994A.getDiskDrives();
                    return that.diskService.saveDiskDrives(diskDrives);
                })
            ).pipe(
                mergeMap(() => {
                    that.log.info('Disk drives saved OK.');
                    const state = that.ti994A.getState();
                    return database.putMachineState('ti994a', state);
                })
            ).subscribe(
                () => {
                    this.log.info("Machine state saved OK.");
                },
                that.log.error
            );
        }
    }

    restoreState() {
        const that = this;
        const database = this.databaseService;
        const wasRunning = this.ti994A.isRunning();
        if (wasRunning) {
            this.commandDispatcherService.stop();
        }
        database.getDiskImages().pipe(
            map((diskImages: DiskImage[]) => {
                that.diskImages = diskImages;
                that.log.info("Disk images restored OK.");
                const diskDrives = that.ti994A.getDiskDrives();
                return that.diskService.restoreDiskDrives(diskDrives, diskImages);
            })
        ).pipe(
            mergeMap(() => {
                that.log.info("Disk drives restored OK.");
                return database.getMachineState("ti994a");
            })
        ).subscribe(
            (state: any) => {
                const f18AEnabled = typeof(state.vdp.gpu) === "object";
                const v9938Enabled = typeof(state.vdp.mmc) === "object";
                if (f18AEnabled && that.settingsService.getVDP() !== 'F18A') {
                    that.log.error("Please enable F18A VDP before restoring the state");
                    return;
                } else if (v9938Enabled && that.settingsService.getVDP() !== 'V9938') {
                    that.log.error("Please enable V9938 VDP before restoring the state");
                    return;
                } else if (!f18AEnabled && !v9938Enabled && that.settingsService.getVDP() === 'TMS9918A') {
                    that.log.error("Please enable TMS9918A VDP before restoring the state");
                    return;
                }
                that.ti994A.restoreState(state);
                that.log.info("Console state restored");

                const settings: Settings = new Settings();
                settings.setSoundEnabled(that.settingsService.isSoundEnabled());
                settings.setPSG(that.settingsService.getPSG());
                settings.setSpeechEnabled(state.speech.enabled);
                settings.setRAM(state.memory.ramType);
                settings.setVDP(that.settingsService.getVDP());
                settings.setTIPI(that.settingsService.getTIPI());
                settings.setPCKeyboardEnabled(state.keyboard.pcKeyboardEnabled);
                settings.setMapArrowKeysEnabled(state.keyboard.mapArrowKeysToFctnSDEX);
                settings.setGoogleDriveEnabled(that.settingsService.isGoogleDriveEnabled());
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
            },
            that.log.error
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
