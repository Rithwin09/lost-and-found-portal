import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-management.html',
  styleUrl: './admin-management.css'
})
export class AdminManagement implements OnInit {
  admins: any[] = [];
  form = { name: '', email: '' };
  isSuperAdmin: boolean = false;
  loggedInAdminId: number | null = null;
  searchTerm: string = '';
  currentPage: number = 0;
  totalPages: number = 0;

  constructor(
    private http: HttpClient, 
    private toastr: ToastrService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.getUserRole() === 'superadmin';
    this.getAdmins();
  }

  getAdmins(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const params = `?page=${this.currentPage}&search=${this.searchTerm}`;
    this.http.get(`http://localhost:8080/api/admin/admins${params}`, { headers })
      .subscribe((response: any) => {
        this.admins = response.admins;
        this.totalPages = response.totalPages;
      });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.getAdmins();
    }
  }
  
  getPagesArray(): number[] {
    return new Array(this.totalPages).fill(0).map((_, index) => index);
  }

  // This function is now sendInvitation
  sendInvitation(): void {
    if (!confirm('Are you sure you want to send an administrator invitation to this email?')) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    
    // It now calls our new, secure invitation endpoint
    this.http.post('http://localhost:8080/api/admin/admins/invite', this.form, { headers })
      .subscribe({
        next: (response: any) => {
          this.toastr.success(response.message, 'Success');
          this.getAdmins(); // Refresh the list to show the new admin (with a pending status)
          this.resetForm();
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to send invitation.';
          this.toastr.error(message, 'Error');
        }
      });
  }

  resetForm(): void {
    this.form = { name: '', email: '' };
  }
  deleteAdmin(adminId: number): void {
    if (!confirm('Are you sure you want to permanently delete this administrator account? This action cannot be undone.')) return;

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });

    this.http.delete(`http://localhost:8080/api/admin/admins/${adminId}`, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Administrator account has been deleted.', 'Action Taken');
          this.admins = this.admins.filter(admin => admin.id !== adminId);
        },
        error: (err) => {
          const message = err.error?.message || 'Failed to delete administrator.';
          this.toastr.error(message, 'Error');
        }
      });
  }
}
