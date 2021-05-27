import { take, switchMap, map, finalize } from 'rxjs/operators';
import { RecipesService } from './../recipes.service';
import { IngredientsService } from './../../ingredients/ingredients.service';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { IonSearchbar, LoadingController, AlertController, ToastController, NavController } from '@ionic/angular';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Ingredient } from '../../ingredients/ingredient.model';
import { Router, ActivatedRoute } from '@angular/router';
import { Recipe } from '../recipe.model';
import { ImagePickerService } from 'src/app/shared/image-picker/image-picker.service';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.page.html',
  styleUrls: ['./recipe-edit.page.scss'],
})
export class RecipeEditPage implements OnInit, OnDestroy {
  @ViewChild('search') search: IonSearchbar;
  form: FormGroup;
  recipeId: string;
  recipe: Recipe;
  recipeIngredients: Ingredient[] = [];
  allIngredients: Ingredient[];
  filteredIngredients: Ingredient[];
  ingSub: Subscription;
  ingSub2: Subscription;
  recSub: Subscription;
  isLoading = false;
  showPicker = false;
  oldUrl: string;

  constructor(
    private ingredientsService: IngredientsService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router,
    private toastCtrl: ToastController,
    private recipesService: RecipesService,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private imgService: ImagePickerService,
    private storage: AngularFireStorage
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('recipeId')) {
        this.navCtrl.navigateBack('/food/tabs/recipes');
        return;
      }
      this.recipeId = paramMap.get('recipeId');
      this.isLoading = true;
      this.ingSub = this.ingredientsService.ingredients.subscribe(ings => {
        this.allIngredients = ings
          .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
        this.recSub = this.recipesService.getRecipe(paramMap.get('recipeId')).pipe(take(1)).subscribe(rec => {
          this.recipe = rec;
          const ingreds: Ingredient[] = [];
          // tslint:disable-next-line:prefer-for-of
          for (let index = 0; index < rec.ingredients.length; index++) {
            const element = rec.ingredients[index];
            this.ingSub2 = this.ingredientsService.getIngredient(rec.ingredients[index].ingredientId)
              .pipe(take(1)).subscribe(ing => {
                ing.amount = rec.ingredients[index].amount;
                ingreds.push(ing);
              });
          }
          console.log(ingreds);
          this.recipeIngredients = ingreds;
          this.form = new FormGroup({
            image: new FormControl(rec.image),
            name: new FormControl(rec.name, {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            category: new FormControl(rec.category, {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            instructions: new FormControl(rec.instructions, {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            calories: new FormControl(rec.nutrition.calories, {
              updateOn: 'blur',
              validators: [Validators.required, Validators.min(0)]
            })
          });
          this.oldUrl = rec.image;
          this.isLoading = false;
        }, error => {
          this.alertCtrl.create({
            header: 'An error occured!',
            message: 'Recipe could not be fetched. Please try again later.',
            buttons: [{ text: 'Okay', handler: () => { this.router.navigate(['/food/tabs/recipes']); } }]
          }).then(alertEl => {
            alertEl.present();
          });
        });
      });
      /* this.isLoading = true;
      this.ingSub = this.ingredientsService.ingredients.pipe(take(1), map(ings => {
        return this.allIngredients = ings
          .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
      }), take(1), switchMap( () => {
        return this.recipesService.getRecipe(paramMap.get('recipeId'));
      }), take(1), map(rec => {
        this.recipe = rec;
        const ingreds: Ingredient[] = [];
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < rec.ingredientsForRecipe.length; index++) {
          const ing = this.allIngredients.find(i => i.id === rec.ingredientsForRecipe[index].ingredientsId);
          console.log(ing);
          console.log(this.allIngredients);
          console.log(this.recipe);
          ing.amount = rec.ingredientsForRecipe[index].amount;
          ingreds.push(ing);
        }
        console.log(ingreds);
        this.recipeIngredients = ingreds;
        return;
      })).subscribe(() => {
        this.form = new FormGroup({
          image: new FormControl(this.recipe.image),
          name: new FormControl(this.recipe.name, {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          category: new FormControl(this.recipe.category, {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          instructions: new FormControl(this.recipe.instructions, {
            updateOn: 'blur',
            validators: [Validators.required]
          }),
          calories: new FormControl(this.recipe.calories, {
            updateOn: 'blur',
            validators: [Validators.required, Validators.min(0)]
          })
        });
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error occured!',
          message: 'Recipe could not be fetched. Please try again later.',
          buttons: [{ text: 'Okay', handler: () => { this.router.navigate(['/food/tabs/recipes']); } }]
        }).then(alertEl => {
          alertEl.present();
          console.log(error);
        });
      }); */
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

  onUpdateRecipe() {      //change
    // tslint:disable-next-line:prefer-for-of
    /* for (let index = 0; index < this.recipeIngredients.length; index++) {
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
      header: 'Edit Recipe?',
      message: 'Do you want to save changes made to this recipe?',
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
                ingsForRecipe.push({ ingredientsId: ingId, amount: ingAmount });
              }
              if (!this.showPicker) {
                this.recipesService.updateRecipe(
                  this.recipeId,
                  this.form.value.name.toLowerCase().charAt(0).toUpperCase() + this.form.value.name.toLowerCase().slice(1),
                  ingsForRecipe,
                  this.form.value.calories,
                  this.recipe.image,
                  this.form.value.category,
                  this.form.value.instructions
                ).subscribe(() => {
                  loadingEl.dismiss();
                  this.form.reset();
                  this.recipeIngredients = [];
                  this.search.value = '';
                  this.router.navigate(['/food/tabs/recipes']);
                  this.toastCtrl.create({
                    message: 'Recipe updated successfully!',
                    duration: 2000,
                    cssClass: 'toastClass'
                  }).then(toastEl => {
                    toastEl.present();
                  });
                });
              } else {
                const formData = this.form.value;
                const filePath = `recipes/${this.form.get('name').value}-${new Date().getTime()}`;
                const fileRef = this.storage.ref(filePath);
                // let imgUrl;
                console.log(this.form.value);
                this.storage.upload(filePath, this.form.get('image').value).snapshotChanges().pipe(
                  finalize(() => { // ovo se poziva samo kada je upload zavrsen
                    fileRef.getDownloadURL().pipe(take(1), switchMap(url => {
                      this.storage.storage.refFromURL(this.oldUrl).delete();
                      return this.recipesService.updateRecipe(
                        this.recipeId,
                        formData.name.toLowerCase().charAt(0).toUpperCase() + formData.name.toLowerCase().slice(1),
                        ingsForRecipe,
                        formData.calories,
                        url,
                        formData.category,
                        formData.instructions
                      );
                    })).subscribe();
                  })).subscribe(() => {
                    // this.storage.storage.refFromURL(this.oldUrl).delete();
                    loadingEl.dismiss();
                    this.form.reset();
                    this.recipeIngredients = [];
                    this.search.value = '';
                    this.router.navigate(['/food/tabs/recipes']);
                    this.toastCtrl.create({
                      message: 'Recipe updated successfully!',
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
    }); */
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
          kcal += (this.recipeIngredients[index].nutrition.calories / 100) * this.recipeIngredients[index].amount;
        } else {
          kcal += this.recipeIngredients[index].nutrition.calories * this.recipeIngredients[index].amount;
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
    if (this.ingSub) {
      this.ingSub.unsubscribe();
    }
    if (this.ingSub2) {
      this.ingSub2.unsubscribe();
    }
    if (this.recSub) {
      this.recSub.unsubscribe();
    }
  }
}
