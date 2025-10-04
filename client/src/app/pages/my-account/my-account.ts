import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-account.html',
  styleUrl: './my-account.css'
})
export class MyAccount implements OnInit {
  reportedItems: any[] = [];
  conversations: any[] = [];
  loggedInUserId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    this.loggedInUserId = this.authService.getLoggedInUserId();
    this.getMyReportedItems();
    this.getMyConversations();
  }

  getMyReportedItems(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get('http://localhost:8080/api/my-items', { headers: headers })
      .subscribe((data: any) => this.reportedItems = data);
  }

  getMyConversations(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get('http://localhost:8080/api/my-conversations', { headers: headers })
      .subscribe((data: any) => this.conversations = data);
  }

  // --- NEW DELETE FUNCTION ---
  deleteItem(itemId: number): void {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      const token = localStorage.getItem('auth_token');
      const headers = new HttpHeaders({ 'x-access-token': token || '' });
      
      this.http.delete(`http://localhost:8080/api/items/${itemId}`, { headers: headers })
        .subscribe({
          next: () => {
            alert('Item deleted successfully.');
            this.reportedItems = this.reportedItems.filter(item => item.id !== itemId);
          },
          error: (err) => {
            console.error('Error deleting item', err);
            alert('Failed to delete the item.');
          }
        });
    }
  }
}