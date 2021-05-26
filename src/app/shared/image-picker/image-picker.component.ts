import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Capacitor, Plugins, CameraSource, CameraResultType } from '@capacitor/core';

@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>; // da mozemo da pristupimo inputu odavde
  @Output() imagePick = new EventEmitter<string | File>(); // string zbog url,koristimo emitter da bi prihvatili sliku tamo gde nam treba
  selectedImage: string;
  usePicker = false;

  constructor(private platform: Platform) { } // da mozemo da znamo koja platforma je u pitanju (mobile, desktop, hybrid...)

  ngOnInit() {    // ako je hybrid, onda je mobile , ako nije onda je desktop. to je nabolji indikator
    if ((this.platform.is('mobile') && !this.platform.is('hybrid')) || this.platform.is('desktop')) { // ako vaze ovi uslovi, desktip je
      this.usePicker = true;
    }
  }

  onPickImage() {
    if (!Capacitor.isPluginAvailable('Camera') || this.usePicker) {
      this.filePickerRef.nativeElement.click(); // ako nema kamere ili smo na desktopu, da click na input, sto otvara biranje, pa fileChosen
      return;
    }
    Plugins.Camera.getPhoto({
      quality: 20,
      source: CameraSource.Prompt,  // Prompt je da moze da izabere kameru ili galeriju
      correctOrientation: true,   // da rotacija bude dobra
      /* height: 320,
      width: 200, */
      resultType: CameraResultType.DataUrl // da bude kao string
    }).then(image => {
      this.selectedImage = image.dataUrl;
      this.imagePick.emit(image.dataUrl); // da moze da prihvati komponenta druga (new offer)
    }).catch(error => {
      console.log(error);
      if (this.usePicker) {
        this.filePickerRef.nativeElement.click(); // ako ne moze da otvori kameru, da otvori image picker
      }
      return false;
    });
  }

  onFileChosen(event: Event){
    const pickedFile = (event.target as HTMLInputElement).files[0]; // ovo je odabran file
    if (!pickedFile){
      return;
    }
    const fr = new FileReader();  // odabranu sliku prebacujemo u odgovarajuci format i prikazujemo
    fr.onload = () => {
      const dataUrl = fr.result.toString();
      this.selectedImage = dataUrl;
      this.imagePick.emit(pickedFile);
    };
    fr.readAsDataURL(pickedFile);
  }
}
