import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  users: any[] = [];
  
  // New properties for search and pagination
  searchTerm: string = '';
  currentPage: number = 0;
  totalPages: number = 0;

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.getUsers();
  }

  getUsers(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const params = `?page=${this.currentPage}&search=${this.searchTerm}`;
    
    this.http.get(`http://localhost:8080/api/admin/users${params}`, { headers })
      .subscribe((response: any) => {
        this.users = response.users;
        this.totalPages = response.totalPages;
      });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getUsers();
    }
  }
  
  getPagesArray(): number[] {
    return new Array(this.totalPages).fill(0).map((_, index) => index);
  }

  updateUserStatus(userId: number, newStatus: string): void {
    const action = newStatus === 'active' ? 'reactivate' : newStatus;
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const body = { status: newStatus };

    this.http.put(`http://localhost:8080/api/admin/users/${userId}/status`, body, { headers })
      .subscribe({
        next: () => {
          this.toastr.success(`User has been successfully set to ${newStatus}.`, 'Action Taken');
          const userInList = this.users.find(u => u.id === userId);
          if (userInList) userInList.status = newStatus;
        },
        error: () => this.toastr.error('Failed to update user status.', 'Error')
      });
  }
}