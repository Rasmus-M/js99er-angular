import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Observable} from 'rxjs';
import {Command, CommandType} from '../classes/command';
import {Subscription} from 'rxjs';
import {Software} from '../classes/software';
import {Setting} from '../classes/settings';
import {DiskImage} from '../emulator/classes/diskimage';
import {DiskFile} from '../emulator/classes/diskfile';


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

    stepOver() {
        this.commandSubject.next(new Command(CommandType.STEP_OVER, null));
    }

    stop() {
        this.commandSubject.next(new Command(CommandType.STOP, null));
    }

    reset() {
        this.commandSubject.next(new Command(CommandType.RESET, null));
    }

    loadModule(files: FileList) {
        this.commandSubject.next(new Command(CommandType.LOAD_MODULE, files));
    }

    loadDisk(driveIndex: number, files: FileList) {
        this.commandSubject.next(new Command(CommandType.LOAD_DISK, {driveIndex: driveIndex, files: files}));
    }

    loadSoftware(software: Software) {
        this.commandSubject.next(new Command(CommandType.LOAD_SOFTWARE, {software: software}));
    }

    unloadSoftware() {
        this.commandSubject.next(new Command(CommandType.UNLOAD_SOFTWARE, null));
    }

    changeSetting(setting: Setting, value: boolean | string | number) {
        this.commandSubject.next(new Command(CommandType.CHANGE_SETTING, {setting: setting, value: value}));
    }

    pressKey(keyCode: number) {
        this.commandSubject.next(new Command(CommandType.PRESS_KEY, keyCode));
    }

    screenshot() {
        this.commandSubject.next(new Command(CommandType.TAKE_SCREENSHOT, null));
    }

    setBreakpoint(addr: number | null) {
        this.commandSubject.next(new Command(CommandType.SET_BREAKPOINT, addr));
    }

    setBreakpointAddress(addr: number) {
        this.commandSubject.next(new Command(CommandType.SET_BREAKPOINT_ADDRESS, addr));
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

    deleteDiskFiles(diskImage: DiskImage, diskFiles: DiskFile[]) {
        this.commandSubject.next(new Command(CommandType.DELETE_DISK_FILES, {diskImage: diskImage, diskFiles: diskFiles}));
    }

    saveDisk(diskImage: DiskImage) {
        this.commandSubject.next(new Command(CommandType.SAVE_DISK, diskImage));
    }

    saveDiskFiles(diskImage: DiskImage, diskFiles: DiskFile[]) {
        this.commandSubject.next(new Command(CommandType.SAVE_DISK_FILES, {diskImage: diskImage, diskFiles: diskFiles}));
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

    saveState() {
        this.commandSubject.next(new Command(CommandType.SAVE_STATE, null));
    }

    restoreState() {
        this.commandSubject.next(new Command(CommandType.RESTORE_STATE, null));
    }

    stopKeyboard() {
        this.commandSubject.next(new Command(CommandType.STOP_KEYBOARD, null));
    }

    startKeyboard() {
        this.commandSubject.next(new Command(CommandType.START_KEYBOARD, null));
    }

    startRecording() {
        this.commandSubject.next(new Command(CommandType.START_RECORDING, null));
    }

    stopRecording() {
        this.commandSubject.next(new Command(CommandType.STOP_RECORDING, null));
    }

    toggleSidePanel(visible: boolean) {
        this.commandSubject.next(new Command(CommandType.TOGGLE_SIDE_PANEL, visible));
    }

    requestPointerLock() {
        this.commandSubject.next(new Command(CommandType.REQUEST_POINTER_LOCK, null));
    }
}
