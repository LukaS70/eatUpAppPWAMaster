import { ShoppingListAddComponent } from './shopping-list-add/shopping-list-add.component';
import { element } from 'protractor';
import { Ingredient } from './../food/ingredients/ingredient.model';
import { take } from 'rxjs/operators';
import { IngredientsService } from './../food/ingredients/ingredients.service';
import { Subscription } from 'rxjs';
import { AlertController, LoadingController, ToastController, ModalController } from '@ionic/angular';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShoppingList } from './shopping-list.model';
import { ShoppingListService } from './shopping-list.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.page.html',
  styleUrls: ['./shopping-list.page.scss'],
})
export class ShoppingListPage implements OnInit, OnDestroy {
  loadedShoppingList: ShoppingList;
  slItems: { ingredient: string, amount: number, checked: boolean }[] = [];
  isLoading = false;
  slSub: Subscription;
  ingSub: Subscription;
  editMode = false;

  slIngredients: { ingredient: Ingredient, isChecked: boolean }[] = [];

  constructor(
    private alertCtrl: AlertController,
    private shoppingListService: ShoppingListService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private ingredientsService: IngredientsService,
    private router: Router,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.slSub = this.shoppingListService.shoppingListItems.subscribe(sl => {
      this.isLoading = true;
      this.slIngredients = [];
      if (sl && sl.items && sl.items.length > 0) {
        this.loadedShoppingList = sl;
        this.slItems = sl.items;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < this.slItems.length; index++) {
          // tslint:disable-next-line:no-shadowed-variable
          const element = this.slItems[index];
          console.log(element);

          if (element.ingredient) {
            this.ingSub = this.ingredientsService.getIngredient(element.ingredient)
              .pipe(take(1)).subscribe(ing => {
                ing.amount = +element.amount;
                // this.ingredients.push(ing);
                // tslint:disable-next-line:prefer-for-of
                for (let ind = 0; ind < this.slIngredients.length; ind++) {
                  if (this.slIngredients[ind].ingredient.id === ing.id) {
                    return;
                  }
                }
                this.slIngredients.push({ ingredient: ing, isChecked: element.checked });
              });
          }
        }
        console.log(this.slIngredients);
      }
      this.isLoading = false;
    }, error => {
      this.alertCtrl.create({
        header: 'An error occured!',
        message: 'Shopping list could not be fetched. Please try again later.',
        buttons: [{ text: 'Okay', handler: () => { this.router.navigate(['/food/tabs/recipes']); } }]
      }).then(alertEl => {
        alertEl.present();
      });
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.slIngredients = [];
    this.shoppingListService.getShoppingListData().pipe(take(1)).subscribe(() => {
      this.isLoading = false;
    });
  }

  ionViewWillLeave() {
    const ingsForUpdate: { ingredient: string, amount: number, checked: boolean }[] = [];
    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < this.slIngredients.length; index++) {
      ingsForUpdate.push({
        ingredient: this.slIngredients[index].ingredient.id,
        amount: +this.slIngredients[index].ingredient.amount,
        checked: this.slIngredients[index].isChecked
      });
    }
    /* this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Saving...'
    }).then(loadingEl => {
      loadingEl.present(); */
    console.log(ingsForUpdate);

    this.shoppingListService.updateShoppingList(ingsForUpdate, true).pipe(take(1)).subscribe(() => {
      this.slIngredients = [];
      /* loadingEl.dismiss();
    }); */
    });
  }

  onAddManuallyToShoppingList() {
    this.modalCtrl.create({ component: ShoppingListAddComponent }).then(modalEl => {
      modalEl.present();
      return modalEl.onDidDismiss();
    });
  }

  onEditShoppingList() {
    if (this.editMode === false) {
      this.editMode = true;
      this.toastCtrl.create({
        message: 'Edit mode!',
        duration: 2000,
        cssClass: 'toastClass'
      }).then(toastEl => {
        toastEl.present();
      });
    } else {
      const ingsForUpdate: { ingredient: string, amount: number, checked: boolean }[] = [];
      // tslint:disable-next-line:prefer-for-of
      for (let index = 0; index < this.slIngredients.length; index++) {
        ingsForUpdate.push({
          ingredient: this.slIngredients[index].ingredient.id,
          amount: +this.slIngredients[index].ingredient.amount,
          checked: this.slIngredients[index].isChecked
        });
      }
      this.loadingCtrl.create({
        keyboardClose: true,
        message: 'Saving...'
      }).then(loadingEl => {
        loadingEl.present();
        this.shoppingListService.updateShoppingList(ingsForUpdate, true).subscribe(() => {
          this.slIngredients = [];
          loadingEl.dismiss();
        });
      });
      this.editMode = false;
    }
  }

  onRemoveCheckedFromShoppingList() {
    if (this.slIngredients.find(ing => ing.isChecked)) {
      this.alertCtrl.create({
        header: 'Remove from shopping list?',
        message: 'Do you really want to remove all selected ingredients from shopping list?',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Remove',
            handler: () => {
              this.loadingCtrl.create({
                keyboardClose: true,
                message: 'Removing...'
              }).then(loadingEl => {
                loadingEl.present();
                const updatedIng: { ingredient: string; amount: number; checked: boolean; }[] = [];
                this.slIngredients = this.slIngredients.filter(item => !item.isChecked);
                // tslint:disable-next-line:prefer-for-of
                for (let index = 0; index < this.slIngredients.length; index++) {
                  // tslint:disable-next-line:no-shadowed-variable
                  const element = this.slIngredients[index];
                  updatedIng.push({
                    ingredient: element.ingredient.id,
                    amount: element.ingredient.amount,
                    checked: element.isChecked
                  });
                }
                this.shoppingListService.updateShoppingList(updatedIng, true).subscribe(() => {
                  loadingEl.dismiss();
                  this.toastCtrl.create({
                    message: 'Ingredients removed successfully!',
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
    } else {
      this.toastCtrl.create({
        message: 'No ingredients selected for removal!',
        duration: 2000,
        cssClass: 'toastClass'
      }).then(toastEl => {
        toastEl.present();
      });
    }
  }

  onRemoveIngredientFromShoppingList(ingId: string) {
    this.slIngredients = this.slIngredients.filter(ing => ing.ingredient.id !== ingId);
  }

  amountEdited(amount: number, ingId: string) {
    this.slIngredients.find(ing => ing.ingredient.id === ingId).ingredient.amount = +amount;
  }

  /* ingChecked(isChecked: boolean, ingId: string) {
    if (isChecked) {
      if (!this.checkedIngredients.find(ing => ing.id === ingId)) {
        this.checkedIngredients.push({id: ingId, checked: isChecked});
      }
    } else {
      if (this.checkedIngredients.find(ing => ing.id === ingId)) {
        this.checkedIngredients = this.checkedIngredients.filter(ing => ing.id !== ingId);
      }
    }
  } */

  ngOnDestroy() {
    if (this.slSub) {
      this.slSub.unsubscribe();
    }
    if (this.ingSub) {
      this.ingSub.unsubscribe();
    }
    this.slIngredients = [];
  }
}
