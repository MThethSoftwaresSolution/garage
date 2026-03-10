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
    name: 'Mboniseni Thethwayo',
    email: 'Mboniseh@gmail.com',
  };

  isLoggedIn: boolean = false;
  public router = inject(Router)

  public appPages = [
    { title: 'HOME', url: '/tabs/dashboard', icon: 'home', active: true },
    { title: 'MY BOOKINGS', url: '/tabs/my-bookings', icon: 'cash', active: false },
    { title: 'BOOKING REQUESTS', url: 'tabs/host-bookings', icon: 'calendar', active: false },
    { title: 'MY TRIPS', url: '/tabs/my-trips', icon: 'analytics', active: false },
    { title: 'MY VEHICLES', url: '/tabs/host-dashboard', icon: 'calendar', active: false },
    { title: 'BROWSE VEHICLES', url: '/tabs/vehicles', icon: 'car', active: false },
    { title: 'NOTIFCATIONS', url: '/tabs/notifications', icon: 'notifications', active: false },
    { title: 'PROFILE', url: '/tabs/profile', icon: 'person', active: false },
  ];

  constructor(private menuCtrl: MenuController) { 
    this.initializeMenuControl();
    this.initializeDeepLinks();
  }

  onItemTap(page: any) {
    if (!page?.active) {
      const index = this.appPages.findIndex((x: any) => x.active);
      this.appPages[index].active = false;
      page.active = true;
    }

    if (page?.url) {
      // navigate
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
      const url = event.url;
      console.log('Deep link opened:', url);

      // Example: capacitor://localhost/tabs/payfast?paymentId=123&status=cancelled
      if (url.includes('/tabs/payfast')) {
        const parsedUrl = new URL(url);

        const paymentId = parsedUrl.searchParams.get('paymentId');
        const status = parsedUrl.searchParams.get('status');

        // Navigate inside Ionic
        this.router.navigate(['/tabs/payfast'], {
          queryParams: {
            paymentId,
            status
          }
        });
      }
    });
  }

     initializeMenuControl() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const userId = localStorage.getItem('id');
        const name = localStorage.getItem('name');
        const surname = localStorage.getItem('surname');
        const email = localStorage.getItem('username');
        if (!userId) {
          this.menuCtrl.enable(false); // 🔒 hide & disable menu
        } else {
          //Pull names
            this.profile = {
              name: name! +' '+surname!,
              email: email!,
            };
          this.menuCtrl.enable(true);  // 🔓 show menu
        }
      }
    });
  }
}
