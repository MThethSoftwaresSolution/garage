import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-my-vehicles',
  templateUrl: './my-vehicles.page.html',
  styleUrls: ['./my-vehicles.page.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyVehiclesPage implements OnInit {

  constructor(private navCtrl: NavController) { }

  ngOnInit() {
  }

     goBack() {
    this.navCtrl.back();
  }

}
