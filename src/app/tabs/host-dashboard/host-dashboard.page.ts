import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import {
  ActionSheetController,
  IonicModule,
  ModalController,
  NavController,
  ToastController
} from '@ionic/angular';

import { Router } from '@angular/router';

import {
  Camera,
  CameraResultType,
  CameraSource
} from '@capacitor/camera';

import { register } from 'swiper/element/bundle';

import {
  MainService,
  VehicleImage
} from 'src/app/services/main.service';

import { environment } from 'src/environments/environment';

register();

declare const google: any;
export const vinValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = String(control.value || '').toUpperCase().trim();

  if (!value) return null;

  const validVinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

  if (!validVinRegex.test(value)) {
    return {
      invalidVin: true
    };
  }

  return null;
};

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.page.html',
  styleUrls: ['./host-dashboard.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class HostDashboardPage implements OnInit {

  loading = false;
  loadingList = false;
  showForm = false;

  vehicleHost: any[] = [];

  provinces: any[] = [];
  makes: any[] = [];
  models: any[] = [];
  years: any[] = [];
  odometers: any[] = [];
  colors: any[] = [];
  transmissions: any[] = [];
  isEditMode = false;
editingVehicleId: string | null = null;

  userId = '';
  showVinExample = false;

  tLongitude: number | null = null;
  tLatitude: number | null = null;

  address = '';
  selectedProvinceName = '';

  isOwner = false;

  autocomplete: any;
  vehicleDocsUploading: any = {
  licenceDiscFile: false,
  numPlateFile: false,
  insurancePolicyDocument: false,
  trackerCertificateDocument: false
};

  form = new FormGroup({
    CountryId: new FormControl(1, [Validators.required]),

    Location: new FormControl('', [Validators.required]),
    City: new FormControl(''),
    PostalCode: new FormControl(''),

    VN: new FormControl('WVWZZZ1JZXW000001', [
  Validators.required,
  vinValidator
]),

    Year: new FormControl('', [Validators.required]),
    Make: new FormControl('', [Validators.required]),
    Model: new FormControl('', [Validators.required]),
    Odometer: new FormControl('', [Validators.required]),
    NumberPlate: new FormControl('', [Validators.required]),
    Color: new FormControl('', [Validators.required]),
    Transmission: new FormControl('', [Validators.required]),

    MarketValue: new FormControl(0, [Validators.required]),
    VehicleValueAmount: new FormControl(0, [Validators.required]),

    OwnerIdNumber: new FormControl('', [Validators.required]),
    OwnerName: new FormControl('', [Validators.required]),
    OwnerSurname: new FormControl('', [Validators.required]),
    OwnerEmail: new FormControl('', [Validators.required, Validators.email]),
    OwnerCellNumber: new FormControl('', [Validators.required]),

    LicenceDiscFile: new FormControl('', [Validators.required]),
NumPlateFile: new FormControl(''),

IsInsured: new FormControl(false),
InsurancePolicyDocument: new FormControl(''),

IsTracker: new FormControl(false),
IsTrackerFitted: new FormControl(false),
TrackerCompany: new FormControl(''),
TrackerCertificateDocument: new FormControl(''),

DiscDescription: new FormControl('')

  });

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private service: MainService
  ) {}

  ngOnInit() {
    const currentUserRaw = localStorage.getItem('currentUser');

    if (currentUserRaw) {
      const currentUser = JSON.parse(currentUserRaw);
      this.userId = currentUser.id;
    }

    this.transmissions = [
      { label: 'Manual', value: 'Manual' },
      { label: 'Automatic', value: 'Automatic' }
    ];

    this.years = this.buildYears(2000, new Date().getFullYear());

    this.loadDropdowns();
    this.loadHostedCars();
  }

  goBack() {
    this.navCtrl.back();
  }

  toggleForm() {
    this.showForm = !this.showForm;

    if (this.showForm) {
      setTimeout(() => {
        this.initGooglePlaces();
      }, 500);
    }
  }

  formatVin() {
  const value = String(this.form.get('VN')?.value || '')
    .toUpperCase()
    .replace(/\s/g, '')
    .trim();

  this.form.patchValue(
    {
      VN: value
    },
    { emitEvent: false }
  );
}

  private buildYears(min: number, max: number) {
    const arr: Array<{ label: string; value: number }> = [];

    for (let y = max; y >= min; y--) {
      arr.push({
        label: String(y),
        value: y
      });
    }

    return arr;
  }

 uploadVehicleDocument(event: any, controlName: string, uploadKey: string) {
  const file = event.target.files?.[0];

  if (!file) return;

  this.vehicleDocsUploading[uploadKey] = true;

  this.service.uploadVehicleDocument(file).subscribe({
    next: async (res: any) => {
      this.vehicleDocsUploading[uploadKey] = false;

      const path =
        res?.filePath ||
        res?.path ||
        res?.url ||
        '';

      this.form.patchValue({
        [controlName]: path
      });

      event.target.value = '';

      await this.presentToast('Document uploaded successfully.', 'success');
    },
    error: async (e: any) => {
      this.vehicleDocsUploading[uploadKey] = false;
      event.target.value = '';

      await this.presentToast(
        e?.error || 'Document upload failed.',
        'danger'
      );
    }
  });
}

