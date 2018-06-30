import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TapeComponent } from './tape.component';

describe('TapeComponent', () => {
  let component: TapeComponent;
  let fixture: ComponentFixture<TapeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TapeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
