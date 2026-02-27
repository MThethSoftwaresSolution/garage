import { AbstractControl, ValidationErrors } from '@angular/forms';

export function saIdValidator(control: AbstractControl): ValidationErrors | null {
  const id = control.value;
  if (!id || id.length !== 13) return { invalidId: true };

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = parseInt(id[i], 10);
    if (i % 2 === 0) sum += digit;
    else {
      digit *= 2;
      sum += digit > 9 ? digit - 9 : digit;
    }
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(id[12], 10)
    ? null
    : { invalidId: true };
}