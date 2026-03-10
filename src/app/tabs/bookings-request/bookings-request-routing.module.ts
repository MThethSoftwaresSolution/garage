import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BookingsRequestPage } from './bookings-request.page';

const routes: Routes = [
  {
    path: '',
    component: BookingsRequestPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingsRequestPageRoutingModule {}
