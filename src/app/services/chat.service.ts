import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

export class ChatService {

  private hubConnection!: signalR.HubConnection;

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.baseUrl+'chatHub')
      .withAutomaticReconnect()
      .build();

    return this.hubConnection.start();
  }

  joinBooking(bookingId: string) {
    return this.hubConnection.invoke('JoinBooking', bookingId);
  }

  sendMessage(bookingId: string, userId: string, message: string) {
    debugger;
    return this.hubConnection.invoke('SendMessage', bookingId, userId, message);
  }

  onMessage(callback: (msg:any) => void) {
    this.hubConnection.on('ReceiveMessage', callback);
  }
}