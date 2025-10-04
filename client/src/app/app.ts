import { Component, OnInit, computed, HostListener } from '@angular/core'; 
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './components/navbar/navbar';
import { AdminNavbar } from './components/admin-navbar/admin-navbar';
import { AuthService } from './services/auth';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, Navbar, AdminNavbar, CommonModule],
  templateUrl: './app.html', 
  styleUrl: './app.css' 
})
export class App implements OnInit { 
  
  isAdmin = computed(() => {
    const user = this.authService.currentUser();
    return user && (user.role === 'admin' || user.role === 'superadmin');
  });

  displayNavbar: 'user' | 'admin' | 'none' = 'user';

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    
    this.authService.loadUserProfile()?.subscribe();

    
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkRoute(event.urlAfterRedirects);
    });
  }


  @HostListener('window:focus', ['$event'])
  onWindowFocus(event: any): void {
    console.log("Window focused, re-checking session...");
    
    this.authService.loadUserProfile()?.subscribe();
  }
  

  
  checkRoute(url: string): void {
    const adminRoutes = ['/admin', '/admin/users', '/admin/items', '/admin/admins'];
    const noNavRoutes = ['/admin-login', '/admin-setup'];
    const userNavRoutes = ['/login', '/register'];

    if (noNavRoutes.some(route => url.startsWith(route))) {
      this.displayNavbar = 'none';
    } else if (adminRoutes.some(route => url.startsWith(route))) {
      this.displayNavbar = 'admin';
    } else {
      this.displayNavbar = 'user';
    }
  }
}