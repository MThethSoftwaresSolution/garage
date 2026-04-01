import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController, NavController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MainService, VehicleImage } from 'src/app/services/main.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.page.html',
  styleUrls: ['./host-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
})
export class HostDashboardPage implements OnInit {

  loading = false;
  loadingList = false;

  // Toggle form
  showForm = false;

  vehicleHost: Array<any> = [];

  countries: Array<any> = [];
  provinces: Array<any> = [];
  makes: Array<any> = [];
  models: Array<any> = [];
  years: Array<any> = [];
  odometers: Array<any> = [];
  colors: Array<any> = [];
  transmissions: Array<any> = [];

  userId = '';

  tLongitude: any;
  tLatitude: any;
  address = '';

  form = new FormGroup({
    CountryId: new FormControl(1, [Validators.required]),

    Location: new FormControl('', [Validators.required]),
    StreetAddress: new FormControl('', [Validators.required]),
    City: new FormControl('', [Validators.required]),
    Province: new FormControl('', [Validators.required]),
    PostalCode: new FormControl('', [Validators.required]),

    VN: new FormControl(''),
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
    OwnerEmail: new FormControl('', [Validators.required]),
    OwnerCellNumber: new FormControl('', [Validators.required]),
  });

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private service: MainService
  ) {}

  goBack() {
    this.navCtrl.back();
  }

  ngOnInit() {
    debugger;
    // mimic logged-in user
    const currentUserRaw = localStorage.getItem('currentUser');
    if (currentUserRaw) {
      console.log(JSON.parse(currentUserRaw));
      this.userId = JSON.parse(currentUserRaw).id;
    } 

    this.transmissions = [
      { label: 'Manual', value: 'Manual' },
      { label: 'Automatic', value: 'Automatic' }
    ];

    this.years = this.buildYears(2000, 2026);

    this.loadDropdowns();
    this.loadHostedCars();
  }

  isOwner = false;
  onOwnerCheckboxChange(event: any) {

  if (event.detail.checked) {

    this.isOwner = event.detail.checked;
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    this.form.patchValue({
      OwnerIdNumber: user.idNumber,
      OwnerName: user.firstName,
      OwnerSurname: user.lastName,
      OwnerEmail: user.email,
      OwnerCellNumber: user.phoneNumber
    });

  } 
  else {

    this.form.patchValue({
      OwnerIdNumber: '',
      OwnerName: '',
      OwnerSurname: '',
      OwnerEmail: '',
      OwnerCellNumber: ''
    });

  }

}

  private buildYears(min: number, max: number) {
    const arr: Array<{ label: string; value: number }> = [];
    for (let y = max; y >= min; y--) arr.push({ label: String(y), value: y });
    return arr;
  }

  private loadDropdowns() {

    this.service.getColors().subscribe({
      next: (resp: any) => this.colors = resp.map((t: any) => ({ label: t.color, value: t.vehicleColorId })),
      error: async (e: any) => this.presentToast(e?.error || 'Failed to load colors', 'danger'),
    });

    this.service.getProvinces().subscribe({
      next: (resp: any) => this.provinces = resp.map((t: any) => ({ label: t.name, value: t.id })),
      error: async (e: any) => this.presentToast(e?.error || 'Failed to load provinces', 'danger'),
    });

    this.service.getVehicleMakes().subscribe({
      next: (resp: any) => this.makes = resp.map((t: any) => ({ label: t.vehicleMakeName, value: t.vehicleMakeId })),
      error: async (e: any) => this.presentToast(e?.error || 'Failed to load makes', 'danger'),
    });

    this.service.getOdometers().subscribe({
      next: (resp: any) => this.odometers = resp.map((t: any) => ({ label: t.odometer, value: t.vehicleOdometerId })),
      error: async (e: any) => this.presentToast(e?.error || 'Failed to load odometers', 'danger'),
    });
  }

  loadHostedCars(event?: any) {
  this.loadingList = true;

  this.service.getVehicleHost(this.userId)
    .subscribe({
      next: (res) => {
        this.vehicleHost = res;
        this.loadingList = false;
        event?.target?.complete?.();
      },
      error: async (e) => {
        this.loadingList = false;
        event?.target?.complete?.();
        await this.presentToast(e?.error || 'Failed to load hosted cars', 'danger');
      }
    });
}

  /*loadHostedCars(event?: any) {
    this.loadingList = true;
    this.service.getVehicleHost(this.userId).subscribe({
      next: (resp: any) => {
        this.vehicleHost = resp;
        this.loadingList = false;
        event?.target?.complete?.();
      },
      error: async (e: any) => {
        this.loadingList = false;
        event?.target?.complete?.();
        await this.presentToast(e?.error || 'Failed to load hosted cars', 'danger');
      },
    });
  }*/

  toggleForm() {
    this.showForm = !this.showForm;
  }

  searchModel(makeId: any) {
    this.models = [];
    this.form.patchValue({ Model: '' });

    if (!makeId) return;

    this.service.getVehicleModelsByMake(makeId).subscribe({
      next: (resp: any) => {
        this.models = resp.map((t: any) => ({ label: t.modelName, value: t.vehicleModelId }));
      },
      error: async (e: any) => this.presentToast(e?.error || 'Failed to load models', 'danger'),
    });
  }

  statusText(v: any): string {
    return v.accepted ? 'Approved' : 'Pending';
  }

  statusColor(v: any): string {
    return v.accepted ? 'success' : 'warning';
  }

  async openImages(vehicle: any) {
    const modal = await this.modalCtrl.create({
      component: HostImagesModalComponent,
      componentProps: {
        vehicleId: vehicle.id,
        title: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      },
      breakpoints: [0, 0.5, 0.85, 1],
      initialBreakpoint: 0.85,
    });
    await modal.present();
  }

  async listCar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.presentToast('Please complete all required fields', 'warning');
      return;
    }

    this.loading = true;

    const payload = {
      Reference: this.userId,
      CountryId: 1,

      StreetAddress: this.form.value.StreetAddress,
      City: this.form.value.City,
      Province: this.form.value.Province,
      PostalCode: this.form.value.PostalCode,

      Year: this.form.value.Year,
      MakeId: this.form.value.Make,
      ModelId: this.form.value.Model,
      OdometerId: this.form.value.Odometer,

      VN: this.form.value.VN,
      NumberPlate: this.form.value.NumberPlate,
      Transmission: this.form.value.Transmission,
      MarketValue: this.form.value.MarketValue,
      VehicleValueAmount: this.form.value.VehicleValueAmount,

      OwnerIdNumber: this.form.value.OwnerIdNumber,
      OwnerName: this.form.value.OwnerName,
      OwnerSurname: this.form.value.OwnerSurname,
      OwnerEmail: this.form.value.OwnerEmail,
      OwnerCellNumber: this.form.value.OwnerCellNumber,

      ColorId: this.form.value.Color,

      Address: this.address || this.form.value.Location,
      Latitude: this.tLatitude,
      Longitude: this.tLongitude,
      UserId: this.userId
    };

    debugger;
    console.log(payload);
    this.service.saveVehicle(payload).subscribe({
      next: async () => {
        this.loading = false;
        await this.presentToast('Vehicle submitted for approval!', 'success');
        this.form.reset({ CountryId: 1, MarketValue: 0, VehicleValueAmount: 0 });
        this.showForm = false;
        this.loadHostedCars();
      },
      error: async (e: any) => {
        this.loading = false;
        await this.presentToast(e?.error || 'Failed to save vehicle', 'danger');
      }
    });
  }

  private async presentToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary') {
    const toast = await this.toastCtrl.create({ message, color, duration: 2500, position: 'top' });
    await toast.present();
  }
}

