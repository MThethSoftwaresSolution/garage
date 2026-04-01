import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
      standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {

constructor(
    private router: Router,
    private menuCtrl: MenuController
  ) {}

  ngOnInit() {
    this.menuCtrl.enable(false); // 🔒 hide menu on splash

    setTimeout(() => {
      const userId = localStorage.getItem('id');

      if (userId) {
        this.router.navigateByUrl('/tabs/vehicles', { replaceUrl: true });
      } else {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    }, 4000);
  }

  getStarted(){
     this.router.navigateByUrl('/login', { replaceUrl: true });
  }

}
