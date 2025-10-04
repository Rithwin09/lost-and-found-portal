import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { ReportItem } from './pages/report-item/report-item';
import { ItemDetail } from './pages/item-detail/item-detail';
import { Messages } from './pages/messages/messages';
import { ClaimForm } from './pages/claim-form/claim-form'; 
import { VerificationDashboard } from './pages/verification-dashboard/verification-dashboard';
import { authGuard } from './guards/auth-guard'; 
import { MyAccount } from './pages/my-account/my-account';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { adminGuard } from './guards/admin-guard';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminLogin } from './pages/admin-login/admin-login';
import { UserManagement } from './pages/user-management/user-management';
import { AdminItemManagement } from './pages/admin-item-management/admin-item-management';
import { AdminManagement } from './pages/admin-management/admin-management';
import { AdminSetup } from './pages/admin-setup/admin-setup';
import { UserLayout } from './layouts/user-layout/user-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { AdminItemDetail } from './pages/admin-item-detail/admin-item-detail';

export const routes: Routes = [
  // --- USER & PUBLIC ROUTES (These will all have the User Navbar) ---
  {
    path: '',
    component: UserLayout, // This is the wrapper with the user navbar
    children: [
      { path: '', component: Home },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'forgot-password', component: ForgotPassword },
      { path: 'reset-password', component: ResetPassword},
      { path: 'item/:id', component: ItemDetail },
      { path: 'report', component: ReportItem },
      // Protected User Routes (These also have the user navbar but require login)
      { path: 'my-account', component: MyAccount, canActivate: [authGuard] },
      { path: 'claim/:id', component: ClaimForm, canActivate: [authGuard] },
      { path: 'item/:id/verify', component: VerificationDashboard, canActivate: [authGuard] },
      { path: 'messages/:id', component: Messages, canActivate: [authGuard] },
    ]
  },

  // --- ADMIN ROUTES with NO Navbar ---
  // These are top-level so they don't get wrapped by any layout component.
  { path: 'admin-login', component: AdminLogin },
  { path: 'admin-setup', component: AdminSetup },

  // --- SECURE ADMIN ROUTES (These will all have the Admin Navbar) ---
  {
    path: 'admin',
    component: AdminLayout, // This is the wrapper with the admin navbar
    canActivate: [authGuard, adminGuard], // The bouncer is at the main entrance
    children: [
      { path: '', component: AdminDashboard }, // The main dashboard
      { path: 'users', component: UserManagement},
      { path: 'items', component: AdminItemManagement},
      { path: 'admins', component: AdminManagement },
      { path: 'item/:id', component: AdminItemDetail }
    ]
  },

  // Fallback route to redirect any unknown URLs to the homepage
  { path: '**', redirectTo: '' }
];
