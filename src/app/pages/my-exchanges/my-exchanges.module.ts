import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyExchangesPageRoutingModule } from './my-exchanges-routing.module';

import { MyExchangesPage } from './my-exchanges.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyExchangesPageRoutingModule
  ]
})
export class MyExchangesPageModule {}
