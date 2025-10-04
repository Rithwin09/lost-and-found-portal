import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr'; // 1. Import the ToastrService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  form = {
    email: '',
    password: ''
  };

  // 2. Inject the ToastrService
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  onSubmit(): void {
    this.http.post('http://localhost:8080/api/auth/login', this.form)
      .subscribe({
        next: (response: any) => {
          this.authService.saveToken(response.accessToken);
          this.router.navigate(['/']);
        },
        // --- THIS IS THE NEW, SMARTER ERROR HANDLER ---
        error: (error) => {
          console.error('There was an error!', error);
          // 3. Read the specific message from the backend error response.
          //    If it doesn't exist, fall back to a generic message.
          const errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
          
          // 4. Show the specific message in a red error toast.
          this.toastr.error(errorMessage, 'Login Failed');
        }
        // ---------------------------------------------
      });
  }
}