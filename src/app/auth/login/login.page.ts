import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, MaxLengthValidator, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ScrollDetail, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';
import { MasterDataService } from 'src/app/services/master-data.service';
import { Preferences } from '@capacitor/preferences';
export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword
    ? null
    : { passwordMismatch: true };
};

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {

  isLoading: boolean = false;
  private readonly emailKey = 'pending_activation_email';
  private readonly tokenKey = 'auth_token';

 ngOnInit() {
  this.registerLoading = false;
  this.isLoading = false;
  }

    screen: any = 'signin';
  //toastMessage: string ='';
  loading: boolean = false;
  registerLoading: boolean = false;
  isToastOpen: boolean = false;

  loginFormGroup: FormGroup = new FormGroup({
    email: new FormControl("mboniseh@gmail.com", [Validators.required, Validators.email]),
    password: new FormControl("Mbo@1993", [Validators.required])
  });

  activateFormGroup: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
    otp: new FormControl("", [Validators.required, Validators.minLength(6), Validators.maxLength(6)])
  });

  registerFormGroup: FormGroup = new FormGroup({
    firstName: new FormControl("", [Validators.required]),
    lastName: new FormControl("", [Validators.required]),
    email: new FormControl("", [Validators.required, Validators.email]),
    password: new FormControl("", [Validators.required]),
    confirmPassword: new FormControl("", [Validators.required])
  });
  resendOtpFormGroup: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email])
  });

    forgotPasswordFormGroup: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email])
  });

  passwordResetFormGroup: FormGroup = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.email]),
    otp: new FormControl("", [Validators.required]),
    password: new FormControl("", [Validators.required]),
    confirmPassword: new FormControl("", [Validators.required])
  });

  constructor(private toast: ToastController,
    private router: Router, private auth: AuthService, private masterDataService: MasterDataService) { }


  async clearPendingActivationEmail(): Promise<void> {
    await Preferences.remove({ key: this.emailKey });
  }

  forgotPasswordLoading = false;

  async forgotPassword(){
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

    try {
      await this.auth.forgotPassword(email)
      .subscribe((resp:any)=>{
              this.emailToResetPasswordFor = this.forgotPasswordFormGroup.get('email')?.value;
        //Now redirect to password with forgot password and patch the form
        this.passwordResetFormGroup.patchValue({
          email: this.forgotPasswordFormGroup.value.email
        });
        this.forgotPasswordLoading = false;
        this.screen = 'reset-password';
      })
      await this.showToast('OTP resent. Check your email.');
    } catch (e: any) {
      if(e.error.text === 'OTP sent to your email address.'){
      this.emailToResetPasswordFor = this.forgotPasswordFormGroup.get('email')?.value;
        //Now redirect to password with forgot password and patch the form
        this.passwordResetFormGroup.patchValue({
          email: this.forgotPasswordFormGroup.value.email
        });
        this.forgotPasswordLoading = false;
        this.screen = 'reset-password';
      }
      this.forgotPasswordLoading = false;
      //await this.showToast(this.extractError(e));
    } finally {
      this.forgotPasswordLoading = false;
      //await l.dismiss();
    }

  }

  emailToResetPasswordFor: string = '';

  passwordReset = false;

 login(){

    this.isLoading = true;
    if (this.loginFormGroup.invalid) {
      this.loginFormGroup.markAllAsTouched();
      return;
    }

    let body = { 'Email': this.loginFormGroup.value.email, 'Password': this.loginFormGroup.value.password }

    this.auth.login(body).subscribe((resp:any)=>{
      this.isLoading = false;

      if (resp?.token) {
      Preferences.set({ key: this.tokenKey, value: resp.token });
      this.clearPendingActivationEmail();
    }

      if(resp.isSuccess){

        console.log(resp);
        localStorage.setItem("currentUser", JSON.stringify(resp.user));

        localStorage.setItem("token", resp.token);
        localStorage.setItem("id", resp.id);
        localStorage.setItem("name", resp.name);
        localStorage.setItem("phone", resp.phone);
        localStorage.setItem("surname", resp.surname);
        localStorage.setItem("isVetted", resp.isVetted);
        localStorage.setItem("isVerAppStarted", resp.isVerAppStarted);
        localStorage.setItem("username", resp.username);
        localStorage.setItem("roles", resp.role);
        localStorage.setItem('isAdmin', JSON.stringify(resp.isAdmin));
        localStorage.setItem('isActiveMember', JSON.stringify(resp.isActiveMember));
         this.isLoading = false;
         if(resp.user.isVetted){
            this.router.navigateByUrl("tabs/dashboard");
         }else{
          this.router.navigateByUrl("tabs/verifications-landing");
         }

      }
    
    }, async (error: any)=>{
      await this.showToast(error.error);
      console.log(error);
      this.isLoading = false;
      if(error.error === 'Please activate your account. Check your email to get an OTP.'){
      const savedEmail = await this.auth.getPendingActivationEmail();
      if (savedEmail) {
        this.activateFormGroup.patchValue({ email: savedEmail });
      }
        //Delay for 3 seconds
       
      }else{
        this.toast.create(error.error)
      }
    });
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

async register() {
  this.registerLoading = true;
    if (this.registerFormGroup.invalid) {
      alert('Please fill all fields correctly.');
      return;
    }

    try {
      const dto = this.registerFormGroup.getRawValue();
      await this.auth.register({
        email: dto.email!,
        password: dto.password!,
        firstName: dto.firstName!,
        lastName: dto.lastName!,
      });

      alert('Account created sucessfully. Check your email for an OTP.');
this.registerLoading = false;
      //await this.router.navigateByUrl('/activate');
      const savedEmail = await this.auth.getPendingActivationEmail();
    if (savedEmail) {
      this.activateFormGroup.patchValue({ email: savedEmail });
    }
    this.registerFormGroup.reset();
      this.screen = 'activate';
    } catch (e: any) {
      this.registerLoading = false;
      alert(e.error);
    } finally {
      this.registerLoading = false;
    }
  }

  private extractError(e: any): string {
    // .NET might send string, object, or validation errors
    const err = e?.error;
    if (!err) return 'Something went wrong.';
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    return 'Request failed.';
  }

 /* register(){
    
    this.registerLoading = true;
    if (this.registerFormGroup.invalid) {
      this.registerFormGroup.markAllAsTouched();
      return;
    }

      let body = {
      Email: this.registerFormGroup.value.email,
      Password: this.registerFormGroup.value.password,
      firstName: this.registerFormGroup.value.firstName,
      lastName: this.registerFormGroup.value.lastName
    };

    this.auth.register(body).subscribe((resp:any)=>{
      this.memberService.presentToast('Account created sucessfully. You will be have to login in order to take or access your membership.', 'success');
      // ⏳ Delay redirect by 4 seconds
      setTimeout(() => {
        this.registerLoading = false;
        this.screen = 'signin';
      }, 4000);
    }, (error: any)=>{
       this.registerLoading = false;
       this.memberService.presentToast(error.error, 'danger');
       console.log(error);
    })
  }*/

    handleScrollStart() {
    console.log('scroll start');
  }

  handleScroll(event: CustomEvent<ScrollDetail>) {
    console.log('scroll', JSON.stringify(event.detail));
  }

  handleScrollEnd() {
    console.log('scroll end');
  }

  change(event: any){
    this.screen = event;
  }

  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  async verify() {
    if (this.activateFormGroup.invalid) {
      await this.showToast('Enter your email and 6-digit OTP.');
      return;
    }

    try {
      const dto = this.activateFormGroup.getRawValue();
      await this.auth.verifyActivationOtp({ email: dto.email!, otp: ''+dto.otp! });

      await this.showToast('Account activated. You can now login.');
      //await this.router.navigateByUrl('/login');
      this.screen = 'signin';
    } catch (e: any) {
      console.log(e);
      await this.showToast(this.extractError(e));
    } finally {
      //await l.dismiss();
    }
  }

  passwordResetLoading = false;

public async resetPassword() {
  this.passwordResetLoading = true;
  try {
    const dto = this.passwordResetFormGroup.getRawValue();

    // Optional: client-side check
    if (dto.password !== dto.confirmPassword) {
      await this.showToast('Passwords do not match.');
      return;
    }

    await this.auth.resetPassword(dto.email!, dto.password!, ''+dto.otp!);
    this.passwordResetLoading = false;
    await this.showToast('Password reset successfully. You can now login.');
    this.screen = 'signin';
    this.passwordResetFormGroup.reset();
  } catch (e: any) {
    this.passwordResetLoading = false;
    console.log(e);
    if(e.error.text === 'Password reset successfully.'){
      //Display toast message, then redirect to log in 
       alert('Password updated succesfully. You are being directed to log-in.');
       //Now sign in
      setTimeout(() => {
        this.screen = 'signin';
        }, 4000); // ⏱ 4 seconds
    }else{
      await this.showToast(this.extractError(e));
    }

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
    } finally {
      //await l.dismiss();
    }
  }

  private async showToast(message: string) {
    const t = await this.toast.create({ message, duration: 2500, position: 'bottom' });
    await t.present();
  }

}
