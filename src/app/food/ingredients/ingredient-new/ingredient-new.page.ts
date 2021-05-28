import { Nutrition } from './../../../shared/nutrition.modal';
import { IngredientsService } from './../ingredients.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ImagePickerService } from 'src/app/shared/image-picker/image-picker.service';
import { take, switchMap } from 'rxjs/operators';

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
    private imgService: ImagePickerService
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      category: new FormControl(null, {
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
      totalFats: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      }),
      saturatedFats: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      }),
      totalCarbohydrates: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      }),
      sugar: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      }),
      proteine: new FormControl(null, {
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

              this.ingredientsService.uploadIngredientImage(this.form.get('image').value).pipe(take(1), switchMap(url => {
                const nutrition = new Nutrition(
                  formData.calories,
                  formData.totalFats,
                  formData.saturatedFats,
                  formData.totalCarbohydrates,
                  formData.sugar,
                  formData.proteine
                );
                return this.ingredientsService.addIngredients(
                  formData.name.toLowerCase().charAt(0).toUpperCase() + formData.name.toLowerCase().slice(1),
                  url['url'],
                  nutrition,
                  false,  
                  formData.measurementUnit,
                  formData.category
                );
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
