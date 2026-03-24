import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExchangePage } from './exchange.page';

describe('ExchangePage', () => {
  let component: ExchangePage;
  let fixture: ComponentFixture<ExchangePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ExchangePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
