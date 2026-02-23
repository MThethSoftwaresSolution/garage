import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  apiUrl = environment.baseUrl+'payments';

  constructor(private http: HttpClient) {}

  createPayment(Amount: number, Reference: string, Email: string) {
    return this.http.post<any>(`${this.apiUrl}/create`, {
      Amount,
      Reference,
      Email
    });
  }

  checkStatus(reference: string) {
  return this.http.get<PaymentStatusResponse>(
    `${this.apiUrl}/status/${reference}`
  );
}

}

export interface PaymentStatusResponse {
  reference: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'NOT_FOUND';
}
