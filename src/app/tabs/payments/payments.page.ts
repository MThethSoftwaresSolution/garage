import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { PaymentService } from './../../services/payment.service';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-payments',
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
        standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class PaymentsPage implements OnInit {

  booking: any;

constructor(private payment: PaymentService, private nav: NavController, private router: Router) { }

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
      amount: this.booking.amount
    })
    console.log('Received booking:', this.booking);
  }

    payFormGroup: FormGroup = new FormGroup({
    amount: new FormControl(0, [Validators.required])
  });

 async pay() {
  const username = (localStorage.getItem('username') ?? '').toLowerCase();
    const ref = (localStorage.getItem('id') ?? '').toLowerCase();

const response = await this.payment
  .createPayment(this.booking.EstimatedTotal, ref, username)
  .toPromise();

await Browser.open({ url: response.paymentUrl, toolbarColor: '#000' });

Browser.addListener('browserFinished', async () => {
  console.log('Back from OZOW...');
  const status = await this.payment.checkStatus(ref).toPromise();
  console.log('Status:', status?.status);
});
    
  }

}
