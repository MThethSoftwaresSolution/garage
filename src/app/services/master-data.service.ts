 import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, shareReplay, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root' // Makes the service available application-wide
})
export class MasterDataService {
 
 private apiUrl = environment.baseUrl + 'MasterData'; // Base URL for the MasterDataController
  private allMasterDataCache$: Observable<any> | null = null; // Cache for the 'all' endpoint result

  constructor(private http: HttpClient) { }

  getProvinces(): Observable<any> {
    return this.http
      .get<{ provinces: any[] }>(`${this.apiUrl}/provinces`);
  }

    getMasterData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/commonMasterData`);
  }

  getDistricts(provinceId: number): Observable<any> {
    const params = new HttpParams().set('provinceId', provinceId);

    return this.http
      .get<{ districts: any[] }>(`${this.apiUrl}/districts`, { params });
  }

  getMunicipalities(districtId: number): Observable<any> {
    const params = new HttpParams().set('districtId', districtId);

    return this.http
      .get<{ municipalities: any[]}>(`${this.apiUrl}/municipalities`,{ params });
  }

  getCities(municipalityId: number): Observable<any> {
    const params = new HttpParams().set('municipalityId', municipalityId);

    return this.http
      .get<{ cities: any[] }>(`${this.apiUrl}/cities`, { params });
  }

  getSurburbs(cityId: number): Observable<any> {
    const params = new HttpParams().set('cityId', cityId);

    return this.http
      .get<{ surburbs: any[] }>(`${this.apiUrl}/surburbs`, { params });
  }

  getWards(surburbId: number): Observable<any> {
    const params = new HttpParams().set('surburbId', surburbId);

    return this.http
      .get<{ wards: any[] }>(`${this.apiUrl}/wards`, { params });
  }

}