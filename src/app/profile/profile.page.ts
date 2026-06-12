import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { AuthService } from '../services/auth';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ProfilePage implements OnInit {
  isLoading = false;
  registerLoading = false;
  isPasswordUpdate = false;

  selectedSection: 'personal' | 'address' | 'documents' | 'bank' | 'licence' = 'personal';

  userId = '';
  profile: any = null;

  banks: any[] = [];
  provinces: any[] = [];

  profileUpdateFormGroup: FormGroup = new FormGroup({});

  documentUploading: any = {
    imagePath: false,
    idCopy: false,
    poaCopy: false,
    bankLetter: false,
    licenseCopy: false
  };

  constructor(
    private service: MainService,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private router: Router, private authService: AuthService
  ) {}

  ngOnInit() {
    const userRaw = localStorage.getItem('currentUser');

    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        this.userId = user?.id || user?.userId || '';
      } catch {
        this.userId = '';
      }
    }

    this.buildForm();
    this.loadBanks();
    this.loadProvinces();

    this.route.queryParams.subscribe(params => {
      if (params['completeProfile'] === 'true') {
        this.selectedSection = 'personal';
      }
    });

    this.loadProfile();
  }

  private clean(value: any): any {
    if (
      value === null ||
      value === undefined ||
      value === 'null' ||
      value === 'undefined'
    ) {
      return '';
    }

    return value;
  }

  loadBanks() {
    this.service.getBanks().subscribe({
      next: (res: any) => {
        this.banks = Array.isArray(res) ? res : [];
      },
      error: () => {
        this.banks = [];
      }
    });
  }

  loadProvinces() {
    this.service.getProvinces().subscribe({
      next: (res: any) => {
        this.provinces = Array.isArray(res) ? res : [];
      },
      error: () => {
        this.provinces = [];
      }
    });
  }

  buildForm() {
    const name = this.clean(localStorage.getItem('name'));
    const surname = this.clean(localStorage.getItem('surname'));
    const email = this.clean(localStorage.getItem('username'));
    const phone = this.clean(localStorage.getItem('phone'));

    this.profileUpdateFormGroup = new FormGroup(
      {
        firstName: new FormControl(name, [Validators.required]),
        lastName: new FormControl(surname, [Validators.required]),
        email: new FormControl(email, [Validators.required, Validators.email]),
        phoneNumber: new FormControl(phone, [Validators.required]),

        idNumber: new FormControl('', [
  Validators.required,
  Validators.pattern(/^\d{13}$/)
]),
        gender: new FormControl(''),

        location: new FormControl(''),
        provinceId: new FormControl('', [Validators.required]),
        streetAddress: new FormControl(''),
        city: new FormControl(''),
        postalCode: new FormControl(''),
        unitStand: new FormControl(''),

        accountHolderName: new FormControl(''),
        bankId: new FormControl('', [Validators.required]),
        bankBranch: new FormControl(''),
        accountNumber: new FormControl(''),
        accountType: new FormControl(''),

        licenceNumber: new FormControl(''),
        code: new FormControl(''),
        licExpirationDate: new FormControl(''),

        password: new FormControl(''),
        confirmPassword: new FormControl('')
      },
      { validators: this.passwordMatchValidator }
    );
  }

  numbersOnly(event: any) {
  const value = event.target.value || '';

  const cleaned = value.replace(/\D/g, '');

  this.profileUpdateFormGroup
    .get('idNumber')
    ?.setValue(cleaned, {
      emitEvent: false
    });
}

  loadProfile() {
    if (!this.userId) return;

    this.isLoading = true;

    this.service.getProfile(this.userId).subscribe({
      next: (res: any) => {
        console.log('Profile data loaded:', (environment.baseUrl + res.imagePath).replace(/([^:]\/)\/+/g, '$1'));
        this.profile = {
        ...res,
        imagePath: this.toFileUrl(res.imagePath),
        idCopy: this.toFileUrl(res.idCopy),
        poaCopy: this.toFileUrl(res.poaCopy),
        bankLetter: this.toFileUrl(res.bankLetter),
        licenseCopy: this.toFileUrl(res.licenseCopy)
      };

        this.profileUpdateFormGroup.patchValue({
          firstName: this.clean(res.firstName),
          lastName: this.clean(res.lastName),
          email: this.clean(res.email),
          phoneNumber: this.clean(res.phoneNumber),
           //imagePath: this.toFileUrl(res.imagePath),
          idNumber: this.clean(res.idNumber),
          gender: this.clean(res.gender),

          location: this.clean(res.location),
          provinceId: res.provinceId || '',
          streetAddress: this.clean(res.streetAddress),
          city: this.clean(res.city),
          postalCode: this.clean(res.postalCode),
          unitStand: this.clean(res.unitStand),

          accountHolderName: this.clean(res.accountHolderName),
          bankId: res.bankId || '',
          bankBranch: this.clean(res.bankBranch),
          accountNumber: this.clean(res.accountNumber),
          accountType: this.clean(res.accountType),

          licenceNumber: this.clean(res.licenceNumber),
          code: this.clean(res.code),
          licExpirationDate: res.licExpirationDate
            ? String(res.licExpirationDate).substring(0, 10)
            : ''
        });

        const completeProfile = this.route.snapshot.queryParamMap.get('completeProfile');

        if (completeProfile === 'true') {
          setTimeout(() => this.goToProfileCompletion(), 200);
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toFileUrl(path: string | null | undefined): string {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const apiRoot = environment.baseUrl
    .replace(/\/api\/?$/i, '')
    .replace(/\/$/, '');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${apiRoot}${cleanPath}`;
}

  goToProfileCompletion() {
    if (
      !this.profileUpdateFormGroup.get('firstName')?.value ||
      !this.profileUpdateFormGroup.get('lastName')?.value ||
      !this.profileUpdateFormGroup.get('phoneNumber')?.value ||
      !this.profileUpdateFormGroup.get('idNumber')?.value ||
      !this.profileUpdateFormGroup.get('gender')?.value
    ) {
      this.selectedSection = 'personal';
      return;
    }

    if (
      !this.profileUpdateFormGroup.get('provinceId')?.value ||
      !this.profileUpdateFormGroup.get('streetAddress')?.value ||
      !this.profileUpdateFormGroup.get('city')?.value ||
      !this.profileUpdateFormGroup.get('postalCode')?.value
    ) {
      this.selectedSection = 'address';
      return;
    }

    if (!this.hasFile(this.profile?.idCopy) || !this.hasFile(this.profile?.poaCopy)) {
      this.selectedSection = 'documents';
      return;
    }

    if (
      !this.profileUpdateFormGroup.get('accountHolderName')?.value ||
      !this.profileUpdateFormGroup.get('bankId')?.value ||
      !this.profileUpdateFormGroup.get('bankBranch')?.value ||
      !this.profileUpdateFormGroup.get('accountNumber')?.value ||
      !this.profileUpdateFormGroup.get('accountType')?.value ||
      !this.hasFile(this.profile?.bankLetter)
    ) {
      this.selectedSection = 'bank';
      return;
    }

    if (
      !this.profileUpdateFormGroup.get('licenceNumber')?.value ||
      !this.profileUpdateFormGroup.get('code')?.value ||
      !this.profileUpdateFormGroup.get('licExpirationDate')?.value ||
      !this.hasFile(this.profile?.licenseCopy)
    ) {
      this.selectedSection = 'licence';
    }
  }

  update() {
    if (this.profileUpdateFormGroup.invalid) {
      this.profileUpdateFormGroup.markAllAsTouched();
      return;
    }

    const form = this.profileUpdateFormGroup.value;

    const payload = {
      userId: this.userId,

      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,

      idNumber: form.idNumber,
      gender: form.gender,

      location: form.location,
      provinceId: form.provinceId ? Number(form.provinceId) : null,
      streetAddress: form.streetAddress,
      city: form.city,
      postalCode: form.postalCode,
      unitStand: form.unitStand,

      accountHolderName: form.accountHolderName,
      bankId: form.bankId ? Number(form.bankId) : null,
      bankBranch: form.bankBranch,
      accountNumber: form.accountNumber,
      accountType: form.accountType,

      licenceNumber: form.licenceNumber,
      code: form.code,
      licExpirationDate: form.licExpirationDate || null,

      password: this.isPasswordUpdate ? form.password : null
    };

    this.registerLoading = true;

    this.service.updateProfile(payload).subscribe({
      next: () => {
        this.registerLoading = false;
        alert('Profile updated successfully.');
        this.loadProfile();
      },
      error: (err: any) => {
        this.registerLoading = false;
        alert(err?.error || 'Failed to update profile.');
      }
    });
  }

async handleRefresh(event: any) {
  const userRaw = localStorage.getItem('currentUser');

  if (!userRaw) {
    event?.target?.complete?.();
    return;
  }

  let currentUser: any;

  try {
    currentUser = JSON.parse(userRaw);
  } catch {
    event?.target?.complete?.();
    return;
  }

  const email =
    currentUser?.email ||
    localStorage.getItem('username');

  if (!email) {
    event?.target?.complete?.();
    return;
  }

  this.authService.relogin({ email, Password: 'Password123!' }).subscribe({
   
      next: (resp: any) => {

      localStorage.setItem('currentUser', JSON.stringify(resp.user));
      localStorage.setItem('token', resp.token);
      localStorage.setItem('id', resp.id);
      localStorage.setItem('name', resp.name);
      localStorage.setItem('phone', resp.phone ?? '');
      localStorage.setItem('surname', resp.surname);
      localStorage.setItem('isVetted', JSON.stringify(resp.isVetted));
      localStorage.setItem('isVerAppStarted', JSON.stringify(resp.isVerAppStarted));
      localStorage.setItem('username', resp.username);
      localStorage.setItem('roles', resp.role);
      localStorage.setItem('isAdmin', JSON.stringify(resp.isAdmin));
      localStorage.setItem('isActiveMember', JSON.stringify(resp.isActiveMember));

      this.userId = resp.id;

      this.loadProfile();
      this.loadBanks();
      this.loadProvinces();

      event?.target?.complete?.();

      // FORCE FULL REFRESH
      setTimeout(() => {
        window.location.reload();
      }, 700);

    },
    error: () => {
      this.loadProfile();
      event?.target?.complete?.();
    }
  });
}

uploadDocument(event: any, documentType: string) {
  const file = event.target.files?.[0];

  if (!file) return;

  const currentFormValues = this.profileUpdateFormGroup.getRawValue();
  const currentSection = this.selectedSection;

  this.documentUploading[documentType] = true;

  this.service.uploadProfileDocument(this.userId, documentType, file).subscribe({
    next: (res: any) => {
      this.documentUploading[documentType] = false;

      const uploadedPath =
        res?.filePath ||
        res?.path ||
        res?.url ||
        this.profile?.[documentType];

      this.profile = {
        ...this.profile,
        [documentType]: this.toFileUrl(uploadedPath)
      };

      this.profileUpdateFormGroup.patchValue(currentFormValues);
      this.selectedSection = currentSection;

      event.target.value = '';
    },
    error: (err: any) => {
      this.documentUploading[documentType] = false;
      event.target.value = '';
      alert(err?.error || 'Document upload failed.');
    }
  });
}

  changePassword() {
    this.isPasswordUpdate = !this.isPasswordUpdate;

    if (!this.isPasswordUpdate) {
      this.profileUpdateFormGroup.patchValue({
        password: '',
        confirmPassword: ''
      });
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password && !confirmPassword) return null;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  get passwordControlRegistration() {
    return this.profileUpdateFormGroup.get('password');
  }

  get passwordControlRegistrationConfirm() {
    return this.profileUpdateFormGroup.get('confirmPassword');
  }

  setSection(section: 'personal' | 'address' | 'documents' | 'bank' | 'licence') {
    this.selectedSection = section;
  }

  goBack() {
    this.navCtrl.back();
  }

  hasFile(path: string | null | undefined): boolean {
    return !!path && path.trim().length > 0;
  }

  getInitials(): string {
    const firstName = this.profileUpdateFormGroup.get('firstName')?.value || '';
    const lastName = this.profileUpdateFormGroup.get('lastName')?.value || '';

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  }

  getVerificationLabel(): string {
    if (this.profile?.isVetted) return 'Vetted';
    if (this.profile?.isRejected) return 'Rejected';
    if (this.profile?.isPending) return 'Pending Review';
    return 'Incomplete';
  }

  getVerificationClass(): string {
    if (this.profile?.isVetted) return 'verified';
    if (this.profile?.isRejected) return 'rejected';
    if (this.profile?.isPending) return 'pending';
    return 'incomplete';
  }
}