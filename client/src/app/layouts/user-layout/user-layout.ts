import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterModule, Navbar],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `,
})
export class UserLayout {}