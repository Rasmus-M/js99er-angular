import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {TI994A} from '../classes/ti994a';
import {DiskImage} from '../classes/disk';
import {Settings} from '../../classes/settings';
import {Sound} from '../../classes/sound';
import {CommandService} from '../../command.service';
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../../classes/command';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit, AfterViewInit, OnDestroy {

  private canvas: HTMLCanvasElement;
  private diskImages: {[key: string]: DiskImage};
  private settings: Settings;
  private ti994A: TI994A;
  private sound: Sound;
  private commandService: CommandService;
  private subscription: Subscription;

  constructor(private element: ElementRef, commandService: CommandService) {
      this.commandService = commandService;
  }

  ngOnInit() {
      this.subscription = this.commandService.getCommandObservable().subscribe(this.onCommand.bind(this));
  }

  ngAfterViewInit() {
      this.canvas = this.element.nativeElement.querySelector('canvas');
      this.diskImages = {
          FLOPPY1: new DiskImage("Floppy 1", null),
          FLOPPY2: new DiskImage("Floppy 2", null),
          FLOPPY3: new DiskImage("Floppy 3", null)
      };
      this.settings = new Settings(true);
      this.settings.setF18AEnabled(true);
      this.ti994A = new TI994A(document, this.canvas, this.diskImages, this.settings, null);
      this.sound = new Sound(true, this.ti994A.getPSG(), this.ti994A.getSpeech(), this.ti994A.getTape());
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
              break;
      }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
