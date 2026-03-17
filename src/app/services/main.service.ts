import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

type AppError = { error: string };

export type VehicleImage = {
  id: string;
  vehicleId: string;
  url: string;          // ONLINE image url
  caption?: string;
  isCover?: boolean;
  createdAt: string;    // ISO
  order?: any
};

@Injectable({ providedIn: 'root' })
export class MainService {

  private baseUrl = environment.baseUrl+'api/vehicles';
  private mainUrl = environment.baseUrl+'api';

  private colors$?: Observable<any[]>;
  private makes$?: Observable<any[]>;
  private provinces$?: Observable<any[]>;
  private odometers$?: Observable<any[]>;

  createBooking(model: any) {
  return this.http.post(
    this.mainUrl + "/bookings/createBooking",
    model
  );
}

getBookingsByUser(userId: string) {
  return this.http.get<any[]>(
    this.mainUrl + "/bookings/userBookings/" + userId
  );
}

cancelBooking(bookingId: string) {
  return this.http.post(
    this.mainUrl + "/bookings/cancelBooking/" + bookingId,
    {}
  );
}

  initiate(model: { bookingId: string }): Observable<any> {

    return this.http.post(
      this.mainUrl + '/PayFast/initiate',
      model
    );

  }

getHostBookings(hostId: string) {
  return this.http.get<any[]>(
    this.mainUrl + "/bookings/hostBookings/" + hostId
  );
}

acceptBooking(bookingId: string) {
  return this.http.post(
    this.mainUrl + "/bookings/acceptBooking/" + bookingId,
    {}
  );
}

  // ------------------ COLORS ------------------
  getColors(): Observable<any[]> {
    if (!this.colors$) {
      this.colors$ = this.http
        .get<any[]>(`${this.baseUrl}/colors`)
        .pipe(shareReplay(1));
    }
    return this.colors$;
  }

    // ------------------ PROVINCES ------------------
  getProvinces(): Observable<any[]> {
    if (!this.provinces$) {
      this.provinces$ = this.http
        .get<any[]>(`${this.baseUrl}/provinces`)
        .pipe(shareReplay(1));
    }
    return this.provinces$;
  }

  // ------------------ MAKES ------------------
  getVehicleMakes(): Observable<any[]> {
    if (!this.makes$) {
      this.makes$ = this.http
        .get<any[]>(`${this.baseUrl}/makes`)
        .pipe(shareReplay(1));
    }
    return this.makes$;
  }
  

   getVehicleModelsByMake(makeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/models/${makeId}`);
  }

  // ------------------ ODOMETERS ------------------
  getOdometers(): Observable<any[]> {
    if (!this.odometers$) {
      this.odometers$ = this.http
        .get<any[]>(`${this.baseUrl}/odometers`)
        .pipe(shareReplay(1));
    }
    return this.odometers$;
  }

    // ------------------ REGISTER VEHICLE ------------------
  saveVehicle(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, payload);
  }


  constructor(private http: HttpClient) {}

  uploadVehicleImage(data: FormData) {
  return this.http.post(`${this.baseUrl}/images/upload`, data);
}

getVehicleImages(vehicleId: string) {
  debugger;
  const url = `${this.baseUrl}/${vehicleId}/images`;
  return this.http.get<VehicleImage[]>(url);
}

deleteVehicleImage(imageId: string) {
  return this.http.delete(`${this.baseUrl}/images/${imageId}`);
}

setVehicleCoverImage(imageId: string) {
  return this.http.post(`${this.baseUrl}/images/set-cover/${imageId}`, {});
}

reorderVehicleImages(images: any[]) {
  return this.http.post(`${this.baseUrl}/images/reorder`, images);
}

  /*getVehicleHost(userId: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/host/${userId}`);
}*/

getVehicleHost(userId: string) {
  return this.http.get<any[]>(`${this.baseUrl}/host/${userId}`)
    .pipe(
      map((vs:any) =>
        vs.map((v: any) => ({
          ...v,
          coverImage: environment.baseUrl + v.coverImage
            ? environment.baseUrl + v.coverImage
            : null
        }))
      )
    );
}

getAcceptedVehicles() {
  return this.http.get<any[]>(environment.baseUrl + 'api/vehiclehost/public')
  .pipe(
    map((vs:any) =>
      vs.map((v:any)=>({

        ...v,

        vehicleFirstImage: v.vehicleFirstImage
          ? environment.baseUrl + v.vehicleFirstImage
          : 'assets/default.jpg'

      }))
    )
  );
}

getVehicleBookings(vehicleId: string){
  return this.http.get<any[]>(environment.baseUrl + "api/vehiclehost/vehicleBookings/" + vehicleId);
}

getVehicleDetails(id: string) {
  return this.http.get<any>(environment.baseUrl + "api/vehiclehost/details/" + id)
  .pipe(
    map((v:any) => ({
      ...v,

      vImages: v.vImages
        ? v.vImages.map((img: string) =>
            img.startsWith('http') ? img : environment.baseUrl + img
          )
        : []
    }))
  );
}

}
