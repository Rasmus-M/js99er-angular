import { TestBed, inject } from '@angular/core/testing';

import { ConsoleFactoryService } from './console-factory.service';
import {SettingsService} from "../../services/settings.service";
import {CommandDispatcherService} from "../../services/command-dispatcher.service";

describe('ConsoleFactoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConsoleFactoryService, SettingsService, CommandDispatcherService]
    });
  });

  it('should be created', inject([ConsoleFactoryService], (service: ConsoleFactoryService) => {
    expect(service).toBeTruthy();
  }));
});
