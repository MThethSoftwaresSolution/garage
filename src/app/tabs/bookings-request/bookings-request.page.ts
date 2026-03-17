import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { PaymentService } from 'src/app/services/payment.service';

@Component({
  selector: 'app-bookings-request',
  templateUrl: './bookings-request.page.html',
  styleUrls: ['./bookings-request.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class BookingsRequestPage implements OnInit {

  booking: any;

constructor(private payment: PaymentService, private toastCtrl: ToastController, private service: MainService, private nav: NavController, private router: Router) { }

          goBack() {
        this.nav.back();
      }

  loading: boolean = false;

ngOnInit(): void {
  this.loading = false;
    const nav = this.router.getCurrentNavigation();
    this.booking = nav?.extras?.state?.['booking'];

    if (!this.booking) {
      // If user refreshes page, state is lost → redirect back
      this.router.navigateByUrl('/tabs/vehicle/:'+this.booking.vehicleId);
    }

    this.payFormGroup.patchValue({
      amount: this.booking.GrandTotal
    })
    console.log('Received booking:', this.booking);
  }

    payFormGroup: FormGroup = new FormGroup({
    amount: new FormControl(0, [Validators.required])
  });

 async pay() {
    const booking = {
      vehicleId: this.booking.vehicleId,
      userId: (localStorage.getItem('id') ?? '').toLowerCase(),
      grandTotal: this.booking.GrandTotal,
      fromDate: this.booking.PickupDate,
      untilDate: this.booking.ReturnDate,
      garageFee: this.booking.GarageFee,
      pickupLocation: this.booking.PickupLocation,
      returnLocation: this.booking.ReturnLocation,

      estimatedDays: this.booking.EstimatedDays,
      estimatedTotal: this.booking.EstimatedTotal
    };

    this.service.createBooking(booking)
    .subscribe({

      next: async (resp:any) => {

        console.log("Booking created", resp);
        const toast = await this.toastCtrl.create({
        message: "Booking created successfully",
        duration: 3000,
        position: "top",
        color: "success"
      });

      await toast.present();

      setTimeout(() => {
        this.router.navigate(['tabs/my-bookings']);
      }, 3000);

      },

      error: async (err:any) => {
        console.log(err.error);
        const toast = await this.toastCtrl.create({
        message: err.error,
        duration: 3000,
        position: "top",
        color: "danger"
      });

      await toast.present();
      }

    });
    
  }

}
