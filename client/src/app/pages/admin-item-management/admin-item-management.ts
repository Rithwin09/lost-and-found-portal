import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Tooltip } from 'bootstrap';

@Component({
  selector: 'app-admin-item-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-item-management.html',
  styleUrl: './admin-item-management.css'
})
export class AdminItemManagement implements OnInit {
  items: any[] = [];
  searchTerm: string = '';
  currentPage: number = 0;
  totalPages: number = 0;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.getItems();
  }

  getItems(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const params = `?page=${this.currentPage}&search=${this.searchTerm}`;
    
    this.http.get(`http://localhost:8080/api/admin/items${params}`, { headers })
      .subscribe((response: any) => {
        this.items = response.items;
        this.totalPages = response.totalPages;

        // --- THIS IS THE CRITICAL FIX ---
        // After the data has arrived and Angular has had a moment to render it,
        // we re-initialize the tooltips on the new elements.
        setTimeout(() => {
          this.initializeTooltips();
        }, 100); // A tiny delay is often needed for the DOM to update
        // ---------------------------------
      });
  }
  
  // --- THIS IS OUR NEW "CUE THE MAGICIAN" FUNCTION ---
  initializeTooltips(): void {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new Tooltip(tooltipTriggerEl);
    });
  }
  // ----------------------------------------------------

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getItems();
    }
  }

  getPagesArray(): number[] {
    return new Array(this.totalPages).fill(0).map((_, index) => index);
  }

  deleteItem(itemId: number): void {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return;
    
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.delete(`http://localhost:8080/api/admin/items/${itemId}`, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Item has been successfully deleted.', 'Action Taken');
          this.items = this.items.filter(item => item.id !== itemId);
        },
        error: () => this.toastr.error('Failed to delete the item.', 'Error')
      });
  }

  verifyItem(itemId: number): void {
    if (!confirm('Are you sure you want to manually verify this guest post and make it public?')) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.put(`http://localhost:8080/api/admin/items/${itemId}/verify`, {}, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Item has been manually verified and is now public.', 'Action Taken');
          const itemInList = this.items.find(i => i.id === itemId);
          if (itemInList) itemInList.is_verified = true;
        },
        error: () => this.toastr.error('Failed to verify the item.', 'Error')
      });
  }

  removeClaims(itemId: number): void {
    if (!confirm('Are you sure you want to remove all pending claims from this item? This will make it available for new claims.')) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.delete(`http://localhost:8080/api/admin/items/${itemId}/claims`, { headers })
      .subscribe({
        next: (response: any) => {
          this.toastr.success(response.message, 'Action Taken');
          this.getItems(); // Refresh the list
        },
        error: () => this.toastr.error('Failed to remove claims.', 'Error')
      });
  }

  // Helper functions for the UI
  getClaimCount(item: any, status: string): number {
    if (!item.claims) return 0;
    return item.claims.filter((claim: any) => claim.status === status).length;
  }
  
  hasAcceptedClaim(item: any): boolean {
    if (!item.claims) return false;
    return item.claims.some((claim: any) => claim.status === 'accepted');
  }

  hasPendingClaims(item: any): boolean {
    if (!item.claims) return false;
    return item.claims.some((claim: any) => claim.status === 'pending');
  }

  getRejectedClaimCount(item: any): number {
    if (!item.claims) return 0;
    return this.getClaimCount(item, 'rejected');
  }

  getRejectedClaimReasons(item: any): string {
    if (!item.claims) return '';
    const rejectedClaims = item.claims.filter((claim: any) => claim.status === 'rejected');
    if (rejectedClaims.length === 0) return '';
    
    return rejectedClaims.map((claim: any, index: number) => 
      `Rejection #${index + 1}: "${claim.rejection_reason || 'No reason provided.'}"`
    ).join('\n');
  }
}