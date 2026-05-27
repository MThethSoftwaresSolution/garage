import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const approvalGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const isAdmin = JSON.parse(localStorage.getItem('isAdmin') || 'false');
  const isVetted = JSON.parse(localStorage.getItem('isVetted') || 'false');

  if (state.url.includes('/tabs/profile')) {
    return true;
  }

  if (isAdmin || isVetted) {
    return true;
  }

  router.navigateByUrl('/tabs/profile?completeProfile=true', {
    replaceUrl: true
  });

  return false;
};