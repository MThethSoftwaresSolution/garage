import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ScrollDetail, ToastController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';

import { AuthService } from 'src/app/services/auth';
import { MasterDataService } from 'src/app/services/master-data.service';

export const passwordStrengthValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = control.value || '';

  if (!value) {
    return null;
  }

  const hasMinLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
    ? null
    : {
        passwordStrength: {
          hasMinLength,
          hasUppercase,
          hasLowercase,
          hasNumber,
          hasSpecial
        }
      };
};

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  screen: any = 'signin';

  isLoading = false;
  loading = false;
  registerLoading = false;
  forgotPasswordLoading = false;
  passwordResetLoading = false;
  isToastOpen = false;

  emailToResetPasswordFor = '';
  passwordReset = false;

  private readonly emailKey = 'pending_activation_email';
  private readonly tokenKey = 'auth_token';

  loginFormGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  activateFormGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    otp: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6)
    ])
  });

  registerFormGroup: FormGroup = new FormGroup(
    {
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        passwordStrengthValidator
      ]),
      confirmPassword: new FormControl('', [Validators.required])
    },
    { validators: passwordMatchValidator }
  );

  resendOtpFormGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  forgotPasswordFormGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  passwordResetFormGroup: FormGroup = new FormGroup(
    {
      email: new FormControl('', [Validators.required, Validators.email]),
      otp: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6)
      ]),
      password: new FormControl('', [
        Validators.required,
        passwordStrengthValidator
      ]),
      confirmPassword: new FormControl('', [Validators.required])
    },
    { validators: passwordMatchValidator }
  );

  constructor(
    private toast: ToastController,
    private router: Router,
    private auth: AuthService,
    private masterDataService: MasterDataService
  ) {}

  ngOnInit() {
    this.registerLoading = false;
    this.isLoading = false;
  }

  get passwordControl() {
    return this.loginFormGroup.get('password');
  }

  get passwordControlRegistration() {
    return this.registerFormGroup.get('password');
  }

  get passwordControlRegistrationConfirm() {
    return this.registerFormGroup.get('confirmPassword');
  }

  get registerPasswordStrength() {
    return this.registerFormGroup.get('password')?.errors?.['passwordStrength'];
  }

  get resetPasswordStrength() {
    return this.passwordResetFormGroup.get('password')?.errors?.['passwordStrength'];
  }

  get resetPasswordControl() {
    return this.passwordResetFormGroup.get('password');
  }

  get resetPasswordConfirmControl() {
    return this.passwordResetFormGroup.get('confirmPassword');
  }

  async clearPendingActivationEmail(): Promise<void> {
    await Preferences.remove({ key: this.emailKey });
  }

  login() {
    this.isLoading = true;

    if (this.loginFormGroup.invalid) {
      this.loginFormGroup.markAllAsTouched();
      this.isLoading = false;
      return;
    }

    const body = {
      Email: this.loginFormGroup.value.email,
      Password: this.loginFormGroup.value.password
    };

    this.auth.login(body).subscribe({
      next: async (resp: any) => {
        this.isLoading = false;

        if (resp?.token) {
          await Preferences.set({ key: this.tokenKey, value: resp.token });
          await this.clearPendingActivationEmail();
        }

      if (resp?.isSuccess) {
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

        const isAdmin = resp.isAdmin === true;
        const isVetted = resp.isVetted === true || resp.user?.isVetted === true;

        if (isAdmin) {
          this.router.navigateByUrl('/tabs/vehicles', { replaceUrl: true });
          return;
        }

        if (!isVetted) {
          this.router.navigateByUrl('/tabs/profile?completeProfile=true', {
            replaceUrl: true
          });
          return;
        }

        this.router.navigateByUrl('/tabs/vehicles', { replaceUrl: true });
      }
      },
      error: async (error: any) => {
        this.isLoading = false;

        await this.showToast(this.extractError(error));

        if (
          error?.error ===
          'Please activate your account. Check your email to get an OTP.'
        ) {
          const savedEmail = await this.auth.getPendingActivationEmail();

          if (savedEmail) {
            this.activateFormGroup.patchValue({ email: savedEmail });
          }

          this.screen = 'activate';
        }
      }
    });
  }

  async register() {
    this.registerLoading = true;

    if (this.registerFormGroup.invalid) {
      this.registerFormGroup.markAllAsTouched();
      this.registerLoading = false;
      await this.showToast('Please complete all fields correctly.');
      return;
    }

    try {
      const dto = this.registerFormGroup.getRawValue();

      await this.auth.register({
        email: dto.email!,
        password: dto.password!,
        firstName: dto.firstName!,
        lastName: dto.lastName!
      });

      await this.showToast('Account created successfully. Check your email for an OTP.');

      const savedEmail = await this.auth.getPendingActivationEmail();

      if (savedEmail) {
        this.activateFormGroup.patchValue({ email: savedEmail });
      } else {
        this.activateFormGroup.patchValue({ email: dto.email });
      }

      this.registerFormGroup.reset();
      this.screen = 'activate';
    } catch (e: any) {
      await this.showToast(this.extractError(e));
    } finally {
      this.registerLoading = false;
    }
  }

  async forgotPassword() {
    this.forgotPasswordLoading = true;

    if (this.forgotPasswordFormGroup.invalid) {
      this.forgotPasswordFormGroup.markAllAsTouched();
      this.forgotPasswordLoading = false;
      return;
    }

    const email = this.forgotPasswordFormGroup.get('email')?.value;

    if (!email) {
      await this.showToast('Enter your email first.');
      this.forgotPasswordLoading = false;
      return;
    }

    this.auth.forgotPassword(email).subscribe({
      next: async () => {
        this.emailToResetPasswordFor = email;

        this.passwordResetFormGroup.patchValue({
          email
        });

        this.forgotPasswordLoading = false;
        this.screen = 'reset-password';

        await this.showToast('OTP sent. Check your email.');
      },
      error: async (e: any) => {
        this.forgotPasswordLoading = false;

        if (e?.error?.text === 'OTP sent to your email address.') {
          this.emailToResetPasswordFor = email;

          this.passwordResetFormGroup.patchValue({
            email
          });

          this.screen = 'reset-password';
          await this.showToast('OTP sent. Check your email.');
          return;
        }

        await this.showToast(this.extractError(e));
      }
    });
  }

  async verify() {
    if (this.activateFormGroup.invalid) {
      this.activateFormGroup.markAllAsTouched();
      await this.showToast('Enter your email and 6-digit OTP.');
      return;
    }

    try {
      const dto = this.activateFormGroup.getRawValue();

      await this.auth.verifyActivationOtp({
        email: dto.email!,
        otp: '' + dto.otp!
      });

      await this.showToast('Account activated. You can now login.');
      this.screen = 'signin';
    } catch (e: any) {
      await this.showToast(this.extractError(e));
    }
  }

  async resetPassword() {
    this.passwordResetLoading = true;

    if (this.passwordResetFormGroup.invalid) {
      this.passwordResetFormGroup.markAllAsTouched();
      this.passwordResetLoading = false;
      await this.showToast('Please complete all fields correctly.');
      return;
    }

    try {
      const dto = this.passwordResetFormGroup.getRawValue();

      await this.auth.resetPassword(dto.email!, dto.password!, '' + dto.otp!);

      await this.showToast('Password reset successfully. You can now login.');

      this.screen = 'signin';
      this.passwordResetFormGroup.reset();
    } catch (e: any) {
      if (e?.error?.text === 'Password reset successfully.') {
        await this.showToast('Password updated successfully. You can now login.');

        setTimeout(() => {
          this.screen = 'signin';
          this.passwordResetFormGroup.reset();
        }, 1500);
      } else {
        await this.showToast(this.extractError(e));
      }
    } finally {
      this.passwordResetLoading = false;
    }
  }

  async resend() {
    const email = this.activateFormGroup.get('email')?.value;

    if (!email) {
      await this.showToast('Enter your email first.');
      return;
    }

    try {
      await this.auth.resendActivationOtp({ email });
      await this.showToast('OTP resent. Check your email.');
    } catch (e: any) {
      await this.showToast(this.extractError(e));
    }
  }

  change(event: any) {
    this.screen = event;
  }

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  handleScrollStart() {
    console.log('scroll start');
  }

  handleScroll(event: CustomEvent<ScrollDetail>) {
    console.log('scroll', JSON.stringify(event.detail));
  }

  handleScrollEnd() {
    console.log('scroll end');
  }

  private extractError(e: any): string {
    const err = e?.error;

    if (!err) {
      return 'Something went wrong.';
    }

    if (typeof err === 'string') {
      return err;
    }

    if (err?.text) {
      return err.text;
    }

    if (err?.message) {
      return err.message;
    }

    return 'Request failed.';
  }

  private async showToast(message: string) {
    const t = await this.toast.create({
      message,
      duration: 2500,
      position: 'bottom'
    });

    await t.present();
  }
}