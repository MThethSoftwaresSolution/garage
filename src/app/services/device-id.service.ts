import { Injectable } from '@angular/core';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class DeviceIdService {
  private readonly KEY = 'app_device_id_v1';

  async getDeviceId(): Promise<string> {
    try {
      const idInfo = await Device.getId();
      if (idInfo?.identifier) return `cap:${idInfo.identifier}`;
    } catch {}

    const existing = await Preferences.get({ key: this.KEY });
    if (existing.value) return `app:${existing.value}`;

    const newId = crypto.randomUUID();
    await Preferences.set({ key: this.KEY, value: newId });
    return `app:${newId}`;
  }
}
