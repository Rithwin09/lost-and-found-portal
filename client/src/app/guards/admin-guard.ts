import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getUserRole();

  // --- THIS IS THE NEW, SMARTER RULE ---
  // It now correctly allows both 'admin' and 'superadmin' to pass.
  if (role === 'admin' || role === 'superadmin') {
    return true; // Access granted
  }
  // ------------------------------------

  // If the user is not an admin, send them back to the homepage.
  router.navigate(['/']);
  return false; // Access denied
};