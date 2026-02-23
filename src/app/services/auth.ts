import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import {
  RegisterRequest,
  VerifyActivationOtpRequest,
  ResendActivationOtpRequest,
  LoginRequest,
  LoginResponse,
} from './../models/auth.models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl+'account';
    private readonly tokenKey = 'auth_token';
  private readonly emailKey = 'pending_activation_email';

   userData$ = new BehaviorSubject<any>([]);

  constructor(private http: HttpClient, private storage: Storage) {
    this.storage.create();
  }

  // ---------- Register ----------
  async register(dto: any): Promise<{ message: string }> {
    const res = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/register`, dto)
    );

    // store email so activation screen can auto-fill
    await Preferences.set({ key: this.emailKey, value: dto.email });

    return { message: res?.message ?? 'Registration successful. OTP sent.' };
  }

  // ---------- Activation OTP ----------
  async verifyActivationOtp(dto: any): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/verify-activation-otp`, dto)
    );
    return typeof res === 'string' ? res : (res?.message ?? 'Account activated.');
  }

  
    login(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, body);
  }

    forgotPassword(Email: string) {
    return this.http.post(`${this.baseUrl}/forgot-password`, { Email })
  }

async resetPassword(email: string, newPassword: string, otp: string): Promise<string> {
  const res = await firstValueFrom(
    this.http.post<any>(`${this.baseUrl}/reset-password`, {
      email,
      newPassword,
      otp
    })
  );

  return typeof res === 'string'
    ? res
    : (res?.message ?? 'Password has been successfully changed.');
}

  async resendActivationOtp(dto: any): Promise<string> {
    const res = await firstValueFrom(
      this.http.post<any>(`${this.baseUrl}/resend-activation-otp`, dto)
    );
    return typeof res === 'string' ? res : (res?.message ?? 'OTP resent.');
  }

  async getPendingActivationEmail(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.emailKey });
    return value ?? null;
  }

  async clearPendingActivationEmail(): Promise<void> {
    await Preferences.remove({ key: this.emailKey });
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: this.tokenKey });
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.tokenKey });
    return value ?? null;
  }

  async isLoggedIn(): Promise<boolean> {
    return (await this.getToken()) != null;
  }

}
