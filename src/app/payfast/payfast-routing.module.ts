import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PayfastPage } from './payfast.page';

const routes: Routes = [
  {
    path: '',
    component: PayfastPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayfastPageRoutingModule {}
