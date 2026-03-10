import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostBookingsPage } from './host-bookings.page';

describe('HostBookingsPage', () => {
  let component: HostBookingsPage;
  let fixture: ComponentFixture<HostBookingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostBookingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
