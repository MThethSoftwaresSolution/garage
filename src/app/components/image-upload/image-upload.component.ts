import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-image-upload',
   imports: [CommonModule, IonicModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  standalone: true,
})
export class ImageUploadComponent {

 @Output() imageUploaded = new EventEmitter<string>();

  isAndroid = false;

  dragging = false;
  imageSrc: string | null = null;

  async ngOnInit() {
    const info = await Device.getInfo();
    this.isAndroid = info.platform === 'android';
  }

  onFileChange(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith('image/')) return;

    // Optional: size check (e.g. 5MB)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      // you can replace with IonToast if you want
      alert('Image too large (>5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imageSrc = reader.result as string;
      this.imageUploaded.emit(this.imageSrc);
    };
    reader.readAsDataURL(file);

    // reset file input so selecting same file again triggers change event
    if (event?.target) event.target.value = '';
  }

  // Drag & drop for web/desktop
  handleDragEnter() {
    this.dragging = true;
  }

  handleDragLeave() {
    this.dragging = false;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.onFileChange({ target: { files: [file] } });
  }

  cancel() {
    this.imageSrc = null;
    this.imageUploaded.emit('');
  }
}
