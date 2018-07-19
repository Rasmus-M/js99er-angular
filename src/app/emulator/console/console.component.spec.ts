import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ConsoleComponent} from './console.component';
import {CommandDispatcherService} from '../../services/command-dispatcher.service';

describe('ConsoleComponent', () => {
  let component: ConsoleComponent;
  let fixture: ComponentFixture<ConsoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConsoleComponent ],
        providers: [CommandDispatcherService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
