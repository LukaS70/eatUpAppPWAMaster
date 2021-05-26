import { RecipesService } from './../recipes.service';
import { Subscription } from 'rxjs';
import { IngredientsService } from './../../ingredients/ingredients.service';
import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { LoadingController, AlertController, ToastController, IonSearchbar } from '@ionic/angular';
import { Router } from '@angular/router';
import { Ingredient } from '../../ingredients/ingredient.model';
import { ImagePickerService } from 'src/app/shared/image-picker/image-picker.service';
import { AngularFireStorage } from '@angular/fire/storage';
import { finalize, take, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-new',
  templateUrl: './recipe-new.page.html',
  styleUrls: ['./recipe-new.page.scss'],
})
export class RecipeNewPage implements OnInit, OnDestroy {
  @ViewChild('search') search: IonSearchbar;
  form: FormGroup;
  recipeIngredients: Ingredient[] = [];
  allIngredients: Ingredient[];
  filteredIngredients: Ingredient[];
  ingSub: Subscription;
  isLoading = false;

  constructor(
    private ingredientsService: IngredientsService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private toastCtrl: ToastController,
    private recipesService: RecipesService,
    private imgService: ImagePickerService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.form = new FormGroup({
      image: new FormControl(null),
      name: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      category: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      instructions: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      calories: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(0)]
      })
    });
    this.ingSub = this.ingredientsService.ingredients.subscribe(ings => {
      this.allIngredients = ings
        .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
      this.isLoading = false;
      // moze da se izostavi ako dugo traje
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.ingredientsService.fetchIngredients().subscribe(() => {
      this.isLoading = false;
    });
  }

  onFindIngredients(filter: string) {
    if (this.allIngredients) {
      if (!filter || filter === '') {
        this.filteredIngredients = [];
      } else {
        this.filteredIngredients = this.allIngredients.filter(el => el.name.toLowerCase().startsWith(filter.toLowerCase()));
      }
    }
  }

  addToRecipeIngredients(ingId: string) {
    if (this.recipeIngredients.find(ing => ing.id === ingId)) {
      this.toastCtrl.create({
        message: 'This ingredient is already added!',
        duration: 2000,
        cssClass: 'toastClass'
      }).then(toastEl => {
        toastEl.present();
      });
    } else {
      this.recipeIngredients.push(this.allIngredients.find(ing => ing.id === ingId));
    }
  }

  removeFromRecipeIngredients(ingId: string) {
    this.recipeIngredients = this.recipeIngredients.filter(ing => ing.id !== ingId);
    this.calculateCalories();
  }

  amountEntered(amount: number, ingId: string) {
    this.recipeIngredients.find(ing => ing.id === ingId).amount = amount;
    this.calculateCalories();
  }

  onAddRecipe() {
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < this.recipeIngredients.length; index++) {
      if (!this.recipeIngredients[index].amount || this.recipeIngredients[index].amount === 0) {
        this.alertCtrl.create({
          header: 'No amount entered!',
          message: 'You need to enter the amount of all the ingredients.',
          buttons: [
            {
              text: 'Okay',
              role: 'cancel'
            }
          ]
        }).then(alertEl => {
          alertEl.present();
        });
        return;
      }
    }
    if (!this.form.valid || !this.form.get('image').value) {
      return;
    }
    this.alertCtrl.create({
      header: 'Save Recipe?',
      message: 'Do you want to save this recipe?',
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
              // tslint:disable-next-line:prefer-const
              let ingsForRecipe: { ingredientsId: string, amount: number }[] = [];
              // tslint:disable-next-line:prefer-for-of
              for (let index = 0; index < this.recipeIngredients.length; index++) {
                const ingId = this.recipeIngredients[index].id;
                const ingAmount = this.recipeIngredients[index].amount;
                ingsForRecipe.push({ ingredientsId: ingId, amount: +ingAmount });
              }

              const formData = this.form.value;
              const filePath = `recipes/${this.form.get('name').value}-${new Date().getTime()}`;
              const fileRef = this.storage.ref(filePath);
              // let imgUrl;
              console.log(this.form.value);
              this.storage.upload(filePath, this.form.get('image').value).snapshotChanges().pipe(
                finalize(() => { // ovo se poziva samo kada je upload zavrsen
                  fileRef.getDownloadURL().pipe(take(1), switchMap(url => {
                    return this.recipesService.addRecipes(
                      formData.name.toLowerCase().charAt(0).toUpperCase() + formData.name.toLowerCase().slice(1),
                      ingsForRecipe,
                      formData.calories,
                      url,
                      formData.category,
                      formData.instructions
                    );
                  })).subscribe();
                })).subscribe(() => {
                loadingEl.dismiss();
                this.form.reset();
                this.recipeIngredients = [];
                this.search.value = '';
                this.router.navigate(['/food/tabs/recipes']);
                this.toastCtrl.create({
                  message: 'Recipe added successfully!',
                  duration: 2000,
                  cssClass: 'toastClass'
                }).then(toastEl => {
                  toastEl.present();
                });
              });

              /* this.recipesService.addRecipes(
                this.form.value.name.toLowerCase().charAt(0).toUpperCase() + this.form.value.name.toLowerCase().slice(1),
                ingsForRecipe,
                this.form.value.calories,
                imgUrl,
                this.form.value.category,
                this.form.value.instructions
              ).subscribe(() => {
                loadingEl.dismiss();
                this.form.reset();
                this.recipeIngredients = [];
                this.search.value = '';
                this.router.navigate(['/food/tabs/recipes']);
                this.toastCtrl.create({
                  message: 'Recipe added successfully!',
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

  checkAmounts() {
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < this.recipeIngredients.length; index++) {
      if (!this.recipeIngredients[index].amount || this.recipeIngredients[index].amount === 0) {
        return false;
      }
    }
    return true;
  }

  calculateCalories() {
    let kcal = 0;
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < this.recipeIngredients.length; index++) {
      if (!this.recipeIngredients[index].amount || this.recipeIngredients[index].amount === 0) {
        continue;
      } else {
        if (this.recipeIngredients[index].measurementUnit === '100g' || this.recipeIngredients[index].measurementUnit === '100ml') {
          kcal += (this.recipeIngredients[index].calories / 100) * this.recipeIngredients[index].amount;
        } else {
          kcal += this.recipeIngredients[index].calories * this.recipeIngredients[index].amount;
        }
      }
    }
    if (kcal !== 0) {
      this.form.get('calories').setValue(Math.round((kcal + Number.EPSILON) * 100) / 100);
    } else {
      this.form.get('calories').setValue(null);
    }
  }

  onImagePicked(imageData: string | File) {
    let imageFile;
    if (typeof imageData === 'string') {
      try {
        imageFile = this.imgService
        .base64toBlob(imageData.replace('data:image/jpeg;base64,', ''), 'image/jpeg');  // ako je string,pretvaramo u file
      } catch (error) {
        console.log(error);
        return;
      }
    } else {
      imageFile = imageData;
    }
    this.form.patchValue({ image: imageFile }); // kad dobijemo file, dodajemo ga u formu
  }

  ngOnDestroy() {
    this.ingSub.unsubscribe();
  }

}
