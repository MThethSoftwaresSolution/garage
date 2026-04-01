import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-exchanges',
  templateUrl: './my-exchanges.page.html',
  styleUrls: ['./my-exchanges.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyExchangesPage implements OnInit {

  exchanges:any[] = [];
  userId = '';
  loading = false;

  constructor(private service: MainService, private navCtrl: NavController) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.userId = user.id;
    this.loadExchanges();
  }

  handleRefresh(event: any) {
  setTimeout(() => {
    this.loadExchanges();
    event.target.complete(); // stops the spinner
  }, 2000);
}

  goBack() {
    this.navCtrl.back();
  }

  loadExchanges(){
    this.loading = true;

    this.service.getUserExchanges(this.userId).subscribe({
      next:(res:any)=>{
        this.exchanges = res;
        this.loading = false;
      },
      error:()=>{
        this.loading = false;
      }
    });
  }

  openExchange(e:any){
    this.navCtrl.navigateForward(`/tabs/exchange/${e.bookingId}`);
  }

  getStatusColor(status:string){

  switch(status){
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'primary';
    case 'CHECKOUT_DONE': return 'medium';
    case 'COMPLETED': return 'success';
    default: return 'dark';
  }

}

canOpenExchange(e:any): boolean {
  return !!e && e.status !== 'REJECTED';
}

canChat(e:any): boolean {
  return this.canOpenExchange(e);
}

openChat(e:any){
  if(!this.canChat(e)) return;
  this.navCtrl.navigateForward(`/tabs/chat/${e.bookingId}`);
}

}