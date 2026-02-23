import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, shareReplay } from 'rxjs/operators';

type AppError = { error: string };

export type VehicleImage = {
  id: string;
  vehicleId: string;
  url: string;          // ONLINE image url
  caption?: string;
  isCover?: boolean;
  createdAt: string;    // ISO
};

@Injectable({ providedIn: 'root' })
export class MainService {

  // -------- Mock behavior knobs --------
  private readonly networkDelayMs = 300;
  private readonly failRate = 0.0; // set to 0.03 to simulate random failures

  // -------- Lookups in-service --------
  private readonly countriesSeed = [{ countryId: 1, countryName: 'South Africa' }];

  private readonly provincesSeed = [
    { provinceName: 'Gauteng' },
    { provinceName: 'KwaZulu-Natal' },
    { provinceName: 'Western Cape' },
    { provinceName: 'Eastern Cape' },
    { provinceName: 'Free State' },
    { provinceName: 'Limpopo' },
    { provinceName: 'Mpumalanga' },
    { provinceName: 'North West' },
    { provinceName: 'Northern Cape' },
  ];

  private readonly colorsSeed = [
    { vehicleColorId: 1, color: 'Black' },
    { vehicleColorId: 2, color: 'White' },
    { vehicleColorId: 3, color: 'Silver' },
    { vehicleColorId: 4, color: 'Grey' },
    { vehicleColorId: 5, color: 'Blue' },
    { vehicleColorId: 6, color: 'Red' },
  ];

  private readonly makesSeed = [
    { vehicleMakeId: 1, vehicleMakeName: 'Toyota' },
    { vehicleMakeId: 2, vehicleMakeName: 'Volkswagen' },
    { vehicleMakeId: 3, vehicleMakeName: 'Ford' },
    { vehicleMakeId: 4, vehicleMakeName: 'Hyundai' },
    { vehicleMakeId: 5, vehicleMakeName: 'Kia' },
    { vehicleMakeId: 6, vehicleMakeName: 'BMW' },
  ];

  private readonly modelsByMakeSeed: Record<number, Array<{ vehicleModelId: number; modelName: string }>> = {
    1: [
      { vehicleModelId: 101, modelName: 'Corolla' },
      { vehicleModelId: 102, modelName: 'Hilux' },
      { vehicleModelId: 103, modelName: 'Fortuner' },
      { vehicleModelId: 104, modelName: 'Yaris' },
    ],
    2: [
      { vehicleModelId: 201, modelName: 'Polo' },
      { vehicleModelId: 202, modelName: 'Golf' },
      { vehicleModelId: 203, modelName: 'Tiguan' },
    ],
    3: [
      { vehicleModelId: 301, modelName: 'Fiesta' },
      { vehicleModelId: 302, modelName: 'Ranger Wildtrak' },
      { vehicleModelId: 303, modelName: 'Focus' },
    ],
    6: [
      { vehicleModelId: 601, modelName: '3 Series (F30)' },
      { vehicleModelId: 602, modelName: '1 Series' },
      { vehicleModelId: 603, modelName: 'X3' },
    ],
  };

  private readonly odometersSeed = [
    { vehicleOdometerId: 1, odometer: '0 - 25 000 km' },
    { vehicleOdometerId: 2, odometer: '25 001 - 50 000 km' },
    { vehicleOdometerId: 3, odometer: '50 001 - 100 000 km' },
    { vehicleOdometerId: 4, odometer: '100 001 - 150 000 km' },
    { vehicleOdometerId: 5, odometer: '150 001 - 200 000 km' },
    { vehicleOdometerId: 6, odometer: '200 000+ km' },
  ];

