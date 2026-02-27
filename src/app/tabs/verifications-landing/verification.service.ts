import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {

  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // ============================================
  // 🔐 AUTH HEADER
  // ============================================

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  // ============================================
  // 🌍 GET PROVINCES
  // ============================================

  getProvinces(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}api/Lookups/provinces`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 🏦 GET BANKS
  // ============================================

  getBanks(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}api/lookups/banks`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 🏦 GET SINGLE BANK
  // ============================================

  getBank(bankId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/banks/${bankId}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 📍 GET SINGLE PROVINCE
  // ============================================

  getProvince(provinceId: number): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/location/province/${provinceId}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 👤 GET USER BY ID
  // ============================================

  getUserById(userId: string): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/users/${userId}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 🚀 SUBMIT VERIFICATION
  // ============================================

  uploadVerification(formData: FormData): Observable<any> {
    return this.http
      .post(`${this.baseUrl}api/verification/upload`, formData, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 🔁 RE-SUBMIT VERIFICATION
  // ============================================

  reSubmitVerification(formData: FormData): Observable<any> {
    return this.http
      .post(`${this.baseUrl}api/verification/upload`, formData, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // 📂 OPTIONAL: UPLOAD SINGLE FILE
  // ============================================

  uploadFile(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http
      .post(`${this.baseUrl}/upload/file`, formData, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  // ============================================
  // ❌ ERROR HANDLER
  // ============================================

  private handleError(error: HttpErrorResponse) {
    console.error('Verification Service Error:', error);

    if (error.status === 401) {
      console.warn('Unauthorized - redirecting to login...');
      localStorage.removeItem('token');
    }

    return throwError(() => error);
  }

}