import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { CommonModule } from '@angular/common';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,  
  imports: [IonicModule, CommonModule]
})
export class DashboardPage implements OnInit {

  member: any;
  isLoading: boolean = false;

  constructor(private toastController: ToastController, private router: Router, private menuCtrl: MenuController, private navCtrl: NavController,
    private auth: AuthService) { }

  ngOnInit(): void {
    this.isLoading = false;
    this.member = null;
    const userId = localStorage.getItem('id') || '';
  }

 async goTo(page: string) {
  (document.activeElement as HTMLElement | null)?.blur?.();
  await this.menuCtrl.close(); // important if menu involved
  this.router.navigateByUrl(page);
}

 goHost() {
     this.navCtrl.navigateForward('/tabs/host-dashboard');
    console.log('Proceed as Host');
  }

  browseVehicles() {
     this.navCtrl.navigateForward('/tabs/vehicles');
    console.log('Browse Vehicles');
  }

}