  // -------- Online image library (Wikimedia Special:FilePath) --------
  // Key = normalized make|model|year bucket. Add more anytime.
  private readonly onlineImageLibrary: Record<string, string[]> = {
    'toyota|corolla|2020': [
      'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE,%20front%202.29.20.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Toyota%20Corolla%20SE,%20rear%202.29.20.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Toyota%20Corolla%20XII%20IMG%200448.jpg',
    ],
    'volkswagen|polo|2019': [
      'https://commons.wikimedia.org/wiki/Special:FilePath/VW%20Polo%20IV%20Facelift%20Silver%20Edition%2020090620%20front.JPG',
      'https://commons.wikimedia.org/wiki/Special:FilePath/VW%20Polo%20IV%20Facelift%20Silver%20Edition%2020090620%20rear.JPG',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Volkswagen%20Polo%20V%205-door%20front%202012.jpg',
    ],
    'ford|ranger%20wildtrak|2024': [
      'https://commons.wikimedia.org/wiki/Special:FilePath/2024%20Ford%20Ranger%20Wildtrak%20X%20EcoBlue%204x4%20-%201996cc%202.0%20(205PS)%20Diesel%20-%20Blue%20Lightning%20-%2002-2025,%20Front.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Ford%20Ranger%20Limited%202.2%20TDCi%204x2%20-%20Flickr%20-%20The%20Car%20Spy%20(6).jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Ford%20Ranger%20Limited%202.2%20TDCi%204x2%20-%20Flickr%20-%20The%20Car%20Spy%20(10).jpg',
    ],
    'bmw|3%20series%20(f30)|2015': [
      'https://commons.wikimedia.org/wiki/Special:FilePath/White%20BMW%20335i%20xDrive%20(F30).jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/BMW%20320d%20Luxury%20Line%20(F30)%20-%20Frontansicht,%2025.%20August%202013,%20D%C3%BCsseldorf.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/2012%20BMW%20328i%20xDrive%20Sedan%20(F30)%20front%202.16.19.jpg',
    ],

    // Generic fallbacks (used when make/model/year not in library)
    'generic|car|any': [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Car%20%28PSF%29.png',
      'https://commons.wikimedia.org/wiki/Special:FilePath/2018%20Toyota%20Camry%20SE%20front%205.12.18.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/2018%20Honda%20Civic%20Sport%20Hatchback%20front%204.13.18.jpg',
    ]
  };

  // -------- Storage (vehicles + images) --------
  private readonly storageKeyVehicles = 'mock_vehicle_host_online';
  private readonly storageKeyImages = 'mock_vehicle_images_online';

  private vehicleHostStore: any[] = this.loadVehiclesOrSeed();
  private imageStore: VehicleImage[] = this.loadImagesOrSeed();

  // -------- Caching (optional) --------
  private countries$?: Observable<any[]>;
  private colors$?: Observable<any[]>;
  private makes$?: Observable<any[]>;
  private odometers$?: Observable<any[]>;

  // -----------------------------
  // API that your HostDashboardPage expects
  // -----------------------------
  getVehicleHost(userId: string): Observable<any[]> {
    const data = this.vehicleHostStore
      .filter(v => v.reference === userId || !v.reference)
      .map(v => ({
        ...v,
        imagesCount: this.imageStore.filter(img => img.vehicleId === v.id).length,
        coverImage: this.getCoverImageUrl(v.id),
      }));

    return this.simulate(data);
  }

  getCountries(): Observable<any[]> {
    if (this.countries$) return this.countries$;
    this.countries$ = this.simulate(this.countriesSeed).pipe(shareReplay(1));
    return this.countries$;
  }

  getColors(): Observable<any[]> {
    if (this.colors$) return this.colors$;
    this.colors$ = this.simulate(this.colorsSeed).pipe(shareReplay(1));
    return this.colors$;
  }

  getProvinces(countryId: number): Observable<any[]> {
    return this.simulate(this.provincesSeed);
  }

  getVehicleMakes(): Observable<any[]> {
    if (this.makes$) return this.makes$;
    this.makes$ = this.simulate(this.makesSeed).pipe(shareReplay(1));
    return this.makes$;
  }

  getVehicleModelsByMake(makeId: number): Observable<any[]> {
    return this.simulate(this.modelsByMakeSeed[Number(makeId)] ?? []);
  }

