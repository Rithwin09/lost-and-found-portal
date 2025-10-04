import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminNavbar } from '../../components/admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, AdminNavbar],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <router-outlet></router-outlet>
  `,
})
export class AdminLayout {}