/**
 * Modal component for viewing hosted vehicle images (standalone)
 */
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { environment } from 'src/environments/environment';
register();

@Component({
  selector: 'app-host-images-modal',
  template: `<ion-header>
  <ion-toolbar>
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

    <!-- Swipe Gallery -->
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

          <ion-button
            size="small"
            fill="outline"
            color="primary"
            (click)="setCover(img)">
            Set Cover
          </ion-button>

          <ion-button
            size="small"
            fill="outline"
            color="danger"
            (click)="deleteImage(img)">
            Delete
          </ion-button>

        </div>

      </ion-card-content>

    </ion-card>

  </swiper-slide>

</swiper-container>

    <!-- Reorder list -->
    <ion-list *ngIf="images.length > 1">

      <ion-reorder-group
        [disabled]="false"
        (ionItemReorder)="reorderImages($event)">

        <ion-item *ngFor="let img of images">

          <ion-thumbnail slot="start">
            <ion-img [src]="img.url"></ion-img>
          </ion-thumbnail>

          <!--<ion-label>
            Image {{ img.order }}
          </ion-label>-->

          <ion-reorder slot="end"></ion-reorder>

        </ion-item>

      </ion-reorder-group>

    </ion-list>

  </div>

</ion-content>
  `,
  styles: `swiper {
  width: 100%;
  height: auto;
}

ion-img {
  max-height: 280px;
  object-fit: cover;
}`,
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

    async addImage() {

  const action = await this.actionSheetCtrl.create({
    header: 'Add Vehicle Image',
    buttons: [
      {
        text: 'Take Photo',
        icon: 'camera',
        handler: () => {
          this.captureImage(CameraSource.Camera);
        }
      },
      {
        text: 'Choose From Gallery',
        icon: 'images',
        handler: () => {
          this.captureImage(CameraSource.Photos);
        }
      },
      {
        text: 'Cancel',
        role: 'cancel'
      }
    ]
  });

  await action.present();
}

async deleteImage(img: VehicleImage) {

  this.service.deleteVehicleImage(img.id).subscribe(async () => {

    const toast = await this.toastCtrl.create({
      message: 'Image deleted',
      duration: 2000,
      color: 'success'
    });

    await toast.present();

    this.load();
  });

}

setCover(img: VehicleImage) {

  this.service.setVehicleCoverImage(img.id).subscribe(() => {

    this.load();

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

async captureImage(source: CameraSource) {

  try {

    const image = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source
    });

    if (!image.base64String) return;

    const blob = this.base64ToBlob(image.base64String, `image/${image.format}`);

    const formData = new FormData();
    formData.append('vehicleId', this.vehicleId);
    formData.append('file', blob, `vehicle-${Date.now()}.${image.format}`);

    this.service.uploadVehicleImage(formData).subscribe({
      next: async () => {

        const toast = await this.toastCtrl.create({
          message: 'Image uploaded successfully',
          duration: 2000,
          color: 'success'
        });

        await toast.present();

        this.load();

      },
      error: async () => {

        const toast = await this.toastCtrl.create({
          message: 'Upload failed',
          duration: 2000,
          color: 'danger'
        });

        await toast.present();
      }
    });

  } catch (e) {
    console.error(e);
  }
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

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

  ngOnInit(): void {
    this.load();
  }

  close() {
    this.modalCtrl.dismiss();
  }

  load(event?: any) {
  this.service.getVehicleImages(this.vehicleId).subscribe({
    next: (resp) => {

      this.images = resp.map((img: VehicleImage) => ({
        ...img,
        url: environment.baseUrl + img.url
      }));

      console.log('Vehicle images:', this.images);

      event?.target?.complete?.();
    },
    error: async (e: any) => {
      event?.target?.complete?.();

      const toast = await this.toastCtrl.create({
        message: e?.error || 'Failed to load images',
        color: 'danger',
        duration: 2500,
        position: 'top',
      });

      await toast.present();
    }
  });
}
}
