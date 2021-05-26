import { take, switchMap } from 'rxjs/operators';
import { IngredientsService } from './../../ingredients/ingredients.service';
import { Recipe } from './../recipe.model';
import { Subscription } from 'rxjs';
import { RecipesService } from './../recipes.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Ingredient } from '../../ingredients/ingredient.model';
import { ShoppingListService } from 'src/app/shopping-list/shopping-list.service';
import { DailyCalories } from 'src/app/my-account/daily-calories.model';
import { AuthService } from 'src/app/auth/auth.service';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'app-recipe-detail',
  templateUrl: './recipe-detail.page.html',
  styleUrls: ['./recipe-detail.page.scss'],
})
export class RecipeDetailPage implements OnInit, OnDestroy {
  private recSub: Subscription;
  private ingSub: Subscription;
  recipe: Recipe;
  recipeId: string;
  ingredients: Ingredient[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private recipesService: RecipesService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private ingredientsService: IngredientsService,
    private toastCtrl: ToastController,
    private shoppingListService: ShoppingListService,
    private authService: AuthService,
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
      this.recSub = this.recipesService.getRecipe(paramMap.get('recipeId')).subscribe(rec => {
        this.recipe = rec;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < rec.ingredientsForRecipe.length; index++) {
          const element = rec.ingredientsForRecipe[index];
          this.ingSub = this.ingredientsService.getIngredient(rec.ingredientsForRecipe[index].ingredientsId)
            .pipe(take(1)).subscribe(ing => {
              ing.amount = rec.ingredientsForRecipe[index].amount;
              this.ingredients.push(ing);
            });
        }
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
  }

  ionViewDidLeave() {
    this.ingredients = [];
  }

  onEditRecipe() {
    this.router.navigate(['/', 'food', 'tabs', 'recipes', 'edit', this.recipeId]);
  }

  onDeleteRecipe() {
    this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'Do you really want to delete this recipe?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          handler: () => {
            this.loadingCtrl.create({
              keyboardClose: true,
              message: 'Deleting...'
            }).then(loadingEl => {
              loadingEl.present();
              this.recipesService.deleteRecipe(this.recipeId).subscribe(() => {
                this.storage.storage.refFromURL(this.recipe.image).delete();
                loadingEl.dismiss();
                this.router.navigateByUrl('/food/tabs/recipes');
                this.toastCtrl.create({
                  message: 'Recipe deleted successfully!',
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

  addToShoppingList() {
    this.alertCtrl.create({
      header: 'Add to Shopping List?',
      message: 'Do you really want to add recipe ingredients to the shopping list?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: () => {
            this.loadingCtrl.create({
              keyboardClose: true,
              message: 'Adding...'
            }).then(loadingEl => {
              loadingEl.present();
              const ingForSl: { amount: number, ingredientsId: string, checked: boolean }[] = [];
              // tslint:disable-next-line:prefer-for-of
              for (let index = 0; index < this.ingredients.length; index++) {
                ingForSl.push({
                  amount: this.ingredients[index].amount,
                  ingredientsId: this.ingredients[index].id,
                  checked: false
                });
              }
              this.shoppingListService.shoppingListItems.pipe(take(1)).subscribe(sl => {
                if (!sl || !sl.id || !sl.ingredientsForShoppingList || !sl.userId) {
                  this.shoppingListService.postShoppingList(ingForSl).subscribe(() => {
                    loadingEl.dismiss();
                    this.router.navigateByUrl('/food/tabs/recipes');
                    this.toastCtrl.create({
                      message: 'Ingredients added successfully!',
                      duration: 2000,
                      cssClass: 'toastClass'
                    }).then(toastEl => {
                      toastEl.present();
                    });
                  });
                } else {
                  this.shoppingListService.updateShoppingList(ingForSl, false).subscribe(() => {
                    loadingEl.dismiss();
                    this.router.navigateByUrl('/food/tabs/recipes');
                    this.toastCtrl.create({
                      message: 'Ingredients added successfully!',
                      duration: 2000,
                      cssClass: 'toastClass'
                    }).then(toastEl => {
                      toastEl.present();
                    });
                  });
                }
              });
            });
          }
        }
      ]
    }).then(alertEl => {
      alertEl.present();
    });
  }

  addCalories() {
    const calorieDay: DailyCalories = new DailyCalories(null, null);
    let dailyCalories: DailyCalories[] = [];
    this.alertCtrl.create({
      header: 'Add to Eaten Calories?',
      message: 'Do you really want to add recipe calories to todays clories count?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: () => {
            this.loadingCtrl.create({
              keyboardClose: true,
              message: 'Adding calories...'
            }).then(loadingEl => {
              loadingEl.present();
              this.authService.user.pipe(take(1), switchMap(user => {
                if (user.dailyCalories) {
                  dailyCalories = user.dailyCalories;
                }
                if (!dailyCalories || dailyCalories.length <= 0) {
                  calorieDay.day = new Date();
                  calorieDay.day.setHours(0, 0, 0, 0);
                  calorieDay.calories = Math.round((this.recipe.calories + Number.EPSILON) * 100) / 100;
                  dailyCalories.push(calorieDay);
                  console.log('adding new because empty');
                } else {
                  const maxDate = new Date(Math.max.apply(Math, dailyCalories.map((o) => new Date(o.day)))); // proveriti da l radi
                  const objLatest = dailyCalories.find((o) => new Date(o.day).getTime() === maxDate.getTime());
                  maxDate.setHours(0, 0, 0, 0);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  if (maxDate.getTime() === now.getTime()) {
                    calorieDay.day = maxDate;
                    calorieDay.calories = Math.round((objLatest.calories + this.recipe.calories + Number.EPSILON) * 100) / 100;
                    dailyCalories = dailyCalories.filter((o) => new Date(o.day).getTime() !== maxDate.getTime());
                    dailyCalories.push(calorieDay);
                    console.log('adding to existing');
                  } else {
                    const newDate = new Date();
                    newDate.setHours(0, 0, 0, 0);
                    calorieDay.day = newDate;
                    calorieDay.calories = Math.round((this.recipe.calories + Number.EPSILON) * 100) / 100;
                    dailyCalories.push(calorieDay);
                    console.log('adding new standard');
                  }
                }
                return this.authService.updateDailyCalories(dailyCalories);
              })).subscribe(() => {
                loadingEl.dismiss();
                this.toastCtrl.create({
                  message: 'Calories added successfuly!',
                  duration: 2000,
                  cssClass: 'toastClass'
                }).then(toastEl => {
                  toastEl.present();
                });
              });
            });
          }
        }]
    }).then(alertEl => {
      alertEl.present();
    });
  }

  ngOnDestroy() {
    if (this.recSub) {
      this.recSub.unsubscribe();
    }
    if (this.ingSub) {
      this.ingSub.unsubscribe();
    }
  }
}
