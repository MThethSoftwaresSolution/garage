import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { IonicStorageModule } from '@ionic/storage-angular';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, 
    CommonModule,
    IonicModule.forRoot(), 
    HttpClientModule,
    AppRoutingModule,BrowserAnimationsModule,
    IonicStorageModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {}
