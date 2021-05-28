import { Nutrition } from './../../../shared/nutrition.modal';
import { IngredientsService } from './../ingredients.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Ingredient } from '../ingredient.model';
import { Router, ActivatedRoute } from '@angular/router';
import { LoadingController, AlertController, NavController, ToastController } from '@ionic/angular';
import { ImagePickerService } from 'src/app/shared/image-picker/image-picker.service';
import { take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-ingredient-edit',
  templateUrl: './ingredient-edit.page.html',
  styleUrls: ['./ingredient-edit.page.scss'],
})
export class IngredientEditPage implements OnInit, OnDestroy {
  form: FormGroup;
  private ingSub: Subscription;
  ingredient: Ingredient;
  ingredientId: string;
  isLoading = false;
  showPicker = false;
  oldUrl: string;

  constructor(
    private ingredientsService: IngredientsService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private imgService: ImagePickerService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('ingredientId')) {
        this.navCtrl.navigateBack('/food/tabs/ingredients');
        return;
      }
      this.ingredientId = paramMap.get('ingredientId');
      this.isLoading = true;
      this.ingSub = this.ingredientsService.getIngredient(paramMap.get('ingredientId')).subscribe(ing => {
        this.ingredient = ing;
        this.form = new FormGroup({
          name: new FormControl(this.ingredient.name.toLowerCase().charAt(0).toUpperCase() + this.ingredient.name.toLowerCase().slice(1), {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          category: new FormControl(this.ingredient.category['id'], {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          measurementUnit: new FormControl(this.ingredient.measurementUnit['id'], {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          calories: new FormControl(this.ingredient.nutrition.calories, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          totalFats: new FormControl(this.ingredient.nutrition.totalFats, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          saturatedFats: new FormControl(this.ingredient.nutrition.saturatedFats, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          totalCarbohydrates: new FormControl(this.ingredient.nutrition.totalCarbohydrates, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          sugar: new FormControl(this.ingredient.nutrition.sugar, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          proteine: new FormControl(this.ingredient.nutrition.proteine, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          }),
          image: new FormControl(this.ingredient.image)
        });
        this.oldUrl = this.ingredient.image;
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error occured!',
          message: 'Ingredient could not be fetched. Please try again later.',
          buttons: [{ text: 'Okay', handler: () => { this.router.navigate(['/food/tabs/ingredients']); } }]
        }).then(alertEl => {
          alertEl.present();
        });
      });
    });
  }

  onUpdateIngredient() {    //change
    if (!this.form.valid || !this.form.get('image').value) {
      return;
    }
    console.log(this.form.value);
    const nutrition = new Nutrition(
      this.form.value.calories,
      this.form.value.totalFats,
      this.form.value.saturatedFats,
      this.form.value.totalCarbohydrates,
      this.form.value.sugar,
      this.form.value.proteine
    );
    this.alertCtrl.create({
      header: 'Edit Ingredient?',
      message: 'Do you want to save changes made to this ingredient?',
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
              message: 'Updating...'
            }).then(loadingEl => {
              loadingEl.present();
              if (!this.showPicker) {
                this.ingredientsService.updateIngredient(
                  this.ingredient.id,
                  this.form.value.name,
                  this.ingredient.image,
                  nutrition,
                  false,
                  this.form.value.measurementUnit,
                  this.form.value.category
                ).subscribe(() => {
                  loadingEl.dismiss();
                  this.form.reset();
                  this.router.navigateByUrl('/food/tabs/ingredients');
                  this.toastCtrl.create({
                    message: 'Ingredient updated successfully!',
                    duration: 2000,
                    cssClass: 'toastClass'
                  }).then(toastEl => {
                    toastEl.present();
                  });
                });
              } else {
                const formData = this.form.value;

                this.ingredientsService.uploadIngredientImage(this.form.get('image').value).pipe(take(1), switchMap(url => {
                  return this.ingredientsService.updateIngredient(
                    this.ingredient.id,
                    formData.name,
                    url['url'],
                    nutrition,
                    false,
                    formData.measurementUnit,
                    formData.category
                  );
                })).subscribe(() => {
                  // this.storage.storage.refFromURL(this.oldUrl).delete();
                  loadingEl.dismiss();
                  this.form.reset();
                  this.router.navigateByUrl('/food/tabs/ingredients');
                  this.toastCtrl.create({
                    message: 'Ingredient updated successfully!',
                    duration: 2000,
                    cssClass: 'toastClass'
                  }).then(toastEl => {
                    toastEl.present();
                  });
                });
              }
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

  onChangeImage() {
    this.showPicker = true;
    this.form.patchValue({ image: null });
  }

  ngOnDestroy() {
    this.ingSub.unsubscribe();
  }

}
