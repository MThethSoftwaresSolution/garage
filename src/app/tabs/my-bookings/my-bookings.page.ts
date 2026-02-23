import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.page.html',
  styleUrls: ['./my-bookings.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyBookingsPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

        goBack() {
    this.navCtrl.back();
  }

}
