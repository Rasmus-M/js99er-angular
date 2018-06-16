import { TestBed, inject } from '@angular/core/testing';

import { CommandService } from './command.service';

describe('CommandService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandService]
    });
  });

  it('should be created', inject([CommandService], (service: CommandService) => {
    expect(service).toBeTruthy();
  }));
});
