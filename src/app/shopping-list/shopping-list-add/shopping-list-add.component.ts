import { IngredientsService } from './../../food/ingredients/ingredients.service';
import { Ingredient } from './../../food/ingredients/ingredient.model';
import { Subscription } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { ShoppingListService } from '../shopping-list.service';

@Component({
  selector: 'app-shopping-list-add',
  templateUrl: './shopping-list-add.component.html',
  styleUrls: ['./shopping-list-add.component.scss'],
})
export class ShoppingListAddComponent implements OnInit {
  isLoading = false;
  ingSub: Subscription;
  loadedIngredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = this.loadedIngredients;

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private ingredientsService: IngredientsService,
    private shoppingListService: ShoppingListService
  ) { }

  ngOnInit() {
    this.ingSub = this.ingredientsService.ingredients.subscribe(ings => {
      this.loadedIngredients = ings;
      this.filteredIngredients = this.loadedIngredients
        .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
      // moze da se izostavi ako dugo traje
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.ingredientsService.fetchIngredients().subscribe(() => {
      this.isLoading = false;
    });
  }

  onFilterIngredients(filter: string) {
    if (this.loadedIngredients) {
      this.filteredIngredients = this.loadedIngredients.filter(el => el.name.toLowerCase().startsWith(filter.toLowerCase()));
    }
  }

  amountEntered(amount: number, ingId: string) {
    this.loadedIngredients.find(ing => ing.id === ingId).amount = amount;
  }

  addToShoppingList(ingId: string) {
    const ingForAdd: {
      amount: number;
      ingredientsId: string;
      checked: boolean;
    }[] = [];
    ingForAdd.push({
      amount: +this.loadedIngredients.find(ing => ing.id === ingId).amount,
      ingredientsId: this.loadedIngredients.find(ing => ing.id === ingId).id,
      checked: false
    });
    this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Adding...'
    }).then(loadingEl => {
      loadingEl.present();
      this.shoppingListService.updateShoppingList(ingForAdd, false).subscribe(() => {
        this.loadedIngredients = this.loadedIngredients.filter(ing => ing.id !== ingId);
        this.filteredIngredients = this.filteredIngredients.filter(ing => ing.id !== ingId);
        loadingEl.dismiss();
        this.toastCtrl.create({
          message: 'Ingredient added successfully!',
          duration: 2000,
          cssClass: 'toastClass'
        }).then(toastEl => {
          toastEl.present();
        });
      });
    }
    );
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
