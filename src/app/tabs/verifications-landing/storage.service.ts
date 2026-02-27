import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {

  saveDraft(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  getDraft(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  clearDraft(key: string) {
    localStorage.removeItem(key);
  }
}