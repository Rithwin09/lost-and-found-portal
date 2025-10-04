import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the user is logged in using our service
  if (authService.isLoggedIn()) {
    return true; // If they are, let them access the page
  } else {
    // If they are not, redirect them to the login page
    router.navigate(['/login']);
    return false; // And block access to the requested page
  }
};