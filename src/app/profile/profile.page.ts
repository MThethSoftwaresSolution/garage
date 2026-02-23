import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
 imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class ProfilePage implements OnInit {

    isLoading: boolean = false;
    registerLoading: boolean = false;
    isPasswordUpdate: boolean = false;



 ngOnInit() {
    this.isLoading = false;
    const name = localStorage.getItem('name') ?? '';
    const surname = localStorage.getItem('surname') ?? '';
    const email = localStorage.getItem('username') ?? '';
    const phone = localStorage.getItem('phone') ?? '';

  this.profileUpdateFormGroup = new FormGroup({
      firstName: new FormControl(name, [Validators.required]),
      lastName: new FormControl(surname, [Validators.required]),
      email: new FormControl(email, [Validators.required, Validators.email]),
      phoneNumber: new FormControl("", [Validators.required]),
      password: new FormControl(""),
      confirmPassword: new FormControl("")
    });

  }

  profileUpdateFormGroup: any = {};

  constructor(/*private memberService: MkhontoService,*/ private navCtrl: NavController) { }


      goBack() {
    this.navCtrl.back();
  }

  changePassword(){
    this.isPasswordUpdate = !this.isPasswordUpdate;
    console.log(this.isPasswordUpdate);
  }

    get passwordControlRegistration() {
  return this.profileUpdateFormGroup.get('password');
}

  get passwordControlRegistrationConfirm() {
  return this.profileUpdateFormGroup.get('confirmPassword');
}

update(){

}

}
