import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  };

  passwordValidation = {
    minLength: false,
    hasUpper: false,
    hasSpecial: false
  };

  isPasswordFocused: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService 
  ) {}

  validatePassword(password: string): void {
    this.passwordValidation.minLength = password.length >= 8;
    this.passwordValidation.hasUpper = /(?=.*[A-Z])/.test(password);
    this.passwordValidation.hasSpecial = /(?=.*[!@#$%^&*])/.test(password);
  }

  // --- THIS IS THE NEW, SMARTER FILTER FUNCTION ---
  // It is now designed to work directly with ngModel's own event.
  onPhoneNumberChange(value: string): void {
    // This regular expression finds any character that is NOT a digit (\D)
    // and replaces it with an empty string.
    this.form.phoneNumber = value.replace(/\D/g, '');
  }
  // ---------------------------------------------

  onSubmit(): void {
    if (this.form.password !== this.form.confirmPassword) {
      this.toastr.error("Passwords do not match!", "Error");
      return;
    }
    const { name, email, password, phoneNumber } = this.form;
    this.http.post('http://localhost:8080/api/auth/register', { name, email, password, phoneNumber })
      .subscribe({
        next: (response) => {
          this.toastr.success('You can now log in.', 'Registration Successful!');
          window.scrollTo(0, 0);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          const message = error.error?.message || 'Registration failed. Please try again.';
          this.toastr.error(message, 'Registration Failed');
        }
      });
  }
}