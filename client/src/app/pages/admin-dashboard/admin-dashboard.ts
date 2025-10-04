import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // This is the required import for routerLink

// We need to declare the 'bootstrap' variable to control the modal from TypeScript
declare var bootstrap: any;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // RouterModule is included here
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  reports: any[] = [];
  selectedReport: any = null;
  chatLogLines: string[] = [];
  private modalInstance: any;
  newReportStatus: string = '';
  isSuperAdmin: boolean = false;

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.getUserRole() === 'superadmin';
    this.getReports();
  }

  getReports(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get('http://localhost:8080/api/reports', { headers: headers })
      .subscribe({
        next: (data: any) => this.reports = data,
        error: (err) => this.toastr.error('Failed to fetch reports.', 'Error')
      });
  }

  openReportDetails(report: any): void {
    this.selectedReport = report;
    this.newReportStatus = report.status;
    if (this.selectedReport && this.selectedReport.chat_log) {
      this.chatLogLines = this.selectedReport.chat_log.split('\n');
    }
    const modalElement = document.getElementById('reportDetailsModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeReportDetails(): void {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  updateReportStatus(): void {
    if (!this.selectedReport) return;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const body = { status: this.newReportStatus };
    this.http.put(`http://localhost:8080/api/admin/reports/${this.selectedReport.id}/status`, body, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Report status has been updated.', 'Success');
          const reportInList = this.reports.find(r => r.id === this.selectedReport.id);
          if (reportInList) reportInList.status = this.newReportStatus;
          this.closeReportDetails();
        },
        error: (err) => this.toastr.error('Failed to update report status.', 'Error')
      });
  }

  moderateUser(newStatus: 'suspended' | 'banned'): void {
    if (!this.selectedReport) return;
    if (!confirm(`Are you sure you want to ${newStatus} this user and initiate a secure handoff?`)) return;
    
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const body = {
      reportId: this.selectedReport.id,
      newStatus: newStatus
    };

    this.http.post('http://localhost:8080/api/admin/actions/moderate-user', body, { headers })
      .subscribe({
        next: () => {
          this.toastr.success(`User has been ${newStatus} and handoff initiated.`, 'Action Taken');
          this.getReports(); 
          this.closeReportDetails();
        },
        error: (err) => {
          this.toastr.error('Failed to perform the moderation action.', 'Error');
        }
      });
  }

  warnAndUnfreeze(): void {
    if (!this.selectedReport) return;
    if (!confirm('Are you sure you want to send a warning and unfreeze this chat?')) return;
    
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    const body = {
      userId: this.selectedReport.reportedUser.id,
      itemId: this.selectedReport.item.id,
      reportId: this.selectedReport.id
    };

    this.http.post('http://localhost:8080/api/admin/actions/warn-unfreeze', body, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('Warning sent, chat unfrozen, and report closed.', 'Action Taken');
          this.getReports();
          this.closeReportDetails();
        },
        error: (err) => {
          this.toastr.error('Failed to perform the action.', 'Error');
        }
      });
  }
}