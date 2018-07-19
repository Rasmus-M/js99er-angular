import {inject, TestBed} from '@angular/core/testing';

import {CommandDispatcherService} from './command-dispatcher.service';

describe('CommandDispatcherService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandDispatcherService]
    });
  });

  it('should be created', inject([CommandDispatcherService], (service: CommandDispatcherService) => {
    expect(service).toBeTruthy();
  }));
});
