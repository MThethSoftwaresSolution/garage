import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainService } from 'src/app/services/main.service';
import { IonicModule, NavController } from '@ionic/angular';
import { Camera, CameraResultType } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-exchange',
  templateUrl: './exchange.page.html',
  styleUrls: ['./exchange.page.scss'],
      standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class ExchangePage implements OnInit {

  bookingId = '';
  exchange:any = null;

  meetingDate = '';
  meetingTime = '';
  location = '';

  images:string[] = [];
  notes = '';

  loading = false;
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private service: MainService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.bookingId = this.route.snapshot.paramMap.get('id')!;
    this.loadExchange();

    const user = JSON.parse(localStorage.getItem('currentUser')!);
    this.currentUserId = user.id;
  }

  loadExchange(){
    this.service.getExchange(this.bookingId).subscribe({
      next:(res:any)=>{
        this.exchange = res;
      },
      error:()=>{
        this.exchange = null;
      }
    });
  }

  isDriver(): boolean {
  return this.exchange?.driverId === this.currentUserId;
}

isHost(): boolean {
  return this.exchange?.hostId === this.currentUserId;
}

  // 🚀 START EXCHANGE
  startExchange(){
    const dateTime = new Date(`${this.meetingDate}T${this.meetingTime}`);

    const payload = {
      bookingId: this.bookingId,
      proposedBy: "driver",
      meetingDateTime: dateTime,
      locationName: this.location,
      placeId: "",
      lat: 0,
      lng: 0
    };

    this.service.startExchange(payload).subscribe(()=>{
      this.loadExchange();
    });
  }

  // ✅ ACCEPT
  accept(){
    this.service.respondExchange({
      bookingId: this.bookingId,
      accept: true
    }).subscribe(()=>{
      this.loadExchange();
    });
  }

  // ❌ REJECT
  reject(){
    this.service.respondExchange({
      bookingId: this.bookingId,
      accept: false
    }).subscribe(()=>{
      this.loadExchange();
    });
  }

  // 📸 TAKE PHOTO
  async takePhoto(){
    const image = await Camera.getPhoto({
      quality: 60,
      resultType: CameraResultType.DataUrl
    });

    this.images.push(image.dataUrl!);
  }

  // 🚗 DRIVER CHECKOUT
  checkout(){
    this.service.driverCheckout({
      bookingId: this.bookingId,
      images: this.images,
      notes: this.notes
    }).subscribe(()=>{
      this.loadExchange();
      this.images = [];
      this.notes = '';
    });
  }

  // 🏁 HOST CHECKIN
  checkin(){
    this.service.hostCheckin({
      bookingId: this.bookingId,
      images: this.images,
      notes: this.notes
    }).subscribe(()=>{
      this.loadExchange();
      this.images = [];
      this.notes = '';
    });
  }

}