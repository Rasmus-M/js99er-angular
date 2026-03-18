import {Component, OnInit, signal, inject} from '@angular/core';
import {SettingsService} from '../../services/settings.service';
import {ConsoleEvent, ConsoleEventType} from '../../classes/console-event';
import {CommandDispatcherService} from "../../services/command-dispatcher.service";
import {RAMType, PSGType, TIPIType, VDPType, DiskType, RAMDiskType} from "../../classes/settings";
import {EventDispatcherService} from "../../services/event-dispatcher.service";

@Component({
    selector: 'options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.css'],
    standalone: false
})
export class OptionsComponent implements OnInit {

    private settingsService = inject(SettingsService);
    private commandDispatcherService = inject(CommandDispatcherService);
    private eventDispatcherService = inject(EventDispatcherService);

    vdp = signal(this.settingsService.getVDP());
    ram = signal(this.settingsService.getRAM());
    tipi = signal(this.settingsService.getTIPI());
    psg = signal(this.settingsService.getPSG());
    enableSound = signal(this.settingsService.isSoundEnabled());
    enableSpeech = signal(this.settingsService.isSpeechEnabled());
    enablePCKeyboard = signal(this.settingsService.isPCKeyboardEnabled());
    enableMapArrowKeys = signal(this.settingsService.isMapArrowKeysToFctnSDEXEnabled());
    enableGoogleDrive = signal(this.settingsService.isGoogleDriveEnabled());
    enableGRAM = signal(this.settingsService.isGRAMEnabled());
    enablePixelated = signal(this.settingsService.isPixelatedEnabled());
    enablePauseOnFocusLost = signal(this.settingsService.isPauseOnFocusLostEnabled());
    tipiWebsocketURI = signal(this.settingsService.getTIPIWebsocketURI() || '');
    enableDebugReset = signal(this.settingsService.isDebugResetEnabled());
    enableH264Codec = signal(this.settingsService.isH264CodecEnabled());
    disk = signal<DiskType>(this.settingsService.getDisk());
    enablePCode = signal(this.settingsService.isPCodeEnabled());
    ramDisk = signal(this.settingsService.getRAMDisk());

    ngOnInit() {
        this.eventDispatcherService.subscribe((event) => {
            this.onEvent(event);
        });
    }

    readSettings() {
        this.vdp.set(this.settingsService.getVDP());
        this.ram.set(this.settingsService.getRAM());
        this.tipi.set(this.settingsService.getTIPI());
        this.psg.set(this.settingsService.getPSG());
        this.enableSound.set(this.settingsService.isSoundEnabled());
        this.enableSpeech.set(this.settingsService.isSpeechEnabled());
        this.enablePCKeyboard.set(this.settingsService.isPCKeyboardEnabled());
        this.enableMapArrowKeys.set(this.settingsService.isMapArrowKeysToFctnSDEXEnabled());
        this.enableGoogleDrive.set(this.settingsService.isGoogleDriveEnabled());
        this.enableGRAM.set(this.settingsService.isGRAMEnabled());
        this.enablePixelated.set(this.settingsService.isPixelatedEnabled());
        this.enablePauseOnFocusLost.set(this.settingsService.isPauseOnFocusLostEnabled());
        this.tipiWebsocketURI.set(this.settingsService.getTIPIWebsocketURI() || '');
        this.enableDebugReset.set(this.settingsService.isDebugResetEnabled());
        this.enableH264Codec.set(this.settingsService.isH264CodecEnabled());
        this.disk.set(this.settingsService.getDisk());
        this.enablePCode.set(this.settingsService.isPCodeEnabled());
        this.ramDisk.set(this.settingsService.getRAMDisk());
    }

    onEvent(event: ConsoleEvent) {
        switch (event.type) {
            case ConsoleEventType.SETTINGS_RESTORED:
                this.readSettings();
                break;
        }
    }

    onEnableSoundChanged(value: boolean) {
        this.settingsService.setSoundEnabled(value);
    }

    onPSGChanged(value: PSGType) {
        this.settingsService.setPSG(value);
    }

    onEnableSpeechChanged(value: boolean) {
        this.settingsService.setSpeechEnabled(value);
    }

    onEnablePCKeyboardChanged(value: boolean) {
        this.settingsService.setPCKeyboardEnabled(value);
    }

    onEnableMapArrowKeysChanged(value: boolean) {
        this.settingsService.setMapArrowKeysEnabled(value);
    }

    onEnableGoogleDriveChanged(value: boolean) {
        this.settingsService.setGoogleDriveEnabled(value);
    }

    onEnableGRAMChanged(value: boolean) {
        this.settingsService.setGRAMEnabled(value);
    }

    onEnablePixelatedChanged(value: boolean) {
        this.settingsService.setPixelatedEnabled(value);
    }

    onEnablePauseOnFocusLostChanged(value: boolean) {
        this.settingsService.setPauseOnFocusLostEnabled(value);
    }

    onTIPIWebsocketURIChanged(value: string) {
        this.settingsService.setTIPIWebsocketURI(value);
    }

    onEnableDebugResetChanged(value: boolean) {
        this.settingsService.setDebugResetEnabled(value);
    }

    onEnableH264CodecChanged(value: boolean) {
        this.settingsService.setH264CodecEnabled(value);
    }

    onTextFocus() {
        this.commandDispatcherService.stopKeyboard();
    }

    onTextBlur() {
        this.commandDispatcherService.startKeyboard();
    }

    onVDPChanged(value: VDPType) {
        this.settingsService.setVDP(value);
    }

    onRAMExpansionChanged(value: RAMType) {
        this.settingsService.setRAM(value);
    }

    onTIPIEmulationChanged(value: TIPIType) {
        this.settingsService.setTIPI(value);
    }

    onDiskChanged(value: DiskType) {
        this.settingsService.setDisk(value);
    }

    onEnablePCodeChanged(value: boolean) {
        this.settingsService.setPCodeEnabled(value);
    }

    onRAMDiskChanged(value: RAMDiskType) {
        this.settingsService.setRAMDisk(value);
    }
}
