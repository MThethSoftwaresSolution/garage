import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonicModule, NavController } from '@ionic/angular';
import { ChatService } from 'src/app/services/chat.service';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatPage implements OnInit {

  @ViewChild(IonContent) content!: IonContent;
bookingId = '';
  messages:any[] = [];
  newMessage = '';
  currentUserId = '';
  scrollToBottom(){
  setTimeout(() => {
    this.content.scrollToBottom(200);
  }, 100);
}

  constructor(
    private route: ActivatedRoute, private nav: NavController,
    private service: MainService, private chatService: ChatService
  ) {}

  async ngOnInit() {
      this.bookingId = this.route.snapshot.paramMap.get('id')!;

  const user = JSON.parse(localStorage.getItem('currentUser')!);
  this.currentUserId = user.id;

  this.loadMessages();

  await this.chatService.startConnection();
  await this.chatService.joinBooking(this.bookingId);

  this.chatService.onMessage((msg:any) => {
    this.messages.push(msg);
     this.scrollToBottom();
  });
  }

  loadMessages(){
    this.service.getMessages(this.bookingId).subscribe((res:any)=>{
      this.messages = res;
      this.scrollToBottom();
    });
  }

sendMessage(){
  if(!this.newMessage.trim()) return;

  this.chatService.sendMessage(
    this.bookingId,
    this.currentUserId,
    this.newMessage
  );

  this.newMessage = '';
}

goBack(){
  this.nav.back();
}

}
