import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Command, CommandType} from '../classes/command';
import {Subscription} from 'rxjs/Subscription';
import {Software} from '../classes/software';
import {Setting} from '../classes/settings';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskDrive} from '../emulator/classes/diskdrive';


@Injectable()
export class CommandDispatcherService {

    private commandSubject: Subject<Command> = new Subject<Command>();

    private commandObservable: Observable<Command> = this.commandSubject.asObservable();

    constructor() {
    }

    subscribe(handler: (command: Command) => void): Subscription {
        return this.commandObservable.subscribe(handler);
    }

    start() {
        this.commandSubject.next(new Command(CommandType.START, null));
    }

    fast() {
        this.commandSubject.next(new Command(CommandType.FAST, null));
    }

    frame() {
        this.commandSubject.next(new Command(CommandType.FRAME, null));
    }

    step() {
        this.commandSubject.next(new Command(CommandType.STEP, null));
    }

    stop() {
        this.commandSubject.next(new Command(CommandType.STOP, null));
    }

    reset() {
        this.commandSubject.next(new Command(CommandType.RESET, null));
    }

    loadModule(file: File) {
        this.commandSubject.next(new Command(CommandType.LOAD_MODULE, file));
    }

    loadDisk(driveIndex: number, files: FileList) {
        this.commandSubject.next(new Command(CommandType.LOAD_DISK, {driveIndex: driveIndex, files: files}));
    }

    loadSoftware(software: Software) {
        this.commandSubject.next(new Command(CommandType.LOAD_SOFTWARE, software));
    }

    changeSetting(setting: Setting, value: boolean) {
        this.commandSubject.next(new Command(CommandType.CHANGE_SETTING, {setting: setting, value: value}));
    }

    pressKey(keyCode: number) {
        this.commandSubject.next(new Command(CommandType.PRESS_KEY, keyCode));
    }

    screenshot() {
        this.commandSubject.next(new Command(CommandType.TAKE_SCREENSHOT, null));
    }

    setBreakpoint(addr: number) {
        this.commandSubject.next(new Command(CommandType.SET_BREAKPOINT, addr));
    }

    addDisk() {
        this.commandSubject.next(new Command(CommandType.ADD_DISK, null));
    }

    insertDisk(driveIndex: number, diskImage: DiskImage) {
        this.commandSubject.next(new Command(CommandType.INSERT_DISK, {driveIndex: driveIndex, diskImage: diskImage}));
    }

    removeDisk(driveIndex: number) {
        this.commandSubject.next(new Command(CommandType.REMOVE_DISK, driveIndex));
    }

    deleteDisk(diskImage: DiskImage) {
        this.commandSubject.next(new Command(CommandType.DELETE_DISK, diskImage));
    }

    saveDisk(diskImage: DiskImage) {
        this.commandSubject.next(new Command(CommandType.SAVE_DISK, diskImage));
    }

    openTape(file: ArrayBuffer) {
        this.commandSubject.next(new Command(CommandType.OPEN_TAPE, file));
    }

    recordTape() {
        this.commandSubject.next(new Command(CommandType.RECORD_TAPE, null));
    }

    playTape() {
        this.commandSubject.next(new Command(CommandType.PLAY_TAPE, null));
    }

    rewindTape() {
        this.commandSubject.next(new Command(CommandType.REWIND_TAPE, null));
    }

    stopTape() {
        this.commandSubject.next(new Command(CommandType.STOP_TAPE, null));
    }
}
