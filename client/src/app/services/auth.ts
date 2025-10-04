import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<any | null>(null);

  constructor(private http: HttpClient) {}

  // This is the new, smarter "automatic check-in"
  loadUserProfile(): Observable<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.currentUser.set(null);
      return of(null);
    }

    const payload = this.getDecodedToken();
    const role = payload ? payload.role : 'user';
    const headers = new HttpHeaders({ 'x-access-token': token });
    
    let profileUrl = '';
    if (role === 'admin' || role === 'superadmin') {
      profileUrl = 'http://localhost:8080/api/admin/profile';
    } else {
      profileUrl = 'http://localhost:8080/api/auth/profile';
    }

    return this.http.get(profileUrl, { headers }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(error => {
        this.logout(); // If the token is invalid, log the user out
        return of(null);
      })
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.loadUserProfile().subscribe();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // The logout function is now more robust
  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUser.set(null); // Explicitly clear the current user state
  }

  getLoggedInUserId(): number | null {
    const payload = this.getDecodedToken();
    return payload ? payload.id : null;
  }

  getUserRole(): string | null {
    const payload = this.getDecodedToken();
    return payload ? payload.role : null;
  }
  
  private getDecodedToken(): any {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
}