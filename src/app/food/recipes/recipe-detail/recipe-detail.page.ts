import { Nutrition } from './../../../shared/nutrition.modal';
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
import { DailyNutrition } from 'src/app/my-account/daily-nutrition.model';
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
        for (let index = 0; index < rec.ingredients.length; index++) {
          const element = rec.ingredients[index];
          this.ingSub = this.ingredientsService.getIngredient(rec.ingredients[index].ingredient['id'])
            .pipe(take(1)).subscribe(ing => {
              ing.amount = rec.ingredients[index].amount;
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
                /* this.storage.storage.refFromURL(this.recipe.image).delete(); */
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
              const ingForSl: { ingredient: string, amount: number, checked: boolean }[] = [];
              // tslint:disable-next-line:prefer-for-of
              for (let index = 0; index < this.ingredients.length; index++) {
                ingForSl.push({
                  ingredient: this.ingredients[index].id,
                  amount: this.ingredients[index].amount,
                  checked: false
                });
              }
              this.shoppingListService.shoppingListItems.pipe(take(1)).subscribe(sl => {
                if (!sl || !sl.id || !sl.items || !sl.creator) {
                  this.toastCtrl.create({
                    message: 'Something went wrong!',
                    duration: 2000,
                    cssClass: 'toastClass'
                  }).then(toastEl => {
                    toastEl.present();
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
              const recNutrition = this.recipe.nutrition;
              const nutrition = new Nutrition(
                Math.round((recNutrition.calories + Number.EPSILON) * 100) / 100,
                Math.round((recNutrition.totalFats + Number.EPSILON) * 100) / 100,
                Math.round((recNutrition.saturatedFats + Number.EPSILON) * 100) / 100,
                Math.round((recNutrition.totalCarbohydrates + Number.EPSILON) * 100) / 100,
                Math.round((recNutrition.sugar + Number.EPSILON) * 100) / 100,
                Math.round((recNutrition.proteine + Number.EPSILON) * 100) / 100
              );
              return this.authService.updateDailyNutrition(nutrition)
                .subscribe(() => {
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
