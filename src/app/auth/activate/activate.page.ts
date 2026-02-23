import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.page.html',
  styleUrls: ['./activate.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ActivatePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