editVehicle(vehicle: any) {
  this.isEditMode = true;
  this.editingVehicleId = vehicle.id;
  this.showForm = true;

  this.tLatitude = vehicle.latitude || null;
  this.tLongitude = vehicle.longitude || null;
  this.address = vehicle.address || vehicle.streetAddress || '';
  this.selectedProvinceName = '';

  this.form.patchValue({
    CountryId: 1,

    Location: vehicle.address || vehicle.streetAddress || '',
    City: vehicle.city || '',
    PostalCode: vehicle.postalCode || '',

    VN: vehicle.vn || vehicle.vN || '',
    Year: vehicle.year || '',
    Make: vehicle.makeId || vehicle.vehicleMakeId || '',
    Model: vehicle.modelId || vehicle.vehicleModelId || '',
    Odometer: vehicle.odometerId || vehicle.vehicleOdometerId || '',
    NumberPlate: vehicle.numberPlate || '',
    Color: vehicle.colorId || '',
    Transmission: vehicle.transmission || '',

    MarketValue: vehicle.rate || vehicle.marketValue || 0,
    VehicleValueAmount: vehicle.vehicleValueAmount || 0,

    OwnerIdNumber: vehicle.ownerIdNumber || '',
    OwnerName: vehicle.ownerFirstName || vehicle.ownerName || '',
    OwnerSurname: vehicle.ownerSurname || '',
    OwnerEmail: vehicle.ownerEmail || '',
    OwnerCellNumber: vehicle.ownerCellNumber || '',

    LicenceDiscFile: vehicle.licenceDiscFile || '',
    NumPlateFile: vehicle.numPlateFile || '',
    InsurancePolicyDocument: vehicle.insurancePolicyDocument || '',

    IsInsured: vehicle.isInsured === true,
    IsTracker: vehicle.isTracker === true,
    IsTrackerFitted: vehicle.isTrackerFitted === true,

    DiscDescription: vehicle.discDescription || '',

    TrackerCompany: vehicle.trackerCompany || '',
    TrackerCertificateDocument: vehicle.trackerCertificateDocument || ''
  });

  if (this.form.value.Make) {
    this.searchModel(this.form.value.Make);

    setTimeout(() => {
      this.form.patchValue({
        Model: vehicle.modelId || vehicle.vehicleModelId || ''
      });
    }, 500);
  }

  setTimeout(() => {
    this.initGooglePlaces();
  }, 500);
}

  private loadDropdowns() {
    this.service.getColors().subscribe({
      next: (resp: any) => {
        this.colors = resp.map((t: any) => ({
          label: t.color,
          value: t.vehicleColorId
        }));
      },
      error: async (e: any) => {
        await this.presentToast(e?.error || 'Failed to load colors', 'danger');
      }
    });

    this.service.getProvinces().subscribe({
      next: (resp: any) => {
        this.provinces = resp.map((t: any) => ({
          label: t.name,
          value: t.id
        }));
      },
      error: async (e: any) => {
        await this.presentToast(e?.error || 'Failed to load provinces', 'danger');
      }
    });

    this.service.getVehicleMakes().subscribe({
      next: (resp: any) => {
        this.makes = resp.map((t: any) => ({
          label: t.vehicleMakeName,
          value: t.vehicleMakeId
        }));
      },
      error: async (e: any) => {
        await this.presentToast(e?.error || 'Failed to load makes', 'danger');
      }
    });

    this.service.getOdometers().subscribe({
      next: (resp: any) => {
        this.odometers = resp.map((t: any) => ({
          label: t.odometer,
          value: t.vehicleOdometerId
        }));
      },
      error: async (e: any) => {
        await this.presentToast(e?.error || 'Failed to load odometers', 'danger');
      }
    });
  }

  cancelEdit() {
  this.isEditMode = false;
  this.editingVehicleId = null;
  this.showVinExample = false;
  this.isOwner = false;

  this.form.reset({
    CountryId: 1,
    VN: '',
    MarketValue: 0,
    VehicleValueAmount: 0,
    IsInsured: false,
    IsTracker: false,
    IsTrackerFitted: false
  });

  this.address = '';
  this.selectedProvinceName = '';
  this.tLatitude = null;
  this.tLongitude = null;
}

  loadHostedCars(event?: any) {
    if (!this.userId) {
      event?.target?.complete?.();
      return;
    }

    this.loadingList = true;

    this.service.getVehicleHost(this.userId).subscribe({
      next: (res: any[]) => {
        this.vehicleHost = res || [];
        this.loadingList = false;
        event?.target?.complete?.();
      },
      error: async (e: any) => {
        this.loadingList = false;
        event?.target?.complete?.();
        await this.presentToast(e?.error || 'Failed to load hosted cars', 'danger');
      }
    });
  }

  searchModel(makeId: any) {
    this.models = [];

    this.form.patchValue({
      Model: ''
    });

    if (!makeId) {
      return;
    }

    this.service.getVehicleModelsByMake(makeId).subscribe({
      next: (resp: any) => {
        this.models = resp.map((t: any) => ({
          label: t.modelName,
          value: t.vehicleModelId
        }));
      },
      error: async (e: any) => {
        await this.presentToast(e?.error || 'Failed to load models', 'danger');
      }
    });
  }

  onOwnerCheckboxChange(event: any) {
    this.isOwner = event.detail.checked;

    if (this.isOwner) {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

      this.form.patchValue({
        OwnerIdNumber: user.idNumber || '',
        OwnerName: user.firstName || '',
        OwnerSurname: user.lastName || '',
        OwnerEmail: user.email || '',
        OwnerCellNumber: user.phoneNumber || ''
      });

      return;
    }

    this.form.patchValue({
      OwnerIdNumber: '',
      OwnerName: '',
      OwnerSurname: '',
      OwnerEmail: '',
      OwnerCellNumber: ''
    });
  }

  async initGooglePlaces() {
    if (typeof google === 'undefined') {
      console.warn('Google Places script not loaded.');
      return;
    }

    const ionInput = document.getElementById('garage-location-search') as any;

    if (!ionInput) {
      return;
    }

    const inputElement = await ionInput.getInputElement();

    if (!inputElement) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(inputElement, {
      componentRestrictions: {
        country: 'za'
      },
      fields: [
        'formatted_address',
        'geometry',
        'address_components'
      ]
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || '';

      this.tLatitude = lat;
      this.tLongitude = lng;
      this.address = formattedAddress;

      this.form.patchValue({
        Location: formattedAddress
      });

      this.patchAddressParts(place.address_components || []);
    });
  }

  patchAddressParts(components: any[]) {
    let city = '';
    let postalCode = '';
    let province = '';

    for (const component of components) {
      const types = component.types || [];

      if (
        types.includes('locality') ||
        types.includes('administrative_area_level_2') ||
        types.includes('sublocality')
      ) {
        city = city || component.long_name;
      }

      if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }

      if (types.includes('administrative_area_level_1')) {
        province = component.long_name;
      }
    }

    this.selectedProvinceName = province;

    this.form.patchValue({
      City: city || '',
      PostalCode: postalCode || ''
    });
  }

  private getProvinceIdFromPlace(): number {
    if (!this.selectedProvinceName || this.provinces.length === 0) {
      return 1;
    }

    const cleanedProvince = this.selectedProvinceName
      .toLowerCase()
      .replace('province', '')
      .trim();

    const found = this.provinces.find((p: any) =>
      String(p.label).toLowerCase().includes(cleanedProvince) ||
      cleanedProvince.includes(String(p.label).toLowerCase())
    );

    return found?.value || 1;
  }

  statusText(v: any): string {
    if (v.isRejected || v.rejected) {
      return 'Rejected';
    }

    return v.accepted ? 'Approved' : 'Pending';
  }

  statusColor(v: any): string {
    if (v.isRejected || v.rejected) {
      return 'danger';
    }

    return v.accepted ? 'success' : 'warning';
  }

  async openImages(vehicle: any) {
    const modal = await this.modalCtrl.create({
      component: HostImagesModalComponent,
      componentProps: {
        vehicleId: vehicle.id,
        title: `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      },
      breakpoints: [0, 0.5, 0.85, 1],
      initialBreakpoint: 0.85
    });

    await modal.present();
  }

  async listCar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      await this.presentToast(
        'Please complete all required fields',
        'warning'
      );

      return;
    }

    if (!this.tLatitude || !this.tLongitude) {
      await this.presentToast(
        'Please select a valid location from the Google suggestions.',
        'warning'
      );

      return;
    }

    this.loading = true;

    const payload = {
      Reference: this.userId,
      UserId: this.userId,

      CountryId: 1,
      ProvinceId: this.getProvinceIdFromPlace(),

      StreetAddress: this.address || this.form.value.Location,
      City: this.form.value.City || '',
      PostalCode: this.form.value.PostalCode || '',

      Year: Number(this.form.value.Year),
      MakeId: this.form.value.Make,
      ModelId: this.form.value.Model,
      OdometerId: this.form.value.Odometer,

      VN: this.form.value.VN,
      NumberPlate: this.form.value.NumberPlate,
      Transmission: this.form.value.Transmission,

      MarketValue: Number(this.form.value.MarketValue),
      VehicleValueAmount: Number(this.form.value.VehicleValueAmount),

      OwnerIdNumber: this.form.value.OwnerIdNumber,
      OwnerName: this.form.value.OwnerName,
      OwnerSurname: this.form.value.OwnerSurname,
      OwnerEmail: this.form.value.OwnerEmail,
      OwnerCellNumber: this.form.value.OwnerCellNumber,

      ColorId: this.form.value.Color,

      Address: this.address || this.form.value.Location,
      Latitude: this.tLatitude,
      Longitude: this.tLongitude,

      LicenceDiscFile: this.form.value.LicenceDiscFile,
      NumPlateFile: this.form.value.NumPlateFile,
      InsurancePolicyDocument: this.form.value.InsurancePolicyDocument,

      IsInsured: this.form.value.IsInsured === true,
      IsTracker: this.form.value.IsTracker === true,
      IsTrackerFitted: this.form.value.IsTrackerFitted === true,

      DiscDescription: this.form.value.DiscDescription,

      TrackerCompany: this.form.value.TrackerCompany,
      TrackerCertificateDocument: this.form.value.TrackerCertificateDocument,

    };

    const request$ = this.isEditMode && this.editingVehicleId
  ? this.service.updateVehicle(this.editingVehicleId, payload)
  : this.service.saveVehicle(payload);

request$.subscribe({
      next: async () => {
        this.loading = false;

        await this.presentToast(
  this.isEditMode ? 'Vehicle updated successfully!' : 'Vehicle submitted successfully!',
  'success'
);

this.isEditMode = false;
this.editingVehicleId = null;

        this.form.reset({
          CountryId: 1,
          MarketValue: 0,
          VehicleValueAmount: 0
        });

        this.address = '';
        this.selectedProvinceName = '';
        this.tLatitude = null;
        this.tLongitude = null;
        this.showForm = false;

        this.loadHostedCars();
      },
      error: async (e: any) => {
        this.loading = false;

        await this.presentToast(
          e?.error || 'Failed to save vehicle',
          'danger'
        );
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
      duration: 2500,
      position: 'top'
    });

    await toast.present();
  }
}

@Component({
  selector: 'app-host-images-modal',
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>{{ title }}</ion-title>

        <ion-buttons slot="end">
          <ion-button (click)="addImage()">
            <ion-icon name="camera-outline"></ion-icon>
          </ion-button>

          <ion-button (click)="close()">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="load($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-padding">
        <ion-text *ngIf="images.length === 0">
          <p>No images uploaded yet.</p>
        </ion-text>

        <swiper-container
          *ngIf="images.length > 0"
          pagination="true"
          space-between="10"
          slides-per-view="1">

          <swiper-slide *ngFor="let img of images">
            <ion-card>
              <ion-img [src]="img.url"></ion-img>

              <ion-card-content>
                <ion-badge *ngIf="img.isCover" color="success">
                  Cover Image
                </ion-badge>

                <div style="margin-top:10px">
                  <ion-button size="small" fill="outline" color="primary" (click)="setCover(img)">
                    Set Cover
                  </ion-button>

                  <ion-button size="small" fill="outline" color="danger" (click)="deleteImage(img)">
                    Delete
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </swiper-slide>
        </swiper-container>

        <ion-list *ngIf="images.length > 1">
          <ion-reorder-group [disabled]="false" (ionItemReorder)="reorderImages($event)">
            <ion-item *ngFor="let img of images">
              <ion-thumbnail slot="start">
                <ion-img [src]="img.url"></ion-img>
              </ion-thumbnail>

              <ion-reorder slot="end"></ion-reorder>
            </ion-item>
          </ion-reorder-group>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [`
    swiper-container {
      width: 100%;
      height: auto;
    }

    ion-img {
      max-height: 280px;
      object-fit: cover;
    }

    ion-thumbnail {
      --size: 64px;
      --border-radius: 10px;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HostImagesModalComponent implements OnInit {

  vehicleId!: string;
  title = 'Vehicle Images';

  images: VehicleImage[] = [];

  constructor(
    private modalCtrl: ModalController,
    private service: MainService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  async addImage() {
    const action = await this.actionSheetCtrl.create({
      header: 'Add Vehicle Image',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera',
          handler: () => this.captureImage(CameraSource.Camera)
        },
        {
          text: 'Choose From Gallery',
          icon: 'images',
          handler: () => this.captureImage(CameraSource.Photos)
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await action.present();
  }

  async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source
      });

      if (!image.base64String) {
        return;
      }

      const blob = this.base64ToBlob(
        image.base64String,
        `image/${image.format}`
      );

      const formData = new FormData();
      formData.append('vehicleId', this.vehicleId);
      formData.append('file', blob, `vehicle-${Date.now()}.${image.format}`);

      this.service.uploadVehicleImage(formData).subscribe({
        next: async () => {
          await this.presentToast('Image uploaded successfully', 'success');
          this.load();
        },
        error: async () => {
          await this.presentToast('Upload failed', 'danger');
        }
      });

    } catch (e) {
      console.error(e);
    }
  }

  deleteImage(img: VehicleImage) {
    this.service.deleteVehicleImage(img.id).subscribe({
      next: async () => {
        await this.presentToast('Image deleted', 'success');
        this.load();
      },
      error: async () => {
        await this.presentToast('Failed to delete image', 'danger');
      }
    });
  }

  setCover(img: VehicleImage) {
    this.service.setVehicleCoverImage(img.id).subscribe({
      next: async () => {
        await this.presentToast('Cover image updated', 'success');
        this.load();
      },
      error: async () => {
        await this.presentToast('Failed to update cover image', 'danger');
      }
    });
  }

  reorderImages(event: any) {
    const item = this.images.splice(event.detail.from, 1)[0];
    this.images.splice(event.detail.to, 0, item);

    event.detail.complete();

    const payload = this.images.map((x, index) => ({
      id: x.id,
      order: index
    }));

    this.service.reorderVehicleImages(payload).subscribe();
  }

  load(event?: any) {
    this.service.getVehicleImages(this.vehicleId).subscribe({
      next: (resp) => {
        this.images = resp.map((img: VehicleImage) => ({
          ...img,
          url: img.url?.startsWith('http')
            ? img.url
            : environment.baseUrl + img.url
        }));

        event?.target?.complete?.();
      },
      error: async (e: any) => {
        event?.target?.complete?.();
        await this.presentToast(e?.error || 'Failed to load images', 'danger');
      }
    });
  }

  base64ToBlob(base64: string, contentType: string) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: contentType });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' = 'primary'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2200,
      position: 'top'
    });

    await toast.present();
  }
}