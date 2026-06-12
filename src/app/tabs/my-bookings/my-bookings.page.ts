import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
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

  bookings: any[] = [];
  hostBookings: any[] = [];

  userId = '';
  hostId = '';

  loading = false;

  constructor(
    private navCtrl: NavController,
    private service: MainService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
      const user = JSON.parse(currentUserRaw);
      this.userId = user.id;
      this.hostId = user.id;
    }

    this.loadAll();
  }

  loadAll() {
    this.bookings = [];
    this.hostBookings = [];

    this.loadBookings();
    this.loadHostBookings();
  }

  handleRefresh(event: any) {
    Promise.all([
      this.loadBookingsPromise(),
      this.loadHostBookingsPromise()
    ]).finally(() => {
      event.target.complete();
    });
  }

  handleRefreshManual() {
    this.loadAll();
  }

  goBack() {
    this.navCtrl.back();
  }

  isDriver(b: any): boolean {
    return b.userId === this.userId;
  }

  loadBookings() {
    this.loading = true;

    this.service.getBookingsByUser(this.userId).subscribe({
      next: (resp: any) => {
        this.bookings = resp || [];
        this.loading = false;
      },
      error: async (err: any) => {
        this.loading = false;
        await this.presentToast(err?.error || 'Failed to load bookings', 'danger');
      }
    });
  }

  loadHostBookings() {
    this.loading = true;

    this.service.getHostBookings(this.hostId).subscribe({
      next: (resp: any) => {
        this.hostBookings = resp || [];
        this.loading = false;
      },
      error: async (err: any) => {
        this.loading = false;
        await this.presentToast(err?.error || 'Failed to load host bookings', 'danger');
      }
    });
  }

  private loadBookingsPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getBookingsByUser(this.userId).subscribe({
        next: (resp: any) => {
          this.bookings = resp || [];
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  private loadHostBookingsPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getHostBookings(this.hostId).subscribe({
        next: (resp: any) => {
          this.hostBookings = resp || [];
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  startExchange(booking: any) {
    this.navCtrl.navigateForward(`/tabs/exchange/${booking.bookingId}`);
  }

  async confirmCancel(id: string) {
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

  cancelBooking(bookingId: string) {
    this.service.cancelBooking(bookingId).subscribe({
      next: async () => {
        this.bookings = this.bookings.filter(b => b.bookingId !== bookingId);
        await this.presentToast('Booking cancelled', 'success');
      },
      error: async (err: any) => {
        await this.presentToast(err?.error || 'Failed to cancel booking', 'danger');
      }
    });
  }

  pay(booking: any) {
    this.service.initiate({
      bookingId: booking.bookingId
    }).subscribe({
      next: (resp: any) => {
        window.location.href = resp.redirectUrl;
      },
      error: async (err: any) => {
        await this.presentToast(err?.error || 'Could not start payment', 'danger');
      }
    });
  }

  getExchangeLabel(b: any): string {
    if (!b.exchange) return 'Start Exchange';

    switch (b.exchange.status) {
      case 'PENDING': return 'Awaiting Confirmation';
      case 'CONFIRMED': return 'Go to Meeting';
      case 'CHECKOUT_DONE': return 'Complete Return';
      case 'COMPLETED': return 'Trip Completed';
      default: return 'Manage Exchange';
    }
  }

  getExchangeColor(b: any): string {
    if (!b.exchange) return 'tertiary';

    switch (b.exchange.status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'primary';
      case 'CHECKOUT_DONE': return 'medium';
      case 'COMPLETED': return 'success';
      default: return 'tertiary';
    }
  }

  getImage(url: string | null) {
    if (!url) return './assets/default-car.jpg';
    if (url.startsWith('http')) return url;
    return environment.baseUrl + url;
  }

  acceptBooking(id: string) {
    this.loading = true;
    this.service.acceptBooking(id).subscribe({
      next: async () => {
        const booking = this.hostBookings.find(x => x.bookingId === id);

        if (booking) {
          booking.isConfirmed = true;
          booking.isRejected = false;
        }
      this.loading = false;
        await this.presentToast('Booking accepted', 'success');
        location.reload();
      },
      error: async (err: any) => {
        await this.presentToast(err?.error || 'Failed to accept booking', 'danger');
        this.loading = false;
      }
    });
  }

  rejectBooking(id: string) {
    this.service.rejectBooking(id).subscribe({
      next: async () => {
        const booking = this.hostBookings.find(x => x.bookingId === id);

        if (booking) {
          booking.isConfirmed = false;
          booking.isRejected = true;
        }

        await this.presentToast('Booking declined', 'success');
      },
      error: async (err: any) => {
        await this.presentToast(err?.error || 'Failed to decline booking', 'danger');
      }
    });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' = 'primary'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2400,
      position: 'top'
    });

    await toast.present();
  }
}