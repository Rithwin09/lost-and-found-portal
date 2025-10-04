import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-setup.html',
  styleUrl: './admin-setup.css'
})
export class AdminSetup implements OnInit {
  form = {
    password: '',
    confirmPassword: ''
  };
  token: string | null = null;
  isValidToken: boolean = true; // Assume token is valid until checked

  passwordValidation = {
    minLength: false,
    hasUpper: false,
    hasSpecial: false
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Get the secure setup token from the URL's query parameters
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.isValidToken = false;
    }
  }
  validatePassword(password: string): void {
    this.passwordValidation.minLength = password.length >= 8;
    this.passwordValidation.hasUpper = /(?=.*[A-Z])/.test(password);
    this.passwordValidation.hasSpecial = /(?=.*[!@#$%^&*])/.test(password);
  }

  onSubmit(): void {
    if (this.form.password !== this.form.confirmPassword) {
      this.toastr.error("Your new passwords do not match.", "Error");
      return;
    }
    if (!this.token) {
      this.toastr.error("Invalid or missing setup token.", "Error");
      return;
    }

    const body = { token: this.token, password: this.form.password };
    this.http.post('http://localhost:8080/api/admin/setup', body)
      .subscribe({
        next: () => {
          this.toastr.success('Your admin account is now active. Please log in.', 'Setup Successful!');
          this.router.navigate(['/admin-login']);
        },
        error: (err) => {
          this.toastr.error('The setup link may be invalid or expired. Please contact an administrator.', 'Setup Failed');
        }
      });
  }
}