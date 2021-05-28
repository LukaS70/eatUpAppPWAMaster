import { element } from 'protractor';
import { take, switchMap, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { ShoppingList } from './shopping-list.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


interface ShoppingListData {
  id;
  creator;
  items: { ingredient: string, amount: number, checked: boolean }[];
}
@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  appShoppingList = new BehaviorSubject<ShoppingList>(null);

  get shoppingListItems() {
    return this.appShoppingList.asObservable();
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  getShoppingListData() {
    let fetchedShoppingListId;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedShoppingListId = user.shoppingList['id'];

      return this.http.get<{ [key: string]: ShoppingListData }>(`http://localhost:5000/api/shopping-list/${fetchedShoppingListId}`)
        .pipe(take(1), map(shoppingListData => {
          if (shoppingListData) {
            console.log(shoppingListData);

            for (const key in shoppingListData) {
              if (shoppingListData.hasOwnProperty(key)) {
                const shoppingList = new ShoppingList(
                  shoppingListData[key].id,
                  shoppingListData[key].creator,
                  shoppingListData[key].items
                );
                const sl = shoppingList;
                for (let index = 0; index < shoppingList.items.length; index++) {
                  sl.items[index].ingredient = shoppingList.items[index].ingredient['id'];
                }
                this.appShoppingList.next(sl);
                console.log(this.appShoppingList);
              }
            }
          } else {
            console.log('Could not retrive shopping list items');
          }
          return;
        }));
    }));
  }

  updateShoppingList(ingredientsForShoppingList: { ingredient: string, amount: number, checked: boolean }[], editMode: boolean) {
    let fetchedUserId: string;
    let sl;
    let ingredients: {
      ingredient: string;
      amount: number;
      checked: boolean;
    }[];
    return this.authService.user.pipe(take(1), switchMap(user => {
      if (!user) {
        return;
      }
      fetchedUserId = user.id;
      return this.shoppingListItems;
    }), take(1), switchMap(loadedsl => {
      if (!editMode) {
        ingredients = loadedsl.items;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < ingredientsForShoppingList.length; index++) {
          // tslint:disable-next-line:no-shadowed-variable
          const element = ingredientsForShoppingList[index];
          if (ingredients.find(ing => ing.ingredient === element.ingredient)) {
            ingredients.find(ing => ing.ingredient === element.ingredient).amount += element.amount;
          } else {
            ingredients.push(element);
          }
        }
      } else {
        ingredients = ingredientsForShoppingList;
      }
      sl = new ShoppingList(
        loadedsl.id,
        fetchedUserId,
        ingredients
      );
      return this.http.patch(`
      http://localhost:5000/api/shopping-list/${loadedsl.id}`,
        { items: ingredients }
      );
    }), take(1), tap(() => {
      this.appShoppingList.next(sl);
    }));
  }

  deleteShoppingListItem(ingId: string) {
    /* let fetchedUserId: string;   //change ???
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      return this.appShoppingList;
    }), take(1), switchMap(loadedSl => {
      const ingredients = loadedSl.ingredientsForShoppingList.filter(ing => ing.ingredientsId !== ingId);
      return this.http.put(`
      https://eatupappproject.firebaseio.com/shoppingList/${loadedSl.id}.json`,
        { ingredients, fetchedUserId }
      );
    })); */
  }
}
