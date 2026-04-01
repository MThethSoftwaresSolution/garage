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

  showFilters = false;

toggleFilters() {
  this.showFilters = !this.showFilters;
}
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

}
