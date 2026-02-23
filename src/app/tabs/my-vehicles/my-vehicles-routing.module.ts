import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyVehiclesPage } from './my-vehicles.page';

const routes: Routes = [
  {
    path: '',
    component: MyVehiclesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyVehiclesPageRoutingModule {}
