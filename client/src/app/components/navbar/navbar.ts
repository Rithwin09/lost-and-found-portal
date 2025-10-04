import { Component, AfterViewInit, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Collapse } from 'bootstrap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar implements AfterViewInit {
  @ViewChild('navbarNav') navbarNav!: ElementRef;
  private collapseInstance: Collapse | null = null;
  
  isLoggedIn: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      this.isLoggedIn = !!user && (user.role === 'user' || !user.role);
    });
  }

  ngAfterViewInit(): void {
    if (this.navbarNav) {
      this.collapseInstance = new Collapse(this.navbarNav.nativeElement, { toggle: false });
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
    this.navigateAndClose('/login');
  }
}
