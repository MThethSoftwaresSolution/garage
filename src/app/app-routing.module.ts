import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage)
    , children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./../app/dashboard/dashboard.page').then(m => m.DashboardPage)
      }, {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.page').then(m => m.ProfilePage)
      }, {
        path: 'donations',
        loadComponent: () =>
           import('./payfast/payfast.page').then(m => m.PayfastPage)
      }
      , {
        path: 'my-vehicles',
        loadComponent: () =>
           import('./../app/tabs/my-vehicles/my-vehicles.page').then(m => m.MyVehiclesPage)
      }
      , {
        path: 'vehicles',
        loadComponent: () =>
           import('./../app/tabs/vehicles/vehicles.page').then(m => m.VehiclesPage)
      }, {
        path: 'payments',
        loadComponent: () =>
           import('./../app/tabs/payments/payments.page').then(m => m.PaymentsPage)
      },{
        path: 'vehicle/:id',
        loadComponent: () => import('./../app/tabs/vehicles/vehicle-details/vehicle-details.page').then(m => m.VehicleDetailsPage)
      }, {
        path: 'my-trips',
        loadComponent: () =>
           import('./../app/tabs/my-trips/my-trips.page').then(m => m.MyTripsPage)
      }, {
        path: 'my-bookings',
        loadComponent: () =>
           import('./../app/tabs/my-bookings/my-bookings.page').then(m => m.MyBookingsPage)
      },{
        path: 'host-bookings',
        loadComponent: () =>
           import('./../app/tabs/host-bookings/host-bookings.page').then(m => m.HostBookingsPage)
      }, {
        path: 'host-dashboard',
        loadComponent: () =>
           import('./../app/tabs/host-dashboard/host-dashboard.page').then(m => m.HostDashboardPage)
      },{
        path: 'payfast',
        loadComponent: () =>
          import('./payfast/payfast.page').then(m => m.PayfastPage)
      },
      {
        path: 'membership',
        loadComponent: () =>
          import('./../app/dashboard/dashboard.page').then(m => m.DashboardPage)
      }
      ,
      {
        path: 'notifications',
        loadComponent: () =>
          import('./../app/notifications/notifications.page').then(m => m.NotificationsPage)
      },
      {
        path: 'verifications-landing',
        loadComponent: () =>
          import('./../app/tabs/verifications-landing/verifications-landing.page').then(m => m.VerificationsLandingPage)
      },
      {
        path: 'booking-request',
        loadComponent: () =>
          import('./../app/tabs/bookings-request/bookings-request.page').then(m => m.BookingsRequestPage)
      }
    
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then(m => m.RegisterPage)
  },
    {
    path: 'activate',
    loadChildren: () => import('./auth/activate/activate.page').then( m => m.ActivatePage)
  }


];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
