import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:8080');
  }

  joinRoom(itemId: string): void {
    this.socket.emit('joinRoom', itemId);
  }

  // --- THIS IS THE CORRECTED FUNCTION ---
  // It now accepts a single object for the message data
  sendMessage(itemId: string, messageData: { message: string, senderId: number }): void {
    // We send the itemId separately, and the message data as a single object
    this.socket.emit('sendMessage', { itemId, ...messageData });
  }
  // ------------------------------------

  receiveMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('receiveMessage', (message: any) => {
        observer.next(message);
      });
    });
  }

  deleteMessage(messageId: number, userId: number, itemId: string): void {
    this.socket.emit('deleteMessage', { messageId, userId, itemId });
  }
  // ----------------------------------------------------

  // --- THIS IS THE NEW FUNCTION TO LISTEN FOR DELETIONS ---
  onMessageDeleted(): Observable<{ messageId: number }> {
    return new Observable(observer => {
      this.socket.on('messageDeleted', (data: { messageId: number }) => {
        observer.next(data);
      });
    });
  }
}