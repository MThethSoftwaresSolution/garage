import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostDashboardPage } from './host-dashboard.page';

describe('HostDashboardPage', () => {
  let component: HostDashboardPage;
  let fixture: ComponentFixture<HostDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
