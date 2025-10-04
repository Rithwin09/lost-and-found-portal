import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  items: any[] = [];

  filters = {
    search: '',
    category: '',
    status: ''
  };

  // --- PAGINATION PROPERTIES (These were missing) ---
  currentPage = 0;
  totalPages = 0;
  totalItems = 0;
  // -----------------------------------------

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Listen for navigation events to refresh the data
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.urlAfterRedirects === '/') {
        this.getItems();
      }
    });

    // Get items on the very first load
    this.getItems();
  }

  getItems(): void {
    let params = new HttpParams();

    if (this.filters.search) {
      params = params.append('search', this.filters.search);
    }
    if (this.filters.category) {
      params = params.append('category', this.filters.category);
    }
    if (this.filters.status) {
      params = params.append('status', this.filters.status);
    }
    params = params.append('page', this.currentPage.toString());

    this.http.get('http://localhost:8080/api/items', { params: params })
      .subscribe({
        next: (response: any) => {
          this.items = response.items;
          this.totalPages = response.totalPages;
          this.totalItems = response.totalItems;
        },
        error: (error) => {
          console.error('Error fetching items!', error);
        }
      });
  }

  // --- PAGINATION FUNCTIONS (These were missing) ---
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getItems();
  }

  getPagesArray(): number[] {
    return new Array(this.totalPages).fill(0).map((_, index) => index);
  }
  // -----------------------------------------
}
