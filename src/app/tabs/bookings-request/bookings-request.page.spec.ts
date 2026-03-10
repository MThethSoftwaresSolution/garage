import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingsRequestPage } from './bookings-request.page';

describe('BookingsRequestPage', () => {
  let component: BookingsRequestPage;
  let fixture: ComponentFixture<BookingsRequestPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingsRequestPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
