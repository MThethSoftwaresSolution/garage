import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HostDashboardPage } from './host-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: HostDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HostDashboardPageRoutingModule {}
