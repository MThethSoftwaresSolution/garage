import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import SignaturePad from 'signature_pad';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signature-dialog',
  templateUrl: './signature-dialog.component.html',
  styleUrls: ['./signature-dialog.component.scss'],
    standalone: true,
  imports: [IonicModule, CommonModule],
})
export class SignatureDialogComponent {

@Output() signatureSaved = new EventEmitter<string>();
  private signaturePad!: SignaturePad;

  // Use static: false so Angular waits for DOM
  @ViewChild('signatureCanvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;

  constructor(private modalCtrl: ModalController) {}

  ngAfterViewInit() {
    // Make sure canvas exists
    if (this.canvas && this.canvas.nativeElement) {
      this.signaturePad = new SignaturePad(this.canvas.nativeElement, {
        backgroundColor: 'rgba(255,255,255,0)', // transparent background
        penColor: 'black', // default pen color
      });
    } else {
      console.error('Signature canvas not found!');
    }
  }

  save() {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      const dataUrl = this.signaturePad.toDataURL();
      this.signatureSaved.emit(dataUrl);
      this.modalCtrl.dismiss(dataUrl); // optionally close modal with data
    } else {
      console.warn('Signature pad is empty or not initialized!');
    }
  }

  clear() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  cancel() {
    this.modalCtrl.dismiss(); // just close modal
  }

}
