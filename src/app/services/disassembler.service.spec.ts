import {inject, TestBed} from '@angular/core/testing';

import {DisassemblerService} from './disassembler.service';

describe('DisassemblerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DisassemblerService]
    });
  });

  it('should be created', inject([DisassemblerService], (service: DisassemblerService) => {
    expect(service).toBeTruthy();
  }));
});
