import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // 1. Import HttpHeaders

@Component({
  selector: 'app-claim-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claim-form.html',
  styleUrl: './claim-form.css'
})
export class ClaimForm implements OnInit {
  itemId: string | null = null;
  proof_description: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
  }

  onSubmit(): void {
    if (!this.proof_description.trim()) {
      alert('Please provide a description as proof.');
      return;
    }

    // --- THIS IS THE NEW SECURITY FIX ---
    // 2. Get the token from browser storage
    const token = localStorage.getItem('auth_token');
    // 3. Create the authorization header
    const headers = new HttpHeaders({
      'x-access-token': token || ''
    });
    // ------------------------------------

    // 4. Send the request with the secure header
    this.http.post(`http://localhost:8080/api/items/${this.itemId}/claims`, 
                   { proof_description: this.proof_description }, 
                   { headers: headers })
      .subscribe({
        next: () => {
          alert('Your claim has been submitted! The finder will be notified to review it.');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error submitting claim', err);
          alert('There was an error submitting your claim. Please try again.');
        }
      });
  }
}
