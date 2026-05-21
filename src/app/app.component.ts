import { Component, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { NavigationEnd, Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  profile = {
    name: 'Garage User',
    email: '',
  };

  isLoggedIn = false;
  public router = inject(Router);

  public appPages = [
    { title: 'HOME', url: '/tabs/vehicles', icon: 'home', active: true },
    { title: 'BOOKINGS', url: '/tabs/my-bookings', icon: 'car', active: false },
    { title: 'TRIPS', url: '/tabs/my-exchanges', icon: 'swap-horizontal', active: false },
    { title: 'FLEET', url: '/tabs/host-dashboard', icon: 'calendar', active: false },
    { title: 'PROFILE', url: '/tabs/profile', icon: 'person', active: false },
  ];

  constructor(private menuCtrl: MenuController) {
    this.initializeMenuControl();
    this.initializeDeepLinks();
  }

  onItemTap(page: any) {
    if (!page?.active) {
      this.appPages.forEach((x: any) => (x.active = false));
      page.active = true;
    }

    if (page?.url) {
      this.menuCtrl.close();
      this.router.navigateByUrl(page.url);
    } else {
      this.logout();
    }
  }

  logout() {
    localStorage.clear();
    this.menuCtrl.close();
    this.router.navigateByUrl('/login');
  }

  private initializeDeepLinks() {
    App.addListener('appUrlOpen', (event) => {
      console.log('Deep link opened:', event.url);

      try {
        const parsedUrl = new URL(event.url);

        const isGaragePaymentLink =
          parsedUrl.protocol === 'garage:' &&
          parsedUrl.hostname === 'payment-result';

        if (!isGaragePaymentLink) {
          return;
        }

        const paymentId = parsedUrl.searchParams.get('paymentId');
        const status = parsedUrl.searchParams.get('status');

        if (status === 'success') {
          this.setActiveMenu('/tabs/my-exchanges');

          this.router.navigate(['/tabs/my-exchanges'], {
            queryParams: {
              paymentId,
              status,
            },
          });

          return;
        }

        if (status === 'cancelled') {
          this.setActiveMenu('/tabs/my-bookings');

          this.router.navigate(['/tabs/my-bookings'], {
            queryParams: {
              paymentId,
              status,
            },
          });

          return;
        }

        this.setActiveMenu('/tabs/my-bookings');

        this.router.navigate(['/tabs/my-bookings'], {
          queryParams: {
            paymentId,
            status: status || 'unknown',
          },
        });
      } catch (error) {
        console.error('Failed to process deep link:', error);
      }
    });
  }

  private setActiveMenu(url: string) {
    this.appPages.forEach((page: any) => {
      page.active = page.url === url;
    });
  }

  initializeMenuControl() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const userId = localStorage.getItem('id');
        const name = localStorage.getItem('name') || '';
        const surname = localStorage.getItem('surname') || '';
        const email = localStorage.getItem('username') || '';

        this.setActiveMenu(event.urlAfterRedirects);

        if (!userId) {
          this.menuCtrl.enable(false);
        } else {
          this.profile = {
            name: `${name} ${surname}`.trim() || 'Garage User',
            email,
          };

          this.menuCtrl.enable(true);
        }
      }
    });
  }
}