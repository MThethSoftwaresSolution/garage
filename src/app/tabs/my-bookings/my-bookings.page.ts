import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.page.html',
  styleUrls: ['./my-bookings.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyBookingsPage implements OnInit {

constructor(private navCtrl: NavController, 
  private service: MainService, private alertCtrl: AlertController) { }

bookings: any[] = [];
userId = '';

hostBookings: any[] = [];
hostId = '';

loading = false;

ngOnInit() {

  this.bookings = [];
  this.hostBookings = [];

  const currentUserRaw = localStorage.getItem('currentUser');

  if (currentUserRaw) {
    this.userId = JSON.parse(currentUserRaw).id;
  }


  this.loadBookings();

  if(currentUserRaw){
    this.hostId = JSON.parse(currentUserRaw).id;
  }

  this.loadHostBookings();
}

handleRefresh(event: any) {
  setTimeout(() => {
    this.loadBookings();
    this.loadHostBookings();
    event.target.complete(); // stops the spinner
  }, 2000);
}

isDriver(b:any): boolean {
  return b.userId === this.userId;
}

loadBookings() {

  this.loading = true;

  this.service.getBookingsByUser(this.userId)
  .subscribe({

    next: (resp:any) => {

      this.bookings = resp;

      console.log(this.bookings);
      this.loading = false;
    },

    error: (err:any) => {
      console.log(err.error);
      this.loading = false;
    }

  });

}

startExchange(booking:any){
  this.navCtrl.navigateForward(`/tabs/exchange/${booking.bookingId}`);
}

cancelBooking(bookingId: string){

  this.service.cancelBooking(bookingId)
  .subscribe({

    next: () => {

      this.bookings = this.bookings.filter(b => b.bookingId !== bookingId);

    },

    error: (err:any) => {
      console.log(err.error);
    }

  });

}

async confirmCancel(id:string){

  const alert = await this.alertCtrl.create({
    header: 'Cancel Booking',
    message: 'Are you sure you want to cancel this booking?',
    buttons: [
      { text: 'No', role: 'cancel' },
      {
        text: 'Yes',
        handler: () => this.cancelBooking(id)
      }
    ]
  });

  await alert.present();
}

  goBack() {
    this.navCtrl.back();
  }


pay(booking:any){

this.service.initiate({
  bookingId: booking.bookingId
  }).subscribe((resp:any)=>{

  window.location.href = resp.redirectUrl;

  });

}

getExchangeLabel(b:any): string {

  if (!b.exchange) return 'Start Exchange';

  switch(b.exchange.status){
    case 'PENDING': return 'Awaiting Confirmation';
    case 'CONFIRMED': return 'Go to Meeting';
    case 'CHECKOUT_DONE': return 'Complete Return';
    case 'COMPLETED': return 'Trip Completed';
    default: return 'Manage Exchange';
  }
}

getExchangeColor(b:any): string {

  if (!b.exchange) return 'tertiary';

  switch(b.exchange.status){
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'primary';
    case 'CHECKOUT_DONE': return 'medium';
    case 'COMPLETED': return 'success';
    default: return 'tertiary';
  }
}

loadHostBookings(){

  this.loading = true;

  this.service.getHostBookings(this.hostId)
  .subscribe({

    next:(resp:any)=>{
      console.log(resp);
      this.hostBookings = resp;

      this.loading = false;

    },

    error:(err:any)=>{
      console.log(err.error);
      this.loading = false;
    }

  });

}

getImage(url: string | null) {
  if (!url) return './assets/default-car.jpg';
  return environment.baseUrl + url;
}

acceptBooking(id:string){

  this.service.acceptBooking(id)
  .subscribe({

    next:()=>{

      const booking = this.hostBookings.find(x => x.bookingId === id);

      if(booking){
        booking.isConfirmed = true;
      }

    },

    error:(err:any)=>{
      console.log(err.error);
    }

  });

}

rejectBooking(id:string){

  this.service.acceptBooking(id)
  .subscribe({

    next:()=>{

      const booking = this.hostBookings.find(x => x.bookingId === id);

      if(booking){
        booking.isConfirmed = true;
      }

    },

    error:(err:any)=>{
      console.log(err.error);
    }

  });

}

}
