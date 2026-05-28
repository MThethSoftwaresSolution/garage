import { CommonModule } from '@angular/common';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  IonicModule,
  NavController,
  ToastController
} from '@ionic/angular';

import { ActivatedRoute, Router } from '@angular/router';

import { register } from 'swiper/element/bundle';

import { MainService } from 'src/app/services/main.service';

register();

declare const google: any;

interface DateRange {
  from: string;
  until: string;
}

@Component({
  selector: 'app-vehicle-details',
  templateUrl: './vehicle-details.page.html',
  styleUrls: ['./vehicle-details.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VehicleDetailsPage implements OnInit {

  loading = false;

  vehicleId: any;

  vehicle: any = null;

  vehicleImages: string[] = [];

  bookings: DateRange[] = [];

  form!: FormGroup;

  pickupPredictions: any[] = [];
  returnPredictions: any[] = [];

  autocompleteService: any;

  selectedFrom: string | null = null;
  selectedUntil: string | null = null;

  estimateDays = 0;
  estimateTotal = 0;
  garageFee = 0;
  grandTotal = 0;

  isCurrentlyAvailable = true;

  highlightedDates: any[] = [];
  isAdmin = false;
  isVetted = false;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private fb: FormBuilder,
    private router: Router,
    private service: MainService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {

    this.vehicleId =
      this.route.snapshot.paramMap.get('id');

      this.isAdmin = JSON.parse(localStorage.getItem('isAdmin') || 'false');
      this.isVetted = JSON.parse(localStorage.getItem('isVetted') || 'false');

    this.form = this.fb.group({

      PickupLocation: ['', Validators.required],

      ReturnLocation: ['', Validators.required]

    });

    this.initGooglePlaces();

    this.loadVehicle();

  }
  

canContinueBooking(){

    if (!this.isAdmin && !this.isVetted) {
    this.presentToast(
      'Your profile must be approved before you can continue with booking.',
      'warning'
    );

    this.router.navigateByUrl('/tabs/profile?completeProfile=true');

    return;
  }

  return (this.isAdmin || this.isVetted) &&
    this.form.valid &&
    this.isCurrentlyAvailable;

}

  goBack() {
    this.navCtrl.back();
  }

  loadVehicle() {

    this.loading = true;

    this.service
      .getVehicleDetails(this.vehicleId)
      .subscribe({

        next: (resp: any) => {

          console.log('Vehicle details response:', resp);
          this.vehicle = resp;

this.vehicleImages =
  resp.vImages ||
  resp.images ||
  resp.vehicleImages ||
  [];
          this.bookings =
            resp.bookings ||
            [];

          this.buildHighlightedDates();

          this.loading = false;

        },

        error: async (e: any) => {

          this.loading = false;

          await this.presentToast(
            e?.error || 'Failed to load vehicle',
            'danger'
          );

        }

      });

  }

  initGooglePlaces() {

    if (typeof google === 'undefined') {
      return;
    }

    this.autocompleteService =
      new google.maps.places.AutocompleteService();

  }

  onPickupInput(event: any) {

    const value = event?.target?.value || '';

    if (!value || value.length < 2) {

      this.pickupPredictions = [];

      return;
    }

    this.autocompleteService.getPlacePredictions(
      {
        input: value,
        componentRestrictions: {
          country: 'za'
        }
      },
      (predictions: any[]) => {

        this.pickupPredictions =
          predictions || [];

      }
    );

  }

  onReturnInput(event: any) {

    const value = event?.target?.value || '';

    if (!value || value.length < 2) {

      this.returnPredictions = [];

      return;
    }

    this.autocompleteService.getPlacePredictions(
      {
        input: value,
        componentRestrictions: {
          country: 'za'
        }
      },
      (predictions: any[]) => {

        this.returnPredictions =
          predictions || [];

      }
    );

  }

  selectPickupPrediction(prediction: any) {

    this.form.patchValue({

      PickupLocation:
        prediction.description

    });

    this.pickupPredictions = [];

  }

  selectReturnPrediction(prediction: any) {

    this.form.patchValue({

      ReturnLocation:
        prediction.description

    });

    this.returnPredictions = [];

  }

  async onCalendarChange(event: any) {

    const value = event.detail.value;

    if (!value) {
      return;
    }

    const selectedDate =
      this.formatDate(value);

    if (
      !this.selectedFrom ||
      (this.selectedFrom && this.selectedUntil)
    ) {

      this.selectedFrom = selectedDate;
      this.selectedUntil = null;

      this.calculateEstimate();

      return;
    }

    if (
      this.selectedFrom &&
      !this.selectedUntil
    ) {

      const fromDate =
        new Date(this.selectedFrom);

      const untilDate =
        new Date(selectedDate);

      if (
        untilDate.getTime() <
        fromDate.getTime()
      ) {

        await this.presentToast(
          'Return date cannot be before pickup date.',
          'warning'
        );

        return;
      }

      this.selectedUntil = selectedDate;

      this.calculateEstimate();

    }

  }

clearDates() {
  this.selectedFrom = null;
  this.selectedUntil = null;

  this.estimateDays = 0;
  this.estimateTotal = 0;
  this.garageFee = 0;
  this.grandTotal = 0;

  this.isCurrentlyAvailable = true;

  this.buildHighlightedDates();
}

  calculateEstimate() {

    if (
      !this.selectedFrom ||
      !this.selectedUntil
    ) {

      this.estimateDays = 0;

      this.estimateTotal = 0;

      this.garageFee = 0;

      this.grandTotal = 0;

      this.isCurrentlyAvailable = true;

      return;
    }

    const from =
      new Date(this.selectedFrom);

    const until =
      new Date(this.selectedUntil);

    const diffMs =
      until.getTime() -
      from.getTime();

const days =
  Math.max(
    1,
    Math.ceil(
      diffMs / (1000 * 60 * 60 * 24)
    )
  );

    this.estimateDays = days;

    const rate =
      Number(this.vehicle?.rate || 0);

    this.estimateTotal =
      rate * days;

    this.garageFee =
      this.estimateTotal * 0.12;

    this.grandTotal =
      this.estimateTotal +
      this.garageFee;

    this.isCurrentlyAvailable =
      this.checkAvailability();

      this.buildHighlightedDates();

  }

  checkAvailability(): boolean {

    if (
      !this.selectedFrom ||
      !this.selectedUntil
    ) {
      return true;
    }

    const start =
      this.toDateOnlyMs(
        new Date(this.selectedFrom)
      );

    const end =
      this.toDateOnlyMs(
        new Date(this.selectedUntil)
      );

    for (const booking of this.bookings) {

      const bStart =
        this.toDateOnlyMs(
          new Date(booking.from)
        );

      const bEnd =
        this.toDateOnlyMs(
          new Date(booking.until)
        );

      if (
        start <= bEnd &&
        bStart <= end
      ) {
        return false;
      }

    }

    return true;

  }

buildHighlightedDates() {
  const dates: any[] = [];

  // Booked dates
  for (const booking of this.bookings) {
    const start = new Date(booking.from);
    const end = new Date(booking.until);
    const current = new Date(start);

    while (current.getTime() <= end.getTime()) {
      dates.push({
        date: this.formatDate(current),
        textColor: '#991b1b',
        backgroundColor: '#fee2e2'
      });

      current.setDate(current.getDate() + 1);
    }
  }

  // Selected From only
  if (this.selectedFrom && !this.selectedUntil) {
    dates.push({
      date: this.selectedFrom,
      textColor: '#ffffff',
      backgroundColor: '#000000'
    });
  }

  // Selected range
  if (this.selectedFrom && this.selectedUntil) {
    const start = new Date(this.selectedFrom);
    const end = new Date(this.selectedUntil);
    const current = new Date(start);

    while (current.getTime() <= end.getTime()) {
      dates.push({
        date: this.formatDate(current),
        textColor: '#ffffff',
        backgroundColor: '#000000'
      });

      current.setDate(current.getDate() + 1);
    }
  }

  this.highlightedDates = dates;
}

isDateEnabled = (isoString: string) => {
  const day = this.formatDate(isoString);
  const date = this.toDateOnlyMs(new Date(day));
  const today = this.toDateOnlyMs(new Date());

  if (date < today) {
    return false;
  }

  // Disable already booked dates
  for (const booking of this.bookings) {
    const bStart = this.toDateOnlyMs(new Date(booking.from));
    const bEnd = this.toDateOnlyMs(new Date(booking.until));

    if (date >= bStart && date <= bEnd) {
      return false;
    }
  }

  return true;
};

  continue() {

    if (
      !this.selectedFrom ||
      !this.selectedUntil
    ) {

      this.presentToast(
        'Please select booking dates.',
        'warning'
      );

      return;
    }

    if (!this.isCurrentlyAvailable) {

      this.presentToast(
        'Selected dates are unavailable.',
        'danger'
      );

      return;
    }

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.presentToast(
        'Please complete pickup and return locations.',
        'warning'
      );

      return;
    }

    const bookingPayload = {

      vehicleId: this.vehicleId,

      from: this.selectedFrom,

      until: this.selectedUntil,

      pickupLocation:
        this.form.value.PickupLocation,

      returnLocation:
        this.form.value.ReturnLocation,

      grandTotal:
        this.grandTotal,

      estimatedDays:
        this.estimateDays,

        garageFee: this.garageFee,

        image: this.vehicleImages[0] || null,
        vehicleName: this.vehicle?.make + ' ' + this.vehicle?.model,
        vehicleTotal: this.estimateTotal

    };

    console.log(
      'Booking payload:',
      bookingPayload
    );

this.router.navigate(
  ['/tabs/booking-request'],
  {
    state: {
      booking: bookingPayload
    }
  }
);

  }

  availabilityText():
    'Available' | 'Unavailable' {

    return this.isCurrentlyAvailable
      ? 'Available'
      : 'Unavailable';

  }

  availabilityIcon(): string {

    return this.isCurrentlyAvailable
      ? 'checkmark-circle'
      : 'close-circle';

  }

  availabilityBadgeClass(): string {

    return this.isCurrentlyAvailable
      ? 'badge-available'
      : 'badge-unavailable';

  }

  private formatDate(
    value: any
  ): string {

    const d =
      new Date(value);

    const yyyy =
      d.getFullYear();

    const mm =
      String(
        d.getMonth() + 1
      ).padStart(2, '0');

    const dd =
      String(
        d.getDate()
      ).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;

  }

  private toDateOnlyMs(
    d: Date
  ): number {

    return new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();

  }

  private async presentToast(
    message: string,
    color:
      | 'success'
      | 'warning'
      | 'danger'
      | 'primary' = 'primary'
  ) {

    const toast =
      await this.toastCtrl.create({

        message,

        color,

        duration: 2400,

        position: 'top'

      });

    await toast.present();

  }

}