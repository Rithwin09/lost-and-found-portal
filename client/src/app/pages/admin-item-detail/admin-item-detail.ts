import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-item-detail.html',
  styleUrls: ['./admin-item-detail.css']
})
export class AdminItemDetail implements OnInit {
  item: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const itemId = this.route.snapshot.paramMap.get('id');

    if (itemId) {
      // This uses the same public endpoint, which is fine because the page
      // itself is protected by our adminGuard.
      this.http.get(`http://localhost:8080/api/items/${itemId}`)
        .subscribe({
          next: (response: any) => {
            this.item = response;
          },
          error: (error) => {
            console.error('Error fetching item details for admin!', error);
          }
        });
    }
  }
}