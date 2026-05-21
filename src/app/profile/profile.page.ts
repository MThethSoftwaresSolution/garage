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
import { MainService } from 'src/app/services/main.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  private router: Router
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

  this.route.queryParams.subscribe(params => {
    if (params['completeProfile'] === 'true') {
      this.selectedSection = 'personal';
    }
  });

  this.loadProfile();
}

goToProfileCompletion() {
  if (!this.profileUpdateFormGroup.get('firstName')?.value ||
      !this.profileUpdateFormGroup.get('lastName')?.value ||
      !this.profileUpdateFormGroup.get('phoneNumber')?.value ||
      !this.profileUpdateFormGroup.get('idNumber')?.value ||
      !this.profileUpdateFormGroup.get('gender')?.value) {
    this.selectedSection = 'personal';
    return;
  }

  if (!this.profileUpdateFormGroup.get('streetAddress')?.value ||
      !this.profileUpdateFormGroup.get('city')?.value ||
      !this.profileUpdateFormGroup.get('postalCode')?.value) {
    this.selectedSection = 'address';
    return;
  }

  if (!this.hasFile(this.profile?.idCopy) || !this.hasFile(this.profile?.poaCopy)) {
    this.selectedSection = 'documents';
    return;
  }

  if (!this.profileUpdateFormGroup.get('accountHolderName')?.value ||
      !this.profileUpdateFormGroup.get('bankBranch')?.value ||
      !this.profileUpdateFormGroup.get('accountNumber')?.value ||
      !this.profileUpdateFormGroup.get('accountType')?.value ||
      !this.hasFile(this.profile?.bankLetter)) {
    this.selectedSection = 'bank';
    return;
  }

  if (!this.profileUpdateFormGroup.get('licenceNumber')?.value ||
      !this.profileUpdateFormGroup.get('code')?.value ||
      !this.profileUpdateFormGroup.get('licExpirationDate')?.value ||
      !this.hasFile(this.profile?.licenseCopy)) {
    this.selectedSection = 'licence';
    return;
  }
}

  buildForm() {
    const name = localStorage.getItem('name') ?? '';
    const surname = localStorage.getItem('surname') ?? '';
    const email = localStorage.getItem('username') ?? '';
    const phone = localStorage.getItem('phone') ?? '';

    this.profileUpdateFormGroup = new FormGroup(
      {
        firstName: new FormControl(name, [Validators.required]),
        lastName: new FormControl(surname, [Validators.required]),
        email: new FormControl(email, [Validators.required, Validators.email]),
        phoneNumber: new FormControl(phone, [Validators.required]),

        idNumber: new FormControl(''),
        gender: new FormControl(''),

        location: new FormControl(''),
        streetAddress: new FormControl(''),
        city: new FormControl(''),
        postalCode: new FormControl(''),
        unitStand: new FormControl(''),

        accountHolderName: new FormControl(''),
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

  loadProfile() {
    if (!this.userId) return;

    this.isLoading = true;

    this.service.getProfile(this.userId).subscribe({
      next: (res: any) => {
        this.profile = res;

        this.profileUpdateFormGroup.patchValue({
          firstName: res.firstName || '',
          lastName: res.lastName || '',
          email: res.email || '',
          phoneNumber: res.phoneNumber || '',

          idNumber: res.idNumber || '',
          gender: res.gender || '',

          location: res.location || '',
          streetAddress: res.streetAddress || '',
          city: res.city || '',
          postalCode: res.postalCode || '',
          unitStand: res.unitStand || '',

          accountHolderName: res.accountHolderName || '',
          bankBranch: res.bankBranch || '',
          accountNumber: res.accountNumber || '',
          accountType: res.accountType || '',

          licenceNumber: res.licenceNumber || '',
          code: res.code || '',
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

  goBack() {
    this.navCtrl.back();
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
      streetAddress: form.streetAddress,
      city: form.city,
      postalCode: form.postalCode,
      unitStand: form.unitStand,

      accountHolderName: form.accountHolderName,
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

  uploadDocument(event: any, documentType: string) {
    const file = event.target.files?.[0];

    if (!file) return;

    this.documentUploading[documentType] = true;

    this.service.uploadProfileDocument(this.userId, documentType, file).subscribe({
      next: () => {
        this.documentUploading[documentType] = false;
        this.loadProfile();
      },
      error: (err: any) => {
        this.documentUploading[documentType] = false;
        alert(err?.error || 'Document upload failed.');
      }
    });
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