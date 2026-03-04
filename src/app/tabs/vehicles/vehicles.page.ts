import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';

type RatingStatus = 'Excellent' | 'Good' | 'Average' | 'New';

export interface DateRange {
  from: string;  // ISO: YYYY-MM-DD
  until: string; // ISO: YYYY-MM-DD
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
  colorHex: string;

  province: string;
  city: string;
  address: string;

  rate: number; // per day

  bookings?: DateRange[]; // booked date ranges for availability
}

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.page.html',
  styleUrls: ['./vehicles.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class VehiclesPage implements OnInit {
loading = false;

  form!: FormGroup;

  vehicles: VehicleCardVm[] = [];
  filteredVehicles: VehicleCardVm[] = [];

  // simple location banner fields (optional)
  isAddressEntered = true;
  address = 'Your Area';
  isProvince = false;


  constructor(private navCtrl: NavController, private fb: FormBuilder, 
    private router: Router, private service: MainService) { }


        goBack() {
    this.navCtrl.back();
  }

ngOnInit(): void {
    this.form = this.fb.group({
      Location: [''],
      From: [null, Validators.required],
      Until: [null, Validators.required],
    });

    //this.vehicles = this.buildMockVehicles();
debugger;
      this.service.getAcceptedVehicles()
  .subscribe((resp:any)=>{

    this.vehicles = resp;
        this.filteredVehicles = [...this.vehicles];

  });



    // Live-update availability + list as user changes dates (production-friendly UX)
    this.form.valueChanges.subscribe(() => {
      this.applyAvailabilityFilter(false); // show all but badge updates live
    });
  }

  /** Called by your Search button */
  searchByAvailability(): void {
    this.applyAvailabilityFilter(true); // filter to available only
  }

  /** Reset list and form */
  refresh(): void {
    this.form.reset({ Location: '', From: null, Until: null });
    this.filteredVehicles = [...this.vehicles];
  }

  viewVehicle(vehicleId: number): void {
    // Replace with Router navigation if you have a details route:
     this.router.navigate(['tabs/vehicle', vehicleId]);
    //this.navCtrl.navigateForward(['/vehicle', vehicleId]);
    console.log('View vehicle:', vehicleId);
  }

  /** Determines if vehicle is available for selected range */
  isVehicleAvailable(v: VehicleCardVm): boolean {
    const from = this.getSelectedDate('From');
    const until = this.getSelectedDate('Until');

    // If user hasn’t selected both, treat as available (so they can browse)
    if (!from || !until) return true;

    const start = this.toDateOnlyMs(from);
    const end = this.toDateOnlyMs(until);

    // Invalid range: treat as unavailable
    if (end < start) return false;

    const bookings = v.bookings ?? [];
    for (const b of bookings) {
      const bStart = this.toDateOnlyMs(b.from);
      const bEnd = this.toDateOnlyMs(b.until);

      // Overlap: [start,end] overlaps [bStart,bEnd] if start <= bEnd && bStart <= end
      if (start <= bEnd && bStart <= end) return false;
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
    // Basic “loading” simulation hook (remove if not needed)
    this.loading = true;

    // Use microtask to allow spinner paint
    Promise.resolve().then(() => {
      if (!availableOnly) {
        this.filteredVehicles = [...this.vehicles];
      } else {
        this.filteredVehicles = this.vehicles.filter(v => this.isVehicleAvailable(v));
      }
      this.loading = false;
    });
  }

  private getSelectedDate(controlName: 'From' | 'Until'): Date | null {
    const raw = this.form.get(controlName)?.value;

    if (!raw) return null;

    // Support:
    // - HTML date input => "YYYY-MM-DD"
    // - Date object (some datepickers)
    if (raw instanceof Date) return raw;

    // If it’s a string date
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  private toDateOnlyMs(d: string | Date): number {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  }

  private buildMockVehicles(): VehicleCardVm[] {
    return [
      {
        vehicleId: 101,
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        vehicleFullName: 'Toyota Corolla SE (2020)',
        // Wikimedia "Special:FilePath" = direct image redirect
        vehicleFirstImage:
          'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE,%20front%202.29.20.jpg',
        rating: 4.7,
        ratingStatus: 'Excellent',
        isVettedHost: true,
        colorName: 'White',
        colorHex: '#FFFFFF',
        province: 'Gauteng',
        city: 'Johannesburg',
        address: 'Sandton, Rivonia Rd',
        rate: 650,
        bookings: [
          { from: '2026-02-06', until: '2026-02-09' },
          { from: '2026-02-15', until: '2026-02-18' },
        ],
      },
      {
        vehicleId: 102,
        make: 'Volkswagen',
        model: 'Polo',
        year: 2019,
        vehicleFullName: 'VW Polo (Silver Edition)',
        vehicleFirstImage:
          'https://commons.wikimedia.org/wiki/Special:FilePath/VW%20Polo%20IV%20Facelift%20Silver%20Edition%2020090620%20front.JPG',
        rating: 4.5,
        ratingStatus: 'Good',
        isVettedHost: true,
        colorName: 'Silver',
        colorHex: '#C0C0C0',
        province: 'Western Cape',
        city: 'Cape Town',
        address: 'Sea Point, Main Rd',
        rate: 700,
        bookings: [{ from: '2026-02-04', until: '2026-02-07' }],
      },
      {
        vehicleId: 103,
        make: 'Ford',
        model: 'Ranger Wildtrak',
        year: 2024,
        vehicleFullName: 'Ford Ranger Wildtrak (2024)',
        vehicleFirstImage:
          'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Ford%20Ranger%20Wildtrak%20X%20EcoBlue%204x4%20-%201996cc%202.0%20(205PS)%20Diesel%20-%20Blue%20Lightning%20-%2002-2025,%20Front.jpg',
        rating: 4.8,
        ratingStatus: 'Excellent',
        isVettedHost: true,
        colorName: 'Blue',
        colorHex: '#1E5AA8',
        province: 'KwaZulu-Natal',
        city: 'Durban',
        address: 'Umhlanga, Gateway',
        rate: 1200,
        bookings: [],
      },
      {
        vehicleId: 104,
        make: 'BMW',
        model: '3 Series (F30)',
        year: 2015,
        vehicleFullName: 'BMW 3 Series F30 (2015)',
        vehicleFirstImage:
          'https://commons.wikimedia.org/wiki/Special:FilePath/White%20BMW%20335i%20xDrive%20(F30).jpg',
        rating: null,
        ratingStatus: 'New',
        isVettedHost: false,
        colorName: 'White',
        colorHex: '#FFFFFF',
        province: 'Gauteng',
        city: 'Pretoria',
        address: 'Hatfield, Burnett St',
        rate: 1400,
        bookings: [{ from: '2026-02-20', until: '2026-02-25' }],
      },
    ];
  }

}
