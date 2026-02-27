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

const isVetted = localStorage.getItem('isVetted') === 'true';
const isVerAppStarted = localStorage.getItem('isVerAppStarted') === 'true';

  if(isVetted){
     this.navCtrl.navigateForward('/tabs/host-dashboard');
  }
  else if(!isVetted && !isVerAppStarted){
      this.presentToast(
    'Your details have not been verified, you are being redirected to verification screen.', 'warning'
  );

  setTimeout(() => {
    this.router.navigate(['/tabs/verifications-landing']);
  }, 7000);
  }
  else{
    this.presentToast('Your details verification is still in progress', 'danger');
  }

  }

  browseVehicles() {
     this.navCtrl.navigateForward('/tabs/vehicles');
    console.log('Browse Vehicles');
  }

  async presentToast(message: string, color: string = 'danger') {
  const toast = await this.toastController.create({
    message: message,
    duration: 2000,
    position: 'top',
    color: color
  });

  await toast.present();
}

}
