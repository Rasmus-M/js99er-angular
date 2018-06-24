import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Command, CommandType} from '../classes/command';
import {Subscription} from 'rxjs/Subscription';
import {Software} from '../classes/software';
import {Setting} from '../classes/settings';



@Injectable()
export class CommandDispatcherService {

  private commandSubject: Subject<Command> = new Subject<Command>();

  private commandObservable: Observable<Command> = this.commandSubject.asObservable();

  constructor() { }

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

  pause() {
      this.commandSubject.next(new Command(CommandType.STOP, null));
  }

  reset() {
      this.commandSubject.next(new Command(CommandType.RESET, null));
  }

  openModule(file: File) {
      this.commandSubject.next(new Command(CommandType.OPEN_MODULE, file));
  }

  openDisk(files: FileList, driveIndex: number) {
      this.commandSubject.next(new Command(CommandType.OPEN_DISK, {files: files, driveIndex: driveIndex}));
  }

  openSoftware(software: Software) {
      this.commandSubject.next(new Command(CommandType.OPEN_SOFTWARE, software));
  }

  changeSetting(setting: Setting, value: boolean) {
      this.commandSubject.next(new Command(CommandType.CHANGE_SETTING, {setting: setting, value: value}));
  }
}
