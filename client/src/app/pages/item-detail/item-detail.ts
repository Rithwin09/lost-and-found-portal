import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.css'
})
export class ItemDetail implements OnInit, AfterViewInit {
  item: any = null;
  showClaimButton: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const itemId = this.route.snapshot.paramMap.get('id');

    if (itemId) {
      this.http.get(`http://localhost:8080/api/items/${itemId}`)
        .subscribe({
          next: (response: any) => {
            this.item = response;
            this.checkIfClaimButtonShouldBeShown();
          },
          error: (error) => {
            console.error('Error fetching item details!', error);
          }
        });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        .forEach(tooltipNode => new Tooltip(tooltipNode));
    }, 100);
  }

  // --- THIS IS THE NEW, SMARTER LOGIC ---
  // It now also checks if the user is an admin.
  checkIfClaimButtonShouldBeShown(): void {
    const loggedInUserId = this.authService.getLoggedInUserId();
    const userRole = this.authService.getUserRole();

    // The new, more secure rule:
    // Show the button only if the item is 'found', the logged-in user is NOT the poster,
    // AND the logged-in user's role is NOT 'admin'.
    if (this.item && this.item.status === 'found' && this.item.userId !== loggedInUserId && userRole !== 'admin') {
      this.showClaimButton = true;
    } else {
      this.showClaimButton = false;
    }
  }
  // ------------------------------------
}