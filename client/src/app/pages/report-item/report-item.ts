import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-item.html',
  styleUrl: './report-item.css'
})
export class ReportItem implements OnInit {
  isLoggedIn: boolean = false;
  form: any = {
    status: 'found',
    title: '',
    category: '',
    otherCategory: '',
    color: '',
    brand: '',
    unique_marks: '',
    item_size: '',
    description: '',
    guest_email: ''
  };
  selectedFile: File | null = null;
  
  // CORRECTED: The variable to control the camera view
  isCameraOpen: boolean = false; 
  private stream: MediaStream | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (!this.isLoggedIn) {
      this.form.status = 'found';
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] ?? null;
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  async startCamera(): Promise<void> {
    this.isCameraOpen = true;
    // We need to wait a moment for the video element to appear in the HTML
    setTimeout(async () => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoElement = document.querySelector('video');
        if (videoElement) {
          videoElement.srcObject = this.stream;
        }
      } catch (err) {
        this.toastr.error('Could not access the camera. Please check permissions.', 'Camera Error');
        this.isCameraOpen = false;
      }
    }, 0);
  }

  // CORRECTED: The function to take a picture
  captureImage(): void {
    const videoElement = document.querySelector('video');
    const canvas = document.createElement('canvas');
    if (videoElement) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      canvas.getContext('2d')?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      this.dataURLtoFile(dataUrl, `capture-${Date.now()}.png`);
      this.stopCamera();
    }
  }

  dataURLtoFile(dataurl: string, filename: string) {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    this.selectedFile = new File([u8arr], filename, {type:mime});
    this.cd.detectChanges(); // Nudge Angular to update the view
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    this.isCameraOpen = false;
  }
  
  resetForm(): void {
    this.form = {
      status: this.isLoggedIn ? '' : 'found',
      title: '', category: '', otherCategory: '', color: '', brand: '',
      unique_marks: '', item_size: '', description: '', guest_email: ''
    };
    this.removeSelectedFile();
  }

  onSubmit(): void {
    const formData = new FormData();
    const reportData = { ...this.form };
    if (reportData.category === 'Other') {
      reportData.category = reportData.otherCategory;
    }
    delete reportData.otherCategory;

    for (const key in reportData) {
      formData.append(key, reportData[key]);
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }
    
    if (this.isLoggedIn) {
      const token = localStorage.getItem('auth_token');
      const headers = new HttpHeaders({ 'x-access-token': token || '' });
      this.http.post('http://localhost:8080/api/items', formData, { headers })
        .subscribe({
          next: () => {
            this.toastr.success('Your report is now live on the homepage.', 'Report Submitted!');
            window.scrollTo(0, 0);
            this.router.navigate(['/']);
          },
          // This is the new, smarter error handler
          error: (error) => {
            const message = error.error?.message || 'There was an error submitting your report.';
            this.toastr.error(message, 'Submission Failed');
          }
        });
    } else {
      this.http.post('http://localhost:8080/api/guest-items', formData)
        .subscribe({
          next: () => {
            this.toastr.info('Please check your email to verify your post.', 'Report Submitted!');
            this.resetForm();
          },
          // This is the new, smarter error handler
          error: (error) => {
            const message = error.error?.message || 'There was an error submitting your report.';
            this.toastr.error(message, 'Submission Failed');
          }
        });
    }
  }
}
