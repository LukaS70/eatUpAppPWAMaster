import { IngredientsService } from './../ingredients.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ImagePickerService } from 'src/app/shared/image-picker/image-picker.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize, take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-ingredient-new',
  templateUrl: './ingredient-new.page.html',
  styleUrls: ['./ingredient-new.page.scss'],
})
export class IngredientNewPage implements OnInit {
  form: FormGroup;

  constructor(
    private ingredientsService: IngredientsService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private toastCtrl: ToastController,
    private imgService: ImagePickerService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      measurementUnit: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      calories: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      }),
      image: new FormControl(null)
    });
  }

  onAddIngredient() {
    if (!this.form.valid || !this.form.get('image').value) {
      return;
    }
    console.log(this.form.value);
    this.alertCtrl.create({
      header: 'Save Ingredient?',
      message: 'Do you want to save this ingredient?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: () => {
            this.loadingCtrl.create({
              keyboardClose: true,
              message: 'Saving...'
            }).then(loadingEl => {
              loadingEl.present();

              const formData = this.form.value;
              const filePath = `ingredients/${this.form.get('name').value}-${new Date().getTime()}`;
              const fileRef = this.storage.ref(filePath);
              // let imgUrl;
              console.log(this.form.value);
              this.storage.upload(filePath, this.form.get('image').value).snapshotChanges().pipe(
                finalize(() => { // ovo se poziva samo kada je upload zavrsen
                  fileRef.getDownloadURL().pipe(take(1), switchMap(url => {
                    return this.ingredientsService.addIngredients(
                      formData.name.toLowerCase().charAt(0).toUpperCase() + formData.name.toLowerCase().slice(1),
                      formData.calories,
                      formData.measurementUnit,
                      url
                    );
                  })).subscribe();
                })).subscribe(() => {
                  loadingEl.dismiss();
                  this.form.reset();
                  this.router.navigate(['/food/tabs/ingredients']);
                  this.toastCtrl.create({
                    message: 'Ingredient added successfully!',
                    duration: 2000,
                    cssClass: 'toastClass'
                }).then(toastEl => {
                  toastEl.present();
                });
              });

              /* this.ingredientsService.addIngredients(
                this.form.value.name.toLowerCase().charAt(0).toUpperCase() + this.form.value.name.toLowerCase().slice(1),
                this.form.value.calories,
                this.form.value.measurementUnit,
                this.form.value.image
              ).subscribe(() => {
                loadingEl.dismiss();
                this.form.reset();
                this.router.navigate(['/food/tabs/ingredients']);
                this.toastCtrl.create({
                  message: 'Ingredient added successfully!',
                  duration: 2000,
                  cssClass: 'toastClass'
                }).then(toastEl => {
                  toastEl.present();
                });
              }); */
            });
          }
        }
      ]
    }).then(alertEl => {
      alertEl.present();
    });
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      try {
        imageFile = this.imgService
        .base64toBlob(imageData.replace('data:image/jpeg;base64,', ''), 'image/jpeg');
      } catch (error) {
        // alert
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({ image: imageFile }); // kad dobijemo file, dodajemo ga u formu
  }
}
