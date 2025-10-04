import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  email: string = '';

  constructor(private http: HttpClient) {}

  onSubmit(): void {
    this.http.post('http://localhost:8080/api/auth/forgot-password', { email: this.email })
      .subscribe({
        next: (response: any) => {
          alert(response.message); // Show the message from the backend
        },
        error: (err) => {
          console.error('Error sending reset link', err);
          alert('An error occurred. Please try again.');
        }
      });
  }
}