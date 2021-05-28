import { Nutrition } from './../../shared/nutrition.modal';
import { take, switchMap, map } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { RecipesService } from './recipes.service';
import { Subscription } from 'rxjs';
import { Recipe } from './recipe.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { SegmentChangeEventDetail } from '@ionic/core';
import { ShoppingListService } from 'src/app/shopping-list/shopping-list.service';
import { DailyNutrition } from 'src/app/my-account/daily-nutrition.model';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.page.html',
  styleUrls: ['./recipes.page.scss'],
})
export class RecipesPage implements OnInit, OnDestroy {
  loadedRecipes: Recipe[] = [/*
    new Recipe('a', 'salad', [{ingredientsId: 'a' , amount: 2}
    , {ingredientsId: 'b' , amount: 3}], 123, 'https://goop.com/app/uploads/2020/04/whats-gp-cooking-1024x780.jpg', 'salad', 'asd', '2'),
    new Recipe('b', 'brrf', [{ingredientsId: 'a' , amount: 2}
    , {ingredientsId: 'b' , amount: 3}], 123,
  'https://www.maangchi.com/wp-content/uploads/2018/02/roasted-chicken-1.jpg', 'beef', 'fea', '2') */];
  filteredRecipes: Recipe[] = this.loadedRecipes;
  isLoading = false;
  recSub: Subscription;
  showSearchBar = false;
  selectedSegment = 'all';
  disableSegmentSearch = false;

  constructor(
    private authService: AuthService,
    private alertCtrl: AlertController,
    private recipesService: RecipesService,
    private loadingCtrl: LoadingController,
    private router: Router,
    private toastCtrl: ToastController,
    private shoppingListService: ShoppingListService
  ) { }

  ngOnInit() {
    this.recSub = this.recipesService.recipes.subscribe(recs => {
      this.loadedRecipes = recs;
      this.filteredRecipes = this.loadedRecipes
        .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.recipesService.fetchRecipes().subscribe(() => {
      this.isLoading = false;
    });
  }

  onAddNewRecipe() {
    this.router.navigateByUrl('/food/tabs/recipes/new');
  }

  onToggleSearchBar() {
    this.selectedSegment = 'all';
    this.disableSegmentSearch = !this.disableSegmentSearch;
    this.showSearchBar = !this.showSearchBar;
    this.filteredRecipes = this.loadedRecipes;
  }

  onFilterRecipes(filter: string) {
    if (this.loadedRecipes) {
      this.filteredRecipes = this.loadedRecipes.filter(el => el.name.toLowerCase().startsWith(filter.toLowerCase()));
    }
  }

  addToShoppingList(recipeId: string) { // change
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
              const ingredients = this.loadedRecipes.find(rec => rec.id === recipeId).ingredients;
              const ingForSl: { ingredient: string, amount: number, checked: boolean }[] = [];
              // tslint:disable-next-line:prefer-for-of
              for (let index = 0; index < ingredients.length; index++) {
                ingForSl.push({
                  ingredient: ingredients[index].ingredient,
                  amount: ingredients[index].amount,
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

  addCalories(recipeId: string) {
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
              const recNutrition = this.loadedRecipes.find(rec => rec.id === recipeId).nutrition;
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

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.authService.user.pipe(take(1)).subscribe(user => {
      if (event.detail.value === 'myRecipes') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => user.id);
      } else if (event.detail.value === 'chicken') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'chicken');
      } else if (event.detail.value === 'vegan') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'vegan');
      } else if (event.detail.value === 'burger') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'burger');
      } else if (event.detail.value === 'fish') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'fish');
      } else if (event.detail.value === 'pork') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'pork');
      } else if (event.detail.value === 'beef') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'beef');
      } else if (event.detail.value === 'salad') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'salad');
      } else if (event.detail.value === 'pasta') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'pasta');
      } else if (event.detail.value === 'vegetables') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'vegetables');
      } else if (event.detail.value === 'desert') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'desert');
      } else if (event.detail.value === 'soup') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'soup');
      } else if (event.detail.value === 'other') {
        this.filteredRecipes = this.loadedRecipes.filter(recipe => recipe.category['name'] === 'other');
      } else {
        this.filteredRecipes = this.loadedRecipes;
      }
    });
  }

  ngOnDestroy() {
    if (this.recSub) {
      this.recSub.unsubscribe();
    }
  }
}
