import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-verification-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verification-dashboard.html',
  styleUrl: './verification-dashboard.css'
})
export class VerificationDashboard implements OnInit {
  itemId: string | null = null;
  item: any = null;
  claims: any[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.getItemDetails();
      this.getClaims();
    }
  }

  getItemDetails(): void {
    this.http.get(`http://localhost:8080/api/items/${this.itemId}`)
      .subscribe(response => this.item = response);
  }

  getClaims(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get(`http://localhost:8080/api/items/${this.itemId}/claims`, { headers: headers })
      .subscribe({
        next: (data: any) => {
          this.claims = data;
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  acceptClaim(claimId: number): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const body = { status: 'accepted' };

    this.http.put(`http://localhost:8080/api/claims/${claimId}`, body, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Claim has been accepted. A chat has been opened.', 'Action Taken');
          this.router.navigate(['/messages', this.itemId]);
        },
        error: () => this.toastr.error('Failed to accept the claim.', 'Error')
      });
  }

  rejectClaim(claimId: number): void {
    const reason = prompt("Please provide a brief reason for rejecting this claim. This will be logged for administrative review.");

    if (reason && reason.trim()) {
      const token = localStorage.getItem('auth_token');
      const headers = new HttpHeaders({ 'x-access-token': token || '' });
      const body = { 
        status: 'rejected', 
        rejection_reason: reason
      };

      this.http.put(`http://localhost:8080/api/claims/${claimId}`, body, { headers })
        .subscribe({
          next: () => {
            this.toastr.info('The claim has been rejected.', 'Action Taken');
            const claimInList = this.claims.find(c => c.id === claimId);
            if (claimInList) claimInList.status = 'rejected';
          },
          error: () => this.toastr.error('Failed to reject the claim.', 'Error')
        });
    }
  }
}