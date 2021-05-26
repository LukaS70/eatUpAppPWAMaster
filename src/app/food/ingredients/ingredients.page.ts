import { Subscription } from 'rxjs';
import { IngredientsService } from './ingredients.service';
import { Ingredient } from './ingredient.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonItemSliding, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.page.html',
  styleUrls: ['./ingredients.page.scss'],
})
export class IngredientsPage implements OnInit, OnDestroy {
  loadedIngredients: Ingredient[] = [];
  filteredIngredients: Ingredient[] = this.loadedIngredients;
  isLoading = false;
  ingSub: Subscription;

  constructor(
    private alertCtrl: AlertController,
    private ingredientsService: IngredientsService,
    private loadingCtrl: LoadingController,
    private router: Router,
    private toastCtrl: ToastController,
    private storage: AngularFireStorage
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

  onAddNewIngredient() {
    this.router.navigateByUrl('/food/tabs/ingredients/new');
  }

  onEditIngredient(ingredientId: string, slidingEl: IonItemSliding) {
    slidingEl.close();
    this.router.navigate(['/', 'food', 'tabs', 'ingredients', 'edit', ingredientId]);
  }

  onDeleteIngredient(ingredientId: string, slidingEl: IonItemSliding, ingredientImage: string) {
    slidingEl.close();
    this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'Do you really want to delete this ingredient?',
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
              this.ingredientsService.deleteIngredient(ingredientId).subscribe(() => {
                this.storage.storage.refFromURL(ingredientImage).delete();
                loadingEl.dismiss();
                this.toastCtrl.create({
                  message: 'Ingredient deleted successfully!',
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

  onFilterIngredients(filter: string) {
    if (this.loadedIngredients) {
    this.filteredIngredients = this.loadedIngredients.filter(el => el.name.toLowerCase().startsWith(filter.toLowerCase()));
    }
  }

  ngOnDestroy() {
    this.ingSub.unsubscribe();
  }
}
