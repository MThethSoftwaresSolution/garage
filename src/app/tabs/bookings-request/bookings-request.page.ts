import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';

@Component({
  selector: 'app-bookings-request',
  templateUrl: './bookings-request.page.html',
  styleUrls: ['./bookings-request.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class BookingsRequestPage implements OnInit {

  booking: any = null;
  loading = false;

  payFormGroup: FormGroup = new FormGroup({
    amount: new FormControl(0, [Validators.required])
  });

  constructor(
    private toastCtrl: ToastController,
    private service: MainService,
    private nav: NavController,
    private router: Router
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    this.booking = nav?.extras?.state?.['booking'];

    console.log('Booking request page received booking:', this.booking);

    if (!this.booking) {
      this.router.navigateByUrl('/tabs/home');
      return;
    }

    this.payFormGroup.patchValue({
      amount: this.booking.grandTotal
    });
  }

  goBack() {
    this.nav.back();
  }

  async pay() {
    if (!this.booking) {
      await this.presentToast('Booking details missing.', 'danger');
      return;
    }

    this.loading = true;

    const bookingPayload = {
      vehicleId: this.booking.vehicleId,
      userId: (localStorage.getItem('id') ?? '').toLowerCase(),

      fromDate: this.booking.from,
      untilDate: this.booking.until,

      pickupLocation: this.booking.pickupLocation,
      returnLocation: this.booking.returnLocation,

      estimatedDays: this.booking.estimatedDays,

      bookingFee: this.booking.bookingFee,
      insuranceFee: this.booking.insuranceFee,
      serviceFee: this.booking.serviceFee,
      vatAmount: this.booking.vatAmount,
      depositFee: this.booking.depositFee,
      grandTotal: this.booking.grandTotal,

      vehicleRate: this.booking.vehicleRate,
      vehicleValueAmount: this.booking.vehicleValueAmount
    };

    console.log('Create booking payload:', bookingPayload);

    this.service.createBooking(bookingPayload).subscribe({
      next: async (resp: any) => {
        this.loading = false;

        await this.presentToast('Booking created successfully', 'success');

        const bookingId = resp.bookingId || resp.BookingId;

        //this.router.navigate(['/tabs/exchange', bookingId]);
        //this.router.navigate(['/tabs/my-bookings']);
        window.location.href = '/tabs/my-bookings';
      },

      error: async (err: any) => {
        this.loading = false;

        await this.presentToast(
          err?.error?.message || err?.error || 'Failed to create booking.',
          'danger'
        );
      }
    });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'top',
      color
    });

    await toast.present();
  }
}