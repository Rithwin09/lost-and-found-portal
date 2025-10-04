import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  form = {
    password: '',
    confirmPassword: ''
  };
  token: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the reset token from the URL's query parameters
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit(): void {
    if (this.form.password !== this.form.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (!this.token) {
      alert('Invalid or missing reset token. Please try the forgot password process again.');
      return;
    }

    // Send the token and new password to the backend
    this.http.post('http://localhost:8080/api/auth/reset-password', { token: this.token, password: this.form.password })
      .subscribe({
        next: (response: any) => {
          alert(response.message);
          this.router.navigate(['/login']); // Redirect to login page on success
        },
        error: (err) => {
          console.error('Error resetting password', err);
          alert(err.error.message || 'An error occurred. Please try again.');
        }
      });
  }
}
