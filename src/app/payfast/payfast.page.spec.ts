import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayfastPage } from './payfast.page';

describe('PayfastPage', () => {
  let component: PayfastPage;
  let fixture: ComponentFixture<PayfastPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PayfastPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
