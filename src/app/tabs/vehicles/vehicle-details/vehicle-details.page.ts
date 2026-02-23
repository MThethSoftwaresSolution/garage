import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface DateRange {
  from: string;  // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

type HighlightStyle = { textColor?: string; backgroundColor?: string };

// Minimal prediction type (Google returns more fields, we only use these)
type PlacePrediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-vehicle-details',
  templateUrl: './vehicle-details.page.html',
  styleUrls: ['./vehicle-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VehicleDetailsPage implements OnInit, OnDestroy {
  loading = false;

  vehicleId!: number;
  vehicle: any = null;

  vehicleImages: string[] = [];
  bookings: DateRange[] = [];

  form!: FormGroup;

  selectedFrom: string | null = null;
  selectedUntil: string | null = null;

  estimateDays = 0;
  estimateTotal = 0;

  isCurrentlyAvailable = true;

  // -----------------------
  // Google Places Autocomplete
  // -----------------------
  // Replace with your key OR inject via environment
  private readonly GOOGLE_API_KEY = 'AIzaSyDa--3FF5GJlp45yRBB5-nr8icglGEhzqE';
  private readonly COUNTRY_RESTRICTION = 'za'; // South Africa (remove for global)

  pickupPredictions: PlacePrediction[] = [];
  returnPredictions: PlacePrediction[] = [];

  private autoService?: any;   // google.maps.places.AutocompleteService
  private placesService?: any; // google.maps.places.PlacesService

  private pickupInput$ = new Subject<string>();
  private returnInput$ = new Subject<string>();
  private subs = new Subscription();

  slideOpts = {
    initialSlide: 0,
    speed: 300,
  };

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private fb: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    this.vehicleId = Number(this.route.snapshot.paramMap.get('id'));

    this.form = this.fb.group({
      From: [null, Validators.required],
      Until: [null, Validators.required],
      PickupLocation: ['', Validators.required],
      ReturnLocation: ['', Validators.required],
    });

    // Form recalculations
    this.subs.add(
      this.form.valueChanges.subscribe(() => {
        this.syncSelectedDates();
        this.recomputeEstimateAndAvailability();
      })
    );

    // Debounced input streams (prevents API spam)
    this.subs.add(
      this.pickupInput$.pipe(debounceTime(250), distinctUntilChanged()).subscribe((q) => {
        this.fetchPredictions(q, 'pickup');
      })
    );

    this.subs.add(
      this.returnInput$.pipe(debounceTime(250), distinctUntilChanged()).subscribe((q) => {
        this.fetchPredictions(q, 'return');
      })
    );

    // Load Google Places + init services
    await this.ensureGooglePlacesLoaded();
    this.initPlacesServices();

    this.loadVehicle();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  goBack(): void {
    this.navCtrl.back();
  }

  // -----------------------
  // Vehicle load (mock)
  // -----------------------
  private loadVehicle(): void {
    this.loading = true;

    // Replace with API/service call
    Promise.resolve().then(() => {
      this.vehicle = {
        vehicleId: this.vehicleId,
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        rate: 650,
        province: 'Gauteng',
        city: 'Johannesburg',
        address: 'Sandton, Rivonia Rd',
        transmission: 'Automatic',
        odometer: 45000,
        rating: 4.7,
        ratingStatus: 'Excellent',
        isVettedHost: true,
        colorName: 'White',
        colorHex: '#FFFFFF',
        vImages: [
          'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE,%20front%202.29.20.jpg',
          'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE%20rear%202.29.20.jpg'
        ],
        bookings: [
          { from: '2026-02-15', until: '2026-02-18' },
          { from: '2026-02-20', until: '2026-02-25' },
        ] as DateRange[],
      };

      this.vehicleImages = Array.isArray(this.vehicle?.vImages) ? this.vehicle.vImages : [];
      this.bookings = Array.isArray(this.vehicle?.bookings) ? this.vehicle.bookings : [];

      this.loading = false;
      this.recomputeEstimateAndAvailability();
    });
  }

  // -----------------------
  // Date utilities
  // -----------------------
  private normalizeToYmd(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value.slice(0, 10);
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, '0');
      const d = String(value.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  private toMs(ymd: string): number {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }

  private rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    const aS = this.toMs(aStart);
    const aE = this.toMs(aEnd);
    const bS = this.toMs(bStart);
    const bE = this.toMs(bEnd);
    return aS <= bE && bS <= aE;
  }

  private syncSelectedDates(): void {
    this.selectedFrom = this.normalizeToYmd(this.form.get('From')?.value);
    this.selectedUntil = this.normalizeToYmd(this.form.get('Until')?.value);

    if (this.selectedFrom && this.selectedUntil && this.selectedUntil < this.selectedFrom) {
      const tmp = this.selectedFrom;
      this.selectedFrom = this.selectedUntil;
      this.selectedUntil = tmp;
      this.form.patchValue({ From: this.selectedFrom, Until: this.selectedUntil }, { emitEvent: false });
    }
  }

  private isAvailableForRange(from: string, until: string): boolean {
    for (const b of this.bookings) {
      if (this.rangesOverlap(from, until, b.from, b.until)) return false;
    }
    return true;
  }

  private diffDaysInclusive(from: string, until: string): number {
    const ms = this.toMs(until) - this.toMs(from);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return Math.max(1, days === 0 ? 1 : days);
  }

  private recomputeEstimateAndAvailability(): void {
    if (!this.vehicle) return;

    if (!this.selectedFrom || !this.selectedUntil) {
      this.estimateDays = 0;
      this.estimateTotal = 0;
      this.isCurrentlyAvailable = true;
      return;
    }

    this.isCurrentlyAvailable = this.isAvailableForRange(this.selectedFrom, this.selectedUntil);
    this.estimateDays = this.diffDaysInclusive(this.selectedFrom, this.selectedUntil);
    this.estimateTotal = Number(this.vehicle.rate || 0) * this.estimateDays;
  }

  // -----------------------
  // Single calendar selection
  // -----------------------
  onCalendarChange(ev: CustomEvent) {
    const picked = this.normalizeToYmd((ev as any).detail?.value);
    if (!picked) return;

    // New range if none OR already complete
    if (!this.selectedFrom || (this.selectedFrom && this.selectedUntil)) {
      this.selectedFrom = picked;
      this.selectedUntil = null;
      this.form.patchValue({ From: this.selectedFrom, Until: null }, { emitEvent: true });
      return;
    }

    // Set until
    this.selectedUntil = picked;

    // Swap if reversed
    if (this.selectedFrom && this.selectedUntil && this.selectedUntil < this.selectedFrom) {
      const tmp = this.selectedFrom;
      this.selectedFrom = this.selectedUntil;
      this.selectedUntil = tmp;
    }

    this.form.patchValue({ From: this.selectedFrom, Until: this.selectedUntil }, { emitEvent: true });
  }

  clearDates(): void {
    this.selectedFrom = null;
    this.selectedUntil = null;
    this.form.patchValue({ From: null, Until: null }, { emitEvent: true });
  }

  availabilityText(): 'Available' | 'Unavailable' {
    if (!this.selectedFrom || !this.selectedUntil) return 'Available';
    return this.isCurrentlyAvailable ? 'Available' : 'Unavailable';
  }

  availabilityIcon(): string {
    return this.availabilityText() === 'Available' ? 'checkmark-circle' : 'close-circle';
  }

  availabilityBadgeClass(): string {
    return this.availabilityText() === 'Available' ? 'badge-available' : 'badge-unavailable';
  }

  // -----------------------
  // Disable booked dates + prevent crossing bookings
  // -----------------------
  isDateEnabled = (isoString: string) => {
    const day = isoString.slice(0, 10);

    // Always disable dates inside bookings
    for (const b of this.bookings) {
      if (this.toMs(day) >= this.toMs(b.from) && this.toMs(day) <= this.toMs(b.until)) {
        return false;
      }
    }

    // If From selected but Until not yet, disable candidate end dates that would overlap any booking
    if (this.selectedFrom && !this.selectedUntil) {
      const fromCandidate = day < this.selectedFrom ? day : this.selectedFrom;
      const untilCandidate = day < this.selectedFrom ? this.selectedFrom : day;

      for (const b of this.bookings) {
        if (this.rangesOverlap(fromCandidate, untilCandidate, b.from, b.until)) {
          return false;
        }
      }
    }

    return true;
  };

  // -----------------------
  // Highlighted dates
  // -----------------------
  highlightedDates = (isoString: string): HighlightStyle | undefined => {
    const day = isoString.slice(0, 10);

    // Booked styling
    for (const b of this.bookings) {
      if (this.toMs(day) >= this.toMs(b.from) && this.toMs(day) <= this.toMs(b.until)) {
        return {
          backgroundColor: 'var(--ion-color-medium)',
          textColor: 'var(--ion-color-medium-contrast)',
        };
      }
    }

    // Only From selected
    if (this.selectedFrom && !this.selectedUntil) {
      if (day === this.selectedFrom) {
        return {
          backgroundColor: 'var(--ion-color-primary)',
          textColor: 'var(--ion-color-primary-contrast)',
        };
      }
      return undefined;
    }

    // From..Until range selected
    if (this.selectedFrom && this.selectedUntil) {
      const start = this.toMs(this.selectedFrom);
      const end = this.toMs(this.selectedUntil);
      const d = this.toMs(day);

      if (d >= start && d <= end) {
        return {
          backgroundColor: 'var(--ion-color-primary)',
          textColor: 'var(--ion-color-primary-contrast)',
        };
      }
    }

    return undefined;
  };

  // -----------------------
  // Google Places: script loading + services
  // -----------------------
  private ensureGooglePlacesLoaded(): Promise<void> {
    // Already loaded
    if (window.google?.maps?.places) return Promise.resolve();

    // If script already added, wait for it
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-places="true"]');
    if (existing) {
      return new Promise((resolve) => {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => resolve()); // resolve to avoid blocking UI
      });
    }

    // Inject script
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.dataset['googlePlaces'] = 'true';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        this.GOOGLE_API_KEY
      )}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => resolve(); // resolve to avoid blocking UI

      document.head.appendChild(script);
    });
  }

  private initPlacesServices(): void {
    if (!window.google?.maps?.places) return;

    this.autoService = new window.google.maps.places.AutocompleteService();

    // PlacesService requires an element
    const dummy = document.createElement('div');
    this.placesService = new window.google.maps.places.PlacesService(dummy);
  }

  // Called by ionInput (we push into debounced streams)
  onPickupInput(ev: any) {
    const value: string = ev?.target?.value ?? '';
    this.form.patchValue({ PickupLocation: value }, { emitEvent: false });
    this.pickupInput$.next(value);
  }

  onReturnInput(ev: any) {
    const value: string = ev?.target?.value ?? '';
    this.form.patchValue({ ReturnLocation: value }, { emitEvent: false });
    this.returnInput$.next(value);
  }

  private fetchPredictions(query: string, which: 'pickup' | 'return') {
    const q = (query || '').trim();

    if (!q || q.length < 3 || !this.autoService) {
      if (which === 'pickup') this.pickupPredictions = [];
      else this.returnPredictions = [];
      return;
    }

    const request: any = {
      input: q,
      // optional restriction to SA
      componentRestrictions: this.COUNTRY_RESTRICTION ? { country: this.COUNTRY_RESTRICTION } : undefined,
    };

    this.autoService.getPlacePredictions(request, (preds: PlacePrediction[] | null) => {
      const list = preds || [];
      if (which === 'pickup') this.pickupPredictions = list;
      else this.returnPredictions = list;
    });
  }

  selectPickupPrediction(p: PlacePrediction) {
    this.pickupPredictions = [];
    this.fillPlace(p?.place_id, 'PickupLocation');
  }

  selectReturnPrediction(p: PlacePrediction) {
    this.returnPredictions = [];
    this.fillPlace(p?.place_id, 'ReturnLocation');
  }

  private fillPlace(placeId: string, controlName: 'PickupLocation' | 'ReturnLocation') {
    if (!placeId || !this.placesService) return;

    this.placesService.getDetails(
      { placeId, fields: ['formatted_address', 'name'] },
      (place: any, status: any) => {
        const ok = status === window.google.maps.places.PlacesServiceStatus.OK;
        if (!ok || !place) return;

        const full = place.formatted_address || place.name || '';
        this.form.patchValue({ [controlName]: full }, { emitEvent: true });
      }
    );
  }

  // -----------------------
  // Submit
  // -----------------------
  continue(): void {
  // 🔹 Remove focus before navigation
  (document.activeElement as HTMLElement)?.blur();

  this.syncSelectedDates();
  this.recomputeEstimateAndAvailability();

  if (this.form.invalid || !this.vehicle) return;
  if (!this.selectedFrom || !this.selectedUntil) return;
  if (!this.isCurrentlyAvailable) return;

  const model = {
    vehicleId: this.vehicle.vehicleId,
    PickupDate: this.selectedFrom,
    ReturnDate: this.selectedUntil,
    PickupLocation: this.form.value.PickupLocation,
    ReturnLocation: this.form.value.ReturnLocation,
    EstimatedDays: this.estimateDays,
    EstimatedTotal: this.estimateTotal,
    VehicleName: this.vehicle.make + '-'+this.vehicle.model,
    Image: this.vehicle?.vImages[0]
  };

  this.navCtrl.navigateForward('tabs/payments', {
    state: { booking: model }
  });
  }
}