  getOdometers(): Observable<any[]> {
    if (this.odometers$) return this.odometers$;
    this.odometers$ = this.simulate(this.odometersSeed).pipe(shareReplay(1));
    return this.odometers$;
  }

  // NEW: Gallery for a vehicle
  getVehicleImages(vehicleId: string): Observable<VehicleImage[]> {
    const images = this.imageStore
      .filter(i => i.vehicleId === vehicleId)
      .sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));

    return this.simulate(images);
  }

  // Mimic “upload by URL” (optional)
  addVehicleImages(vehicleId: string, urls: string[], makeCoverFirst = true): Observable<any> {
    if (!vehicleId) return this.simulateError('VehicleId is required');

    const now = new Date().toISOString();

    // if any incoming cover, clear existing cover
    if (makeCoverFirst) {
      this.imageStore = this.imageStore.map(i =>
        i.vehicleId === vehicleId ? { ...i, isCover: false } : i
      );
    }

    const newImgs: VehicleImage[] = urls.map((url, idx) => ({
      id: this.newId(),
      vehicleId,
      url,
      caption: `Photo ${idx + 1}`,
      isCover: makeCoverFirst && idx === 0,
      createdAt: now,
    }));

    this.imageStore = [...newImgs, ...this.imageStore];
    this.persistImages();
    return this.simulate({ success: true, count: newImgs.length });
  }

  saveVehicle(payload: any): Observable<any> {
    const required = ['NumberPlate', 'MakeId', 'ModelId', 'Year', 'Transmission', 'MarketValue', 'ColorId'];
    for (const key of required) {
      if (payload?.[key] === null || payload?.[key] === undefined || payload?.[key] === '') {
        return this.simulateError(`Missing required field: ${key}`);
      }
    }

    const makeId = Number(payload.MakeId);
    const modelId = Number(payload.ModelId);

    const makeName = this.makesSeed.find(m => m.vehicleMakeId === makeId)?.vehicleMakeName ?? 'Unknown';
    const modelName =
      (this.modelsByMakeSeed[makeId] ?? []).find(m => m.vehicleModelId === modelId)?.modelName ?? 'Unknown';

    const odometerLabel =
      this.odometersSeed.find(o => o.vehicleOdometerId === Number(payload.OdometerId))?.odometer ?? '';

    const vehicleId = this.newId();

    const newItem = {
      id: vehicleId,
      reference: payload.Reference,

      numberPlate: String(payload.NumberPlate).toUpperCase(),
      make: makeName,
      model: modelName,
      year: Number(payload.Year),
      transmission: payload.Transmission,
      odometer: odometerLabel,

      ownerName: `${payload.OwnerName ?? ''}`.trim(),
      rate: Number(payload.MarketValue),
      accepted: false,

      _raw: payload,
    };

    this.vehicleHostStore.unshift(newItem);
    this.persistVehicles();

    // Auto-attach online images that match the make/model/year
    const urls = this.pickOnlineImages(makeName, modelName, Number(payload.Year));
    this.seedVehicleImages(vehicleId, urls, makeName, modelName);

    return this.simulate({ success: true, id: vehicleId });
  }

  // -----------------------------
  // Online image selection
  // -----------------------------
  private pickOnlineImages(makeName: string, modelName: string, year: number): string[] {
    const keyExact = `${this.norm(makeName)}|${this.norm(modelName)}|${year}`;
    const exact = this.onlineImageLibrary[keyExact];
    if (exact?.length) return exact;

    // Try make/model with "any year" by falling back to nearest known year:
    // (Simple approach: find first key that matches make|model|*)
    const prefix = `${this.norm(makeName)}|${this.norm(modelName)}|`;
    const matchKey = Object.keys(this.onlineImageLibrary).find(k => k.startsWith(prefix));
    if (matchKey) return this.onlineImageLibrary[matchKey];

    // Fallback generic
    return this.onlineImageLibrary['generic|car|any'];
  }

  private seedVehicleImages(vehicleId: string, urls: string[], makeName: string, modelName: string) {
    const now = new Date().toISOString();

    // clear cover for this vehicle if any (should not exist on new)
    const images: VehicleImage[] = urls.map((url, idx) => ({
      id: this.newId(),
      vehicleId,
      url,
      caption: idx === 0 ? `${makeName} ${modelName} (Cover)` : `${makeName} ${modelName} Photo ${idx + 1}`,
      isCover: idx === 0,
      createdAt: now,
    }));

    this.imageStore = [...images, ...this.imageStore];
    this.persistImages();
  }

  private getCoverImageUrl(vehicleId: string): string | null {
    const cover = this.imageStore.find(i => i.vehicleId === vehicleId && i.isCover);
    return cover?.url ?? this.imageStore.find(i => i.vehicleId === vehicleId)?.url ?? null;
  }

  // -----------------------------
  // Mock helpers
  // -----------------------------
  private simulate<T>(data: T): Observable<T> {
    if (this.failRate > 0 && Math.random() < this.failRate) {
      return this.simulateError('Random simulated network failure.');
    }
    return of(data).pipe(delay(this.networkDelayMs));
  }

  private simulateError(message: string): Observable<never> {
    const err: AppError = { error: message };
    return throwError(() => err).pipe(delay(this.networkDelayMs));
  }

  private newId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private norm(s: string): string {
    return String(s || '')
      .trim()
      .toLowerCase();
  }

  // -----------------------------
  // Persistence
  // -----------------------------
  private loadVehiclesOrSeed(): any[] {
    const raw = localStorage.getItem(this.storageKeyVehicles);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    // Seed vehicles (same make/model/year as your VehiclesPage example)
    const seed = [
      {
        id: this.newId(),
        reference: '',
        numberPlate: 'ND 123-456',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        transmission: 'Automatic',
        odometer: '50 001 - 100 000 km',
        ownerName: 'John',
        rate: 650,
        accepted: true,
      },
      {
        id: this.newId(),
        reference: '',
        numberPlate: 'CA 987-654',
        make: 'Volkswagen',
        model: 'Polo',
        year: 2019,
        transmission: 'Manual',
        odometer: '25 001 - 50 000 km',
        ownerName: 'Thando',
        rate: 700,
        accepted: false,
      },
      {
        id: this.newId(),
        reference: '',
        numberPlate: 'DRB 777-001',
        make: 'Ford',
        model: 'Ranger Wildtrak',
        year: 2024,
        transmission: 'Automatic',
        odometer: '0 - 25 000 km',
        ownerName: 'Sipho',
        rate: 1200,
        accepted: true,
      },
      {
        id: this.newId(),
        reference: '',
        numberPlate: 'GP 456-888',
        make: 'BMW',
        model: '3 Series (F30)',
        year: 2015,
        transmission: 'Automatic',
        odometer: '100 001 - 150 000 km',
        ownerName: 'Lerato',
        rate: 1400,
        accepted: false,
      },
    ];

    localStorage.setItem(this.storageKeyVehicles, JSON.stringify(seed));
    return seed;
  }

  private loadImagesOrSeed(): VehicleImage[] {
    const raw = localStorage.getItem(this.storageKeyImages);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }

    const now = new Date().toISOString();
    const seed: VehicleImage[] = [];

    // Build images for each seeded vehicle using library
    for (const v of this.vehicleHostStore) {
      const urls = this.pickOnlineImages(v.make, v.model, v.year);
      urls.forEach((url: string, idx: number) => {
        seed.push({
          id: this.newId(),
          vehicleId: v.id,
          url,
          caption: idx === 0 ? `${v.make} ${v.model} (Cover)` : `${v.make} ${v.model} Photo ${idx + 1}`,
          isCover: idx === 0,
          createdAt: now,
        });
      });
    }

    localStorage.setItem(this.storageKeyImages, JSON.stringify(seed));
    return seed;
  }

  private persistVehicles() {
    localStorage.setItem(this.storageKeyVehicles, JSON.stringify(this.vehicleHostStore));
  }

  private persistImages() {
    localStorage.setItem(this.storageKeyImages, JSON.stringify(this.imageStore));
  }
}
