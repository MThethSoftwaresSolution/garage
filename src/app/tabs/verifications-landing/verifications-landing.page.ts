import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import {
  trigger,
  transition,
  style,
  animate
} from '@angular/animations';
import { saIdValidator } from './validator';
import { StorageService } from './storage.service';
import { VerificationService } from './verification.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import imageCompression from 'browser-image-compression';
import { createWorker } from 'tesseract.js';
import { Geolocation } from '@capacitor/geolocation';
import { AuthService } from 'src/app/services/auth';

@Component({
  selector: 'app-verifications-landing',
  templateUrl: './verifications-landing.page.html',
  styleUrls: ['./verifications-landing.page.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class VerificationsLandingPage implements OnInit {

    imageSrc: string = '';
  imageAddressSrc: string = '';
  imageLicenceSrc: string = '';
  imageBankSrc: string = '';
  imageLicSrc: string = '';
  name:string = '';
  surname: string = '';
  isDefault: boolean = false;
  isAdmin: boolean = false;
  isSuperAdmin: boolean = true;
  userId: string = '';
  isVerifiedDriver: boolean = false;
  isVerAppStarted: boolean = false;
  isVetted: boolean = false;
  loading: boolean = false;
  isLoading = false;

  idFile: string = '';
  LicenseFile: string = '';
  bankFile: string = '';
  addressFile: string = '';

  tProvince: string = '';
  tStreetAddress: string = '';
  tLongitude: any;
  tLatitude: any;
  address: string = '';

  codes: Array<any> = [];
  genders: Array<any> = [];
  provinces: Array<any> = [];
  banks: Array<any> = [];
  bankAccountTypes: Array<any> = [];
  StartDate: any;
  EndDate: any;
  PickupReturnLocation: any;
  SelectedVehicleId: any;
  tempModel: any;
  user: any;
  redirecting: boolean = false;
  isRejected: boolean = false;
  bank: string = '';
  province: string = '';

  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  thirdFormGroup!: FormGroup;
  fourthFormGroup!: FormGroup;
  formAddress!: FormGroup;
  formBank!: FormGroup;
  formBankCard!: FormGroup;
  
    constructor(private navCtrl: NavController, private fb: FormBuilder, private router: Router,
      private storage: StorageService, private service: VerificationService, private authService: AuthService
    ) { }


        goBack() {
    this.navCtrl.back();
  }

  currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  ngOnInit() {

  this.redirecting = false;

  this.userId = this.currentUser.userId;
  this.isRejected = this.currentUser.isRejected;
  this.name = this.currentUser.firstName;
  this.surname = this.currentUser.lastName;
  this.isAdmin = this.currentUser.isAdmin;
  this.isSuperAdmin = this.currentUser.isSuperAdmin;
  this.isVerifiedDriver = this.currentUser.IsVetted;
  this.isVerAppStarted = this.currentUser.isVerAppStarted;
  this.isVetted = this.currentUser.isVetted;

  console.log('isVerAppStarted', this.isVerAppStarted);
  console.log('isVetted', this.isVetted);

  this.initializeForms();
  this.loadDropdownData();
  this.restoreDraft();
  this.patchIfExisting();

  }

  loadDropdownData(){
        this.codes = [
      {label: 'A1', value: 'A1'},
      {label: 'A', value: 'A'},
      {label: 'B', value: 'B'}, 
      {label: 'C1', value: 'C1'},
      {label: 'C', value: 'C'},
      {label: 'EB', value: 'EB'},
      {label: 'EC1', value: 'EC1'},
      {label: 'EC', value: 'EC'},
    ];

    this.genders = [
      {label: 'Male', value: 'Male'},
      {label: 'Female', value: 'Female'},
      {label: 'Other', value: 'Other'},
    ];

    this.bankAccountTypes = [
      {label: 'Savings', value: 'Savings'},
      {label: 'Cheque', value: 'Cheque'},
      {label: 'Current', value: 'Current'}
    ]

  }

  initializeForms() {

    this.loadProvinces();
    this.loadBanks();

  this.firstFormGroup = new FormGroup({
    email: new FormControl(this.currentUser.email, [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, Validators.minLength(10)]),
    name: new FormControl(this.currentUser.firstName, Validators.required),
    surname: new FormControl(this.currentUser.lastName, Validators.required),
    gender: new FormControl('', Validators.required),
    id: new FormControl('', [Validators.required, saIdValidator]),
    fileSource: new FormControl('')
  });

  this.formAddress = new FormGroup({
    StreetAddress: new FormControl('', Validators.required),
    City: new FormControl('', Validators.required),
    Province: new FormControl('', Validators.required),
    UnitStand: new FormControl(''),
    PostalCode: new FormControl('', Validators.required),
    Location: new FormControl(''),
    fileAddressSource: new FormControl('')
  });

  this.thirdFormGroup = new FormGroup({
    LicenceNumber: new FormControl('', Validators.required),
    Code: new FormControl('', Validators.required),
    ExpirationDate: new FormControl('', Validators.required),
    fileLicSource: new FormControl('')
  });

  this.formBank = new FormGroup({
    BankId: new FormControl(''),
    BankBranch: new FormControl('', [
      Validators.required,
      //Validators.pattern(/^[0-9]{6}$/)
    ]),
    AccountHolderName: new FormControl(''),
    AccountNumber: new FormControl('', [
      Validators.required,
      //Validators.pattern(/^[0-9]{8,12}$/)
    ]),
    AccountType: new FormControl(''),
    fileBankSource: new FormControl('')
  });

  /*this.formBankCard = new FormGroup({
    FirstName: new FormControl('', Validators.required),
    LastName: new FormControl('', Validators.required),
    Email: new FormControl('', Validators.required),
    CardNumber: new FormControl('', Validators.required),
    ExpiryDate: new FormControl('', Validators.required),
    SecurityCode: new FormControl('', Validators.required)
  });*/
}

patchIfExisting() {

  if (!this.isVerAppStarted) return;

  this.service.getUserById(this.userId).subscribe((user: any) => {

    this.firstFormGroup.patchValue({
      email: user.userName,
      phone: '0' + user.phoneNumber.slice(3),
      name: user.firstName,
      surname: user.lastName,
      gender: user.gender,
      id: user.idNumber,
      fileSource: user.idCopy
    });

    this.formAddress.patchValue({
      StreetAddress: user.streetAddress,
      City: user.city,
      Province: user.provinceId,
      PostalCode: user.postalCode,
      Location: user.location,
      UnitStand: user.unitStand,
      fileAddressSource: user.poaCopy
    });

    this.formBank.patchValue({
      BankId: user.bankId,
      BankBranch: user.bankBranch,
      AccountHolderName: user.accountHolderName,
      AccountNumber: user.accountNumber,
      AccountType: user.accountType,
      fileBankSource: user.bankLetter
    });

    this.thirdFormGroup.patchValue({
      LicenceNumber: user.licenceNumber,
      Code: user.code,
      ExpirationDate: user.licExpirationDate,
      fileLicSource: user.licenseCopy
    });
  });
}

loadProvinces(){
  this.service.getProvinces()
  .subscribe((resp:any)=>{
    console.log(resp);
    this.provinces = resp;
  });
}

loadBanks(){
    this.service.getBanks()
  .subscribe((resp:any)=>{
    console.log(resp);
    this.banks = resp;
  });
}

async scanID() {

  try {

    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 80,
      allowEditing: true,
      correctOrientation: true
    });

    if (!photo.webPath) return;

    // 1️⃣ Get blob from camera
    const response = await fetch(photo.webPath);
    const blob = await response.blob();

    // 2️⃣ Convert Blob → File (FIX)
    const file = new File(
      [blob],
      `id_${Date.now()}.jpg`,
      {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
      }
    );

    // 3️⃣ Now compress (imageCompression expects File)
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });

    // 4️⃣ Convert for preview
    const base64 = await imageCompression.getDataUrlFromFile(compressedFile);

    this.firstFormGroup.patchValue({
      fileSource: base64
    });

  } catch (error) {
    console.error(error);
  }
}

