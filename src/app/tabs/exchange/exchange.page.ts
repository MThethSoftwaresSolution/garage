import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { IonicModule, NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const google: any;

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.page.html',
  styleUrls: ['./exchange.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ExchangePage implements OnInit {
  bookingId = '';
  exchange: any = null;

  autocompleteService: any;

  meetingDate = '';
  meetingTime = '';

  location = '';
  selectedPlaceId = '';
  selectedLat = 0;
  selectedLng = 0;

  placePredictions: any[] = [];
  searchingPlaces = false;

  images: string[] = [];
  checkoutImages: string[] = [];
  checkinImages: string[] = [];

  notes = '';
  loading = false;
  submitting = false;
  uploading = false;

  currentUserId = '';

  pickupMileage = '';
pickupFuelLevel = '';
pickupExterior = 'Good';
pickupInterior = 'Good';
pickupHasScratches = false;
pickupHasWarningLights = false;
pickupSpareWheelPresent = true;
pickupJackToolsPresent = true;
pickupKeysGiven = 1;

returnMileage = '';
returnFuelLevel = '';
returnExterior = 'Good';
returnInterior = 'Good';
returnNewDamageDetected = false;
returnMissingItems = false;
returnEstimatedDamageAmount = '';
returnKeysReturned = 1;

fuelLevels = [
  'Empty',
  '1/4',
  'Half',
  '3/4',
  'Full'
];

conditionOptions = [
  'Excellent',
  'Good',
  'Fair',
  'Damaged'
];

  constructor(
    private route: ActivatedRoute,
    private service: MainService,
    private nav: NavController
  ) {}

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';

    const userRaw = localStorage.getItem('currentUser');

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        this.currentUserId = user?.id || '';
      } catch {
        this.currentUserId = '';
      }
    }

    setTimeout(() => {
      this.initGooglePlaces();
    }, 600);

    this.loadExchange();
  }

  initGooglePlaces() {
    if (typeof google === 'undefined' || !google?.maps?.places) {
      console.warn('Google Places script not loaded yet.');
      return;
    }

    this.autocompleteService = new google.maps.places.AutocompleteService();
  }

  handleRefresh(event: any) {
    this.loadExchange(() => event.target.complete());
  }

  goBack() {
    this.nav.back();
  }

  loadExchange(done?: () => void) {
    this.loading = true;

    this.service.getExchange(this.bookingId).subscribe({
      next: (res: any) => {
        this.exchange = res;
        this.checkoutImages = this.safeParseImages(res?.checkOutImagesJson);
        this.checkinImages = this.safeParseImages(res?.checkInImagesJson);
        this.loading = false;
        done?.();
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.exchange = null;
        }

        this.checkoutImages = [];
        this.checkinImages = [];
        this.loading = false;
        done?.();
      }
    });
  }

  safeParseImages(value: any): string[] {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

 onLocationInput(event: any) {
  const value =
    event?.detail?.value ||
    event?.target?.value ||
    this.location ||
    '';

  this.location = value;
  this.selectedPlaceId = '';
  this.selectedLat = 0;
  this.selectedLng = 0;

  if (!value || value.trim().length < 2) {
    this.placePredictions = [];
    this.searchingPlaces = false;
    return;
  }

  if (!this.autocompleteService) {
    this.initGooglePlaces();
  }

  if (!this.autocompleteService) {
    this.placePredictions = [];
    this.searchingPlaces = false;
    return;
  }

  this.searchingPlaces = true;

  this.autocompleteService.getPlacePredictions(
    {
      input: value,
      componentRestrictions: {
        country: 'za'
      }
    },
    (predictions: any[] | null) => {
      this.placePredictions = predictions || [];
      this.searchingPlaces = false;
    }
  );
}

  selectPlace(place: any) {
    this.location = place.description;
    this.selectedPlaceId = place.place_id;
    this.placePredictions = [];
  }

  isDriver(): boolean {
    return this.exchange?.driverId === this.currentUserId;
  }

  isHost(): boolean {
    return this.exchange?.hostId === this.currentUserId;
  }

  getStatusLabel(): string {
    switch (this.exchange?.status) {
      case 'PENDING': return 'Awaiting confirmation';
      case 'CONFIRMED': return 'Meeting confirmed';
      case 'CHECKOUT_DONE': return 'Trip active';
      case 'COMPLETED': return 'Completed';
      default: return 'Not started';
    }
  }

  getStatusClass(): string {
    switch (this.exchange?.status) {
      case 'PENDING': return 'pending';
      case 'CONFIRMED': return 'confirmed';
      case 'CHECKOUT_DONE': return 'active';
      case 'COMPLETED': return 'completed';
      default: return 'new';
    }
  }

  canStartExchange(): boolean {
    return !!this.meetingDate &&
      !!this.meetingTime &&
      !!this.location &&
      !!this.selectedPlaceId &&
      !this.submitting;
  }

  startExchange() {
    if (!this.canStartExchange()) {
      alert('Please select meeting date, time and a Google place.');
      return;
    }

    const dateTime = new Date(`${this.meetingDate}T${this.meetingTime}`);

    const payload = {
      bookingId: this.bookingId,
      proposedBy: 'driver',
      meetingDateTime: dateTime,
      locationName: this.location,
      placeId: this.selectedPlaceId,
      lat: this.selectedLat,
      lng: this.selectedLng
    };

    this.submitting = true;

    this.service.startExchange(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.images = [];
        this.notes = '';
        this.loadExchange();
      },
      error: (err: any) => {
        this.submitting = false;
        alert(err?.error || 'Failed to start exchange.');
      }
    });
  }

  accept() {
    this.submitting = true;

    this.service.respondExchange({
      bookingId: this.bookingId,
      accept: true
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.loadExchange();
      },
      error: (err: any) => {
        this.submitting = false;
        alert(err?.error || 'Failed to accept exchange.');
      }
    });
  }

  reject() {
    this.submitting = true;

    this.service.respondExchange({
      bookingId: this.bookingId,
      accept: false
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.loadExchange();
      },
      error: (err: any) => {
        this.submitting = false;
        alert(err?.error || 'Failed to reject exchange.');
      }
    });
  }

  checkout() {
    if (!this.isDriver()) {
      alert('Only the driver can complete pickup.');
      return;
    }

    if (this.images.length < 4) {
      alert('Please upload at least 4 pickup photos.');
      return;
    }

    this.submitting = true;

this.service.driverCheckout({
  bookingId: this.bookingId,
  images: this.images,
  notes: this.notes,

  pickupMileage: this.pickupMileage
    ? Number(this.pickupMileage)
    : null,

  pickupFuelLevel: this.pickupFuelLevel,

  pickupExteriorCondition: this.pickupExterior,

  pickupInteriorCondition: this.pickupInterior,

  hasScratches: this.pickupHasScratches,

  hasWarningLights: this.pickupHasWarningLights,

  spareWheelPresent: this.pickupSpareWheelPresent,

  jackToolsPresent: this.pickupJackToolsPresent,

  keysGiven: this.pickupKeysGiven
    ? Number(this.pickupKeysGiven)
    : null,

  pickupLat: this.selectedLat || null,

  pickupLng: this.selectedLng || null

}).subscribe({
  next: () => {
    this.submitting = false;
    alert('Pickup completed.');

    this.images = [];
    this.notes = '';

    this.loadExchange();
  },
  error: (error: any) => {
    this.submitting = false;

    alert(error?.error || 'Pickup failed.');
  }
});
  }

  checkin() {
    if (!this.isHost()) {
      alert('Only the host can complete return.');
      return;
    }

    if (this.images.length < 4) {
      alert('Please upload at least 4 return photos.');
      return;
    }

    this.submitting = true;

this.service.hostCheckin({
  bookingId: this.bookingId,
  images: this.images,
  notes: this.notes,

  returnMileage: this.returnMileage ? Number(this.returnMileage) : null,
  returnFuelLevel: this.returnFuelLevel,
  returnExteriorCondition: this.returnExterior,
  returnInteriorCondition: this.returnInterior,

  newDamageDetected: this.returnNewDamageDetected,
  missingItems: this.returnMissingItems,
  estimatedDamageAmount: this.returnEstimatedDamageAmount
    ? Number(this.returnEstimatedDamageAmount)
    : null,
  keysReturned: this.returnKeysReturned ? Number(this.returnKeysReturned) : null,

  returnLat: this.selectedLat || null,
  returnLng: this.selectedLng || null
}).subscribe({
  next: () => {
    this.submitting = false;
    alert('Return completed.');
    this.images = [];
    this.notes = '';
    this.loadExchange();
  },
  error: (error: any) => {
    this.submitting = false;
    alert(error?.error || 'Return failed.');
  }
});
  }

  async takePhoto() {
    try {
      this.uploading = true;

      const image = await Camera.getPhoto({
        quality: 70,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      const response = await fetch(image.webPath!);
      const blob = await response.blob();

      this.service.uploadImage(blob).subscribe({
        next: (res: any) => {
          this.images.push(res.url);
          this.uploading = false;
        },
        error: () => {
          this.uploading = false;
          alert('Image upload failed.');
        }
      });
    } catch {
      this.uploading = false;
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }
}