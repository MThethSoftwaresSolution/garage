import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/services/main.service';
import { IonHeader } from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { PaymentService } from 'src/app/services/payment.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-host-bookings',
  templateUrl: './host-bookings.page.html',
  styleUrls: ['./host-bookings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class HostBookingsPage implements OnInit {

hostBookings: any[] = [];
hostId = '';
loading = false;

constructor(private payment: PaymentService, private toastCtrl: ToastController, 
  private service: MainService, private nav: NavController, private router: Router) { }

          goBack() {
        this.nav.back();
      }

ngOnInit(){

  this.hostBookings = [];

  const currentUserRaw = localStorage.getItem('currentUser');

  if(currentUserRaw){
    this.hostId = JSON.parse(currentUserRaw).id;
  }

  this.loadHostBookings();
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