async captureAndCompress(
  controlName: string,
  formGroup: FormGroup
) {

  try {

    // 1️⃣ Open Camera
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 80,
      allowEditing: true,
      correctOrientation: true
    });

    if (!photo.webPath) return;

    // 2️⃣ Convert to Blob
    const response = await fetch(photo.webPath);
    const blob = await response.blob();

    // 3️⃣ Convert Blob → File (required for compression typing)
    const file = new File(
      [blob],
      `${controlName}_${Date.now()}.jpg`,
      {
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
      }
    );

    // 4️⃣ Compress
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true
    });

    // 5️⃣ Convert to Base64 for preview
    const base64 = await imageCompression.getDataUrlFromFile(compressedFile);

    // 6️⃣ Patch correct form control
    formGroup.patchValue({
      [controlName]: base64
    });

    // OPTIONAL: store actual file for upload
    formGroup.patchValue({
      [`${controlName}File`]: compressedFile
    });

  } catch (error) {
    console.error('Capture failed:', error);
  }
}

  scanning: boolean = false;

  // =============================
  // SOUTH AFRICAN ID PARSER
  // =============================

  parseSAID(text: string) {

    if (!text) return;

    const cleaned = text.replace(/\s/g, ' ');

    // Extract 13-digit ID
    const idMatch = cleaned.match(/\d{13}/);
    const idNumber = idMatch ? idMatch[0] : '';

    // Extract Name / Surname (basic heuristic)
    const lines = text.split('\n').map(l => l.trim());

    let surname = '';
    let names = '';
    let gender = '';

    lines.forEach(line => {

      if (line.toLowerCase().includes('surname'))
        surname = line.split(':').pop()?.trim() || '';

      if (line.toLowerCase().includes('names'))
        names = line.split(':').pop()?.trim() || '';

      if (line.toLowerCase().includes('sex')) {
        if (line.toLowerCase().includes('male'))
          gender = 'Male';
        else if (line.toLowerCase().includes('female'))
          gender = 'Female';
      }

    });

    // Patch Form
    this.firstFormGroup.patchValue({
      id: idNumber,
      surname: surname,
      name: names,
      gender: gender
    });
  }

