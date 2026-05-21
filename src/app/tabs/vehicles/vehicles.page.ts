import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';

type RatingStatus = 'Excellent' | 'Good' | 'Average' | 'New';

export interface DateRange {
  from: string;
  until: string;
}

export interface VehicleCardVm {
  vehicleId: number;

  make: string;
  model: string;
  year: number;

  vehicleFullName: string;
  vehicleFirstImage?: string | null;

  rating?: number | null;
  ratingStatus?: RatingStatus | null;
  isVettedHost?: boolean;

  colorName: string;
  colorHex?: string;

  province: string;
  city: string;
  address: string;

  rate: number;

  bookings?: DateRange[];
}

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class VehiclesPage implements OnInit {

  showFilters = false;
  loading = false;

  form!: FormGroup;

  vehicles: VehicleCardVm[] = [];
  filteredVehicles: VehicleCardVm[] = [];

  constructor(
    private navCtrl: NavController,
    private fb: FormBuilder,
    private router: Router,
    private service: MainService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      Location: [''],
      From: [null, Validators.required],
      Until: [null, Validators.required]
    });

    this.loadVehicles();

    this.form.valueChanges.subscribe(() => {
      this.applyAvailabilityFilter(false);
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  goBack() {
    this.navCtrl.back();
  }

  loadVehicles(event?: any) {
    this.loading = true;

    this.service.getAcceptedVehicles().subscribe({
      next: (resp: any[]) => {
        this.vehicles = (resp || []).map((v: any) => this.normalizeVehicle(v));
        this.filteredVehicles = [...this.vehicles];

        this.loading = false;
        event?.target?.complete?.();
      },
      error: async (e: any) => {
        this.loading = false;
        event?.target?.complete?.();

        await this.presentToast(
          e?.error || 'Failed to load vehicles',
          'danger'
        );
      }
    });
  }

  searchByAvailability(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.applyAvailabilityFilter(true);
  }

  refresh(): void {
    this.form.reset({
      Location: '',
      From: null,
      Until: null
    });

    this.filteredVehicles = [...this.vehicles];
  }

  viewVehicle(vehicleId: number): void {
    this.router.navigate(['tabs/vehicle', vehicleId]);
  }

  isVehicleAvailable(v: VehicleCardVm): boolean {
    const from = this.getSelectedDate('From');
    const until = this.getSelectedDate('Until');

    if (!from || !until) {
      return true;
    }

    const start = this.toDateOnlyMs(from);
    const end = this.toDateOnlyMs(until);

    if (end < start) {
      return false;
    }

    const bookings = v.bookings ?? [];

    for (const b of bookings) {
      const bStart = this.toDateOnlyMs(b.from);
      const bEnd = this.toDateOnlyMs(b.until);

      if (start <= bEnd && bStart <= end) {
        return false;
      }
    }

    return true;
  }

  availabilityText(v: VehicleCardVm): 'Available' | 'Unavailable' {
    return this.isVehicleAvailable(v) ? 'Available' : 'Unavailable';
  }

  availabilityIcon(v: VehicleCardVm): string {
    return this.isVehicleAvailable(v) ? 'checkmark-circle' : 'close-circle';
  }

  availabilityBadgeClass(v: VehicleCardVm): string {
    return this.isVehicleAvailable(v) ? 'badge-available' : 'badge-unavailable';
  }

  private applyAvailabilityFilter(availableOnly: boolean): void {
    this.loading = true;

    Promise.resolve().then(() => {
      const location = String(this.form.get('Location')?.value || '')
        .toLowerCase()
        .trim();

      let result = [...this.vehicles];

      if (location) {
        result = result.filter(v => {
          const haystack = `
            ${v.vehicleFullName || ''}
            ${v.province || ''}
            ${v.city || ''}
            ${v.address || ''}
          `.toLowerCase();

          return haystack.includes(location);
        });
      }

      if (availableOnly) {
        result = result.filter(v => this.isVehicleAvailable(v));
      }

      this.filteredVehicles = result;
      this.loading = false;
    });
  }

  private normalizeVehicle(v: any): VehicleCardVm {
    const make = v.make || v.vehicleMake || '';
    const model = v.model || v.vehicleModel || '';
    const year = Number(v.year || 0);

    return {
      vehicleId: v.vehicleId || v.id,

      make,
      model,
      year,

      vehicleFullName:
        v.vehicleFullName ||
        `${year ? year + ' ' : ''}${make} ${model}`.trim() ||
        'Garage Vehicle',

      vehicleFirstImage:
        v.vehicleFirstImage ||
        v.coverImage ||
        './assets/default.jpg',

      rating: v.rating ?? null,
      ratingStatus: v.ratingStatus || 'New',
      isVettedHost: v.isVettedHost ?? v.vetted ?? false,

      colorName: v.colorName || v.color || 'N/A',
      colorHex: v.colorHex || '#111111',

      province: v.province || '',
      city: v.city || '',
      address: v.address || '',

      rate: Number(v.rate || 0),

      bookings: v.bookings || []
    };
  }

  private getSelectedDate(controlName: 'From' | 'Until'): Date | null {
    const raw = this.form.get(controlName)?.value;

    if (!raw) {
      return null;
    }

    if (raw instanceof Date) {
      return raw;
    }

    const d = new Date(raw);

    return isNaN(d.getTime()) ? null : d;
  }

  private toDateOnlyMs(d: string | Date): number {
    const dt = typeof d === 'string' ? new Date(d) : d;

    return new Date(
      dt.getFullYear(),
      dt.getMonth(),
      dt.getDate()
    ).getTime();
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