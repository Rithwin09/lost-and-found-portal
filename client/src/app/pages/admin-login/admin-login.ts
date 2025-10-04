import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLogin {
  form = {
    email: '',
    password: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    this.http.post('http://localhost:8080/api/admin/login', this.form)
      .subscribe({
        next: (response: any) => {
          this.authService.saveToken(response.accessToken);
          
          if (response.requires_password_change) {
            this.toastr.info('For your security, please set a new password.', 'First-Time Login');
            this.router.navigate(['/admin/first-login']);
          } else {
            this.toastr.success(`Welcome back, ${response.name}!`, 'Login Successful');
            this.router.navigate(['/admin']);
          }
        },
        error: (error) => {
          console.error('Admin login error!', error);
          this.toastr.error('Login failed. Please check your credentials.', 'Login Failed');
        }
      });
  }
}