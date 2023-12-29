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
import * as $ from "jquery";
import {MatTabChangeEvent} from "@angular/material/tabs";
import {Command, CommandType} from "../../classes/command";
import {Setting, Settings} from "../../classes/settings";
import {ConsoleEvent, ConsoleEventType} from "../../classes/consoleevent";
import {Software} from "../../classes/software";
import {Js99erComponent} from "../../js99er.component";
import {map, mergeMap} from "rxjs/operators";
import {ConfigService} from "../../services/config.service";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {

    diskImages: DiskImage[];
    ti994A: TI994A;
    tabIndex: number;

    title = Js99erComponent.TITLE;
    version = Js99erComponent.VERSION;
    date = Js99erComponent.DATE;

    private cartURL: string;
    private cartName = 'extended_basic';
    private started = false;
    private autoRun = false;
    public sidePanelVisible = true;
    public toolbarVisible = true;
    private routerSubscription: Subscription;
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
        this.log.info("Welcome to " + Js99erComponent.TITLE + " version " + Js99erComponent.VERSION);
        this.log.info("--------------------------------");
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
                }
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
                } else if (this.cartName) {
                    this.loadCartridge(this.cartName);
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
        this.moreSoftwareService.getByName(cartName.replace(/_/g, ' ')).subscribe(
            (cart: Software) => {
                this.loadCartridgeFromURL(cart.url);
            },
            (error) => {
                this.log.error(error);
            }
        );
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
                settings.setPCKeyboardEnabled(state.keyboard.pcKeyboardEnabled);
                settings.setMapArrowKeysEnabled(state.keyboard.mapArrowKeysToFctnSDEX);
                settings.setGoogleDriveEnabled(that.settingsService.isGoogleDriveEnabled());
                settings.setSAMSEnabled(state.memory.enableSAMS);
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
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.commandSubscription) {
            this.commandSubscription.unsubscribe();
        }
        if (this.eventSubscription) {
            this.eventSubscription.unsubscribe();
        }
    }
}
