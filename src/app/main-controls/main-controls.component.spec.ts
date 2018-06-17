import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {MainControlsComponent} from './main-controls.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import {CommandDispatcherService} from '../command-dispatcher.service';

describe('MainControlsComponent', () => {
  let component: MainControlsComponent;
  let fixture: ComponentFixture<MainControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      schemas: [ NO_ERRORS_SCHEMA ],
      declarations: [ MainControlsComponent ],
        providers: [CommandDispatcherService]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
