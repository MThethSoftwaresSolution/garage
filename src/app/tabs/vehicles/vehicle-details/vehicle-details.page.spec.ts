import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleDetailsPage } from './vehicle-details.page';

describe('VehicleDetailsPage', () => {
  let component: VehicleDetailsPage;
  let fixture: ComponentFixture<VehicleDetailsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleDetailsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
