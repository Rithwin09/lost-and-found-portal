import { Component, AfterViewInit, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Collapse } from 'bootstrap';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-navbar.html',
  styleUrls: ['./admin-navbar.css']
})
export class AdminNavbar implements AfterViewInit {
  @ViewChild('adminNavbarNav') adminNavbarNav!: ElementRef;
  private collapseInstance: Collapse | null = null;

  isSuperAdmin: boolean = false;
  adminName: string | null = null;
  
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.adminName = user.name;
        this.isSuperAdmin = user.role === 'superadmin';
      } else {
        this.adminName = null;
        this.isSuperAdmin = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.adminNavbarNav) {
      this.collapseInstance = new Collapse(this.adminNavbarNav.nativeElement, { toggle: false });
    }
  }

  // --- NEW FUNCTION to toggle menu open/close ---
  toggleMenu(): void {
    if (this.collapseInstance) {
      this.collapseInstance.toggle();
    }
  }

  // --- SINGLE MANAGER FUNCTION ---
  navigateAndClose(path: string): void {
    if (this.collapseInstance) {
      this.collapseInstance.hide();
    }
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.navigateAndClose('/admin-login');
  }
}
