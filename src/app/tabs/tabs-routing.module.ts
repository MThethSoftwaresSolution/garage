import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./../dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'profile',
        loadChildren: () => import('./../profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full'
  },/  {
    path: 'verifications-landing',
    loadChildren: () => import('./verifications-landing/verifications-landing.module').then( m => m.VerificationsLandingPageModule),
  {
    path: 'bookings-request',
    loadChildren: () => import('./bookings-request/bookings-request.module').then( m => m.BookingsRequestPageModule)
  },
  {
    path: 'host-bookings',
    loadChildren: () => import('./host-bookings/host-bookings.module').then( m => m.HostBookingsPageModule)
  }
  }
*,
  {
    path: 'my-trips',
    loadChildren: () => import('./my-trips/my-trips.module').then( m => m.MyTripsPageModule)
  },
  {
    path: 'my-vehicles',
    loadChildren: () => import('./my-vehicles/my-vehicles.module').then( m => m.MyVehiclesPageModule)
  },
  {
    path: 'vehicles',
    loadChildren: () => import('./vehicles/vehicles.module').then( m => m.VehiclesPageModule)
  },
  {
    path: 'my-bookings',
    loadChildren: () => import('./my-bookings/my-bookings.module').then( m => m.MyBookingsPageModule)
  },
  {
    path: 'host-dashboard',
    loadChildren: () => import('./host-dashboard/host-dashboard.module').then( m => m.HostDashboardPageModule)
  },
  {
    path: 'payments',
    loadChildren: () => import('./payments/payments.module').then( m => m.PaymentsPageModule)
  }*/
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
