import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class ScanWithLocationService {
  async scanOnceWithLocation(): Promise<{
    qrPayload: string;
    scannedAtUtc: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracyMeters?: number | null;
  } | null> {
    const camPerm = await BarcodeScanner.requestPermissions();
    if (camPerm.camera !== 'granted') return null;

    await Geolocation.requestPermissions().catch(() => {});

    const scanResult = await BarcodeScanner.scan();
    const first = scanResult.barcodes?.[0];
    const qrPayload = first?.rawValue?.trim();
    if (!qrPayload) return null;

    const scannedAtUtc = new Date().toISOString();

    let latitude: number | null = null;
    let longitude: number | null = null;
    let accuracyMeters: number | null = null;

    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      accuracyMeters = pos.coords.accuracy ?? null;
    } catch {}

    return { qrPayload, scannedAtUtc, latitude, longitude, accuracyMeters };
  }
}