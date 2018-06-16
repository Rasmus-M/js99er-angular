import { Injectable } from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Command, CommandType} from './classes/command';



@Injectable()
export class CommandService {

  private commandSource: Subject<Command> = new Subject<Command>();

  private commandObservable: Observable<Command> = this.commandSource.asObservable();

  constructor() { }

  getCommandObservable() {
      return this.commandObservable;
  }

  start() {
      this.commandSource.next(new Command(CommandType.START, null));
  }

  fast() {
      this.commandSource.next(new Command(CommandType.FAST, null));
  }

  frame() {
      this.commandSource.next(new Command(CommandType.FRAME, null));
  }

  step() {
      this.commandSource.next(new Command(CommandType.STEP, null));
  }

  pause() {
      this.commandSource.next(new Command(CommandType.STOP, null));
  }

  reset() {
      this.commandSource.next(new Command(CommandType.RESET, null));
  }

  openModule(file: File) {
      this.commandSource.next(new Command(CommandType.OPEN_MODULE, file));
  }

  openDisk(files: FileList) {
      this.commandSource.next(new Command(CommandType.OPEN_DISK, files));
  }
}
