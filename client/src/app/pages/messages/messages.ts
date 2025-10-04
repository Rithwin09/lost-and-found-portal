import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chat';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrls: ['./messages.css']
})
export class Messages implements OnInit {
  itemId: string | null = null;
  item: any = null;
  showResolvedButton: boolean = false;
  isChatFrozen: boolean = false; // New flag for the frozen state
  messages: any[] = [];
  newMessage: string = '';
  loggedInUserId: number | null = null;
  
  isLoading: boolean = true;
  canAccessChat: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loggedInUserId = this.authService.getLoggedInUserId();
    this.itemId = this.route.snapshot.paramMap.get('id');

    if (this.itemId) {
      this.checkAccess();
    }
  }
  checkAccess(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });

    this.http.get(`http://localhost:8080/api/items/${this.itemId}/chat-access`, { headers })
      .subscribe({
        next: () => {
          this.canAccessChat = true;
          this.isLoading = false;
          this.chatService.joinRoom(this.itemId!);
          this.getItemDetails();
          this.getChatHistory();
          this.listenForNewMessages();
        },
        error: (err) => {
          this.canAccessChat = false;
          this.isLoading = false;
        }
      });
  }

  listenForNewMessages(): void {
    this.chatService.receiveMessage().subscribe((message: any) => {
      this.messages.push(message);
    });
  }

   listenForDeletedMessages(): void {
    this.chatService.onMessageDeleted().subscribe(data => {
      this.messages = this.messages.filter(msg => msg.id !== data.messageId);
    });
  }

  getChatHistory(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get(`http://localhost:8080/api/items/${this.itemId}/messages`, { headers })
      .subscribe((response: any) => {
        this.messages = response;
      });
  }

  getItemDetails(): void {
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    this.http.get(`http://localhost:8080/api/items/${this.itemId}`, { headers })
      .subscribe((response: any) => {
        this.item = response;
        this.isChatFrozen = this.item.is_under_review; // Set the frozen flag

        // Logic for the resolve button
        if (this.item.status === 'lost' && this.item.userId === this.loggedInUserId) {
          this.showResolvedButton = true;
        } else if (this.item.status === 'found' && this.item.claims) {
          const myAcceptedClaim = this.item.claims.find((claim: any) =>
            claim.status === 'accepted' && claim.claimantId === this.loggedInUserId
          );
          if (myAcceptedClaim) {
            this.showResolvedButton = true;
          }
        }
      });
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.itemId && this.loggedInUserId && !this.isChatFrozen) {
      const messageToSend = {
        message: this.newMessage,
        senderId: this.loggedInUserId
      };
      this.chatService.sendMessage(this.itemId, messageToSend);
      this.newMessage = '';
    }
  }
  // ------------------------------------------------

  markAsResolved(): void {
    if (!this.itemId) return;
    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'x-access-token': token || '' });
    
    this.http.put(`http://localhost:8080/api/items/${this.itemId}/status`, { status: 'resolved' }, { headers })
      .subscribe({
        next: () => {
          this.toastr.success('This item has been marked as resolved!', 'Success');
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.toastr.error('Could not update the item status.', 'Error');
        }
      });
  }

  reportUser(): void {
    const reason = prompt("Please provide a reason for reporting this user. This will be sent to the campus administrators for review.");

    if (reason && reason.trim()) {
      let reportedUserId;
      if (this.item && this.item.claims) {
        if (this.loggedInUserId === this.item.userId) {
          const acceptedClaim = this.item.claims.find((c: any) => c.status === 'accepted');
          if (acceptedClaim) {
            reportedUserId = acceptedClaim.claimantId;
          }
        } else {
          reportedUserId = this.item.userId;
        }
      }

      if (!reportedUserId) {
        this.toastr.error("Could not identify the user to report.", "Error");
        return;
      }
      
      const reportData = {
        reason: reason,
        itemId: this.itemId,
        reportedUserId: reportedUserId
      };

      const token = localStorage.getItem('auth_token');
      const headers = new HttpHeaders({ 'x-access-token': token || '' });

      this.http.post('http://localhost:8080/api/reports', reportData, { headers })
        .subscribe({
          next: () => {
            this.toastr.success("Your report has been submitted and will be reviewed by an administrator.", "Report Submitted");
          },
          error: (err) => {
            this.toastr.error("There was an error submitting your report.", "Submission Failed");
          }
        });
    }
  }
  deleteMessage(messageId: number): void {
  if (this.itemId && this.loggedInUserId) {
    if (confirm('Are you sure you want to permanently delete this message?')) {
      // Emit to server
      this.chatService.deleteMessage(messageId, this.loggedInUserId, this.itemId);

      // Update UI immediately
      this.messages = this.messages.filter(msg => msg.id !== messageId);
    }
  }
  }
}