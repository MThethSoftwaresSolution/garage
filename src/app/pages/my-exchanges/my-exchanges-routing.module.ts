import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyExchangesPage } from './my-exchanges.page';

const routes: Routes = [
  {
    path: '',
    component: MyExchangesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyExchangesPageRoutingModule {}
