import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-my-trips',
  templateUrl: './my-trips.page.html',
  styleUrls: ['./my-trips.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyTripsPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

        goBack() {
    this.navCtrl.back();
  }


}
