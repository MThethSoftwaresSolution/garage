import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HostBookingsPage } from './host-bookings.page';

const routes: Routes = [
  {
    path: '',
    component: HostBookingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HostBookingsPageRoutingModule {}