async getGPS() {

  const position = await Geolocation.getCurrentPosition();

  const coords = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  this.formAddress.patchValue({
    Location: JSON.stringify(coords)
  });
}

watchChanges() {
  this.firstFormGroup.valueChanges.subscribe(val =>
    this.storage.saveDraft('step1', val)
  );

  this.formAddress.valueChanges.subscribe(val =>
    this.storage.saveDraft('step2', val)
  );

  this.thirdFormGroup.valueChanges.subscribe(val =>
    this.storage.saveDraft('step3', val)
  );

  this.formBank.valueChanges.subscribe(val =>
    this.storage.saveDraft('step4', val)
  );
}

restoreDraft() {
  const step1 = this.storage.getDraft('step1');
  if (step1) this.firstFormGroup.patchValue(step1);

  const step2 = this.storage.getDraft('step2');
  if (step2) this.formAddress.patchValue(step2);
}

reSubmit() {

  if (!this.allFormsValid()) {
    this.markAllTouched();
    return;
  }

  const merged = {
    ...this.firstFormGroup.value,
    ...this.formAddress.value,
    ...this.thirdFormGroup.value,
    ...this.formBank.value,
    //...this.formBankCard.value
  };

  const formData = new FormData();

  Object.keys(merged).forEach(key => {
    if (merged[key] !== null && merged[key] !== undefined) {
      formData.append(key, merged[key]);
    }
  });

  this.loading = true;

  this.service.reSubmitVerification(formData)
    .subscribe({
      next: () => {
        this.loading = false;
        console.log('Re-submission successful');
      },
      error: (err) => {
        this.loading = false;
        console.error('Re-submit failed', err);
      }
    });
}

markAllTouched() {
  this.firstFormGroup.markAllAsTouched();
  this.formAddress.markAllAsTouched();
  this.thirdFormGroup.markAllAsTouched();
  this.formBank.markAllAsTouched();
  //this.formBankCard.markAllAsTouched();
}

submit() {

  debugger;

  if (!this.allFormsValid()) return;

  const merged = {
    ...this.firstFormGroup.value,
    ...this.formAddress.value,
    ...this.thirdFormGroup.value,
    ...this.formBank.value,
    //...this.formBankCard.value
  };

  const formData = new FormData();

  Object.keys(merged).forEach(key =>
    formData.append(key, merged[key])
  );
  
  formData.append('UserId', this.userId);

  this.service.uploadVerification(formData)
  .subscribe((resp:any)=>{
    console.log(resp);
   
        let body = { 'Email': this.firstFormGroup.value.email, 'Password': 'Password' }

    this.authService.relogin(body).subscribe((resp:any)=>{

      if(resp.isSuccess){

        console.log(resp);
        localStorage.setItem("currentUser", JSON.stringify(resp.user));

        localStorage.setItem("token", resp.token);
        localStorage.setItem("id", resp.id);
        localStorage.setItem("name", resp.name);
        localStorage.setItem("phone", resp.phone);
        localStorage.setItem("surname", resp.surname);
        localStorage.setItem("isVerAppStarted", resp.isVerAppStarted);
        localStorage.setItem("username", resp.username);
        localStorage.setItem("roles", resp.role);
        localStorage.setItem('isAdmin', JSON.stringify(resp.isAdmin));
        localStorage.setItem('isActiveMember', JSON.stringify(resp.isActiveMember));
         this.isLoading = false;
         if(resp.user.isVetted){
            this.router.navigateByUrl("tabs/dashboard");
         }else{
          window.location.reload();
         }

      }
    
    })


  }, (error:any)=>{
    console.log(error);
  });
}

  // ================================
  // STEP NAVIGATION
  // ================================

  goTo(step: string) {

    this.activeStep = step;

    const map: any = {
      step1: 0.2,
      step2: 0.4,
      step3: 0.6,
      step4: 0.8,
      step5: 1
    };

    this.progress = map[step];
  }

  // ================================
  // FINAL VALIDATION CHECK
  // ================================

  allFormsValid(): boolean {

    return this.firstFormGroup.valid &&
           this.formAddress.valid &&
           this.thirdFormGroup.valid &&
           this.formBank.valid; //&&
           //this.formBankCard.valid;
  }

    activeStep: string = 'step1';
  progress: number = 0.2;

}
