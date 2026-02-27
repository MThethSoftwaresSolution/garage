import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationsLandingPage } from './verifications-landing.page';

describe('VerificationsLandingPage', () => {
  let component: VerificationsLandingPage;
  let fixture: ComponentFixture<VerificationsLandingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationsLandingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
