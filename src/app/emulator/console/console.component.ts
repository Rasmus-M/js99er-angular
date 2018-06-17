import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {TI994A} from '../classes/ti994a';
import {DiskImage} from '../classes/disk';
import {Settings} from '../../classes/settings';
import {Sound} from '../../classes/sound';
import {CommandDispatcherService} from '../../command-dispatcher.service';
import {Subscription} from 'rxjs/Subscription';
import {Command, CommandType} from '../../classes/command';
import {SoftwareService} from '../../software.service';
import {Log} from '../../classes/log';

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
  private commandDispatcherService: CommandDispatcherService;
  private subscription: Subscription;
  private softwareService: SoftwareService;
  private log: Log = Log.getLog();

  constructor(private element: ElementRef, commandDispatcherService: CommandDispatcherService, softwareService: SoftwareService) {
      this.commandDispatcherService = commandDispatcherService;
      this.softwareService = softwareService;
  }

  ngOnInit() {
      this.subscription = this.commandDispatcherService.subscribe(this.onCommand.bind(this));
  }

  ngAfterViewInit() {
      this.canvas = this.element.nativeElement.querySelector('canvas');
      this.diskImages = {
          FLOPPY1: new DiskImage("Floppy 1", null),
          FLOPPY2: new DiskImage("Floppy 2", null),
          FLOPPY3: new DiskImage("Floppy 3", null)
      };
      this.settings = new Settings(true);
      this.settings.setF18AEnabled(false);
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
          case CommandType.OPEN_MODULE:
              this.softwareService.loadModuleFromBinFile(
                  command.data,
                  (software) => {
                      this.ti994A.loadSoftware(software);
                  } ,
                  (error) => {
                      this.log.error(error);
                  }
              );
      }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
