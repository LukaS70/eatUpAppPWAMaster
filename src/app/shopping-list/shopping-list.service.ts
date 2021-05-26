import { element } from 'protractor';
import { take, switchMap, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './../auth/auth.service';
import { ShoppingList } from './shopping-list.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


interface ShoppingListData {
  fetchedUserId;
  ingredients: { amount: number, checked: boolean, ingredientsId: string }[];
}
@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  appShoppingList = new BehaviorSubject<ShoppingList>(null);
  /* appShoppingList = new BehaviorSubject<ShoppingList>(
    new ShoppingList(
      'asd',
      [{amount: 111, ingredientsId: '-MECeMQ6Hy7-Wtw_h80P', checked: false},
      {amount: 222, ingredientsId: '-MECeMQ6Hy7-Wtw_h80P', checked: false},
    {amount: 333, ingredientsId: '-MECf02c7GKLrY-b24--', checked: false}],
      'asd'
    )
  ); */

  get shoppingListItems() {
    return this.appShoppingList.asObservable();
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  /*  getShoppingListData() {
     let fetchedUserdId;
     return this.authService.user.pipe(take(1), switchMap(user => {
       fetchedUserdId = user.id;
       return this.http.get<{ [key: string]: ShoppingListData }>(
         `https://eatupappproject.firebaseio.com/shoppingListData.json?orderBy="userId"&equalTo="${fetchedUserdId}"
        `)
       .pipe(take(1), map(shoppingListData => {
         if (shoppingListData) {
           for (const key in shoppingListData) {
             if (shoppingListData.hasOwnProperty(key)) {
               let item;
               const items = [];
               // tslint:disable-next-line:prefer-for-of
               for (let index = 0; index < shoppingListData[key].ingredientsForShoppingList.length; index++) {
                 // tslint:disable-next-line:no-shadowed-variable
                 const element = shoppingListData[key].ingredientsForShoppingList[index];
                 item = new ShoppingListItem(
                   element.amount,
                   element.ingredientsId,
                   element.customName
                 );
                 items.push(item);
               }
               this.appShoppingList.next(items);
               console.log(this.appShoppingList);
             }
           }
         } else {
           console.log('Could not retrive shopping list items');
         }
         return;
       }));
     }));
   } */
  getShoppingListData() {
    let fetchedUserId;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      return this.http.get<{ [key: string]: ShoppingListData }>(`https://eatupappproject.firebaseio.com/shoppingList.json?orderBy="fetchedUserId"&equalTo="${fetchedUserId}"`)
        .pipe(take(1), map(shoppingListData => {
          if (shoppingListData) {
            for (const key in shoppingListData) {
              if (shoppingListData.hasOwnProperty(key)) {
                const shoppingList = new ShoppingList(
                  key,
                  shoppingListData[key].fetchedUserId,
                  shoppingListData[key].ingredients
                );
                this.appShoppingList.next(shoppingList);
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

  postShoppingList(ingredients: { amount: number, ingredientsId: string, checked: boolean }[]) {
    let fetchedUserId: string;
    let generatedId: string;
    let slItems: ShoppingList;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      slItems = new ShoppingList(
        Math.random.toString(),
        fetchedUserId,
        ingredients
      );
      return this.http.post<{ name: string }>('https://eatupappproject.firebaseio.com/shoppingList.json', { ingredients, fetchedUserId });
    }), switchMap(resData => {
      generatedId = resData.name;
      return this.shoppingListItems;
    }), take(1), tap(sl => {
      slItems.id = generatedId;
      this.appShoppingList.next(slItems);
    }));
  }

  updateShoppingList(ingredientsForShoppingList: { amount: number, ingredientsId: string, checked: boolean }[], editMode: boolean) {
    let fetchedUserId: string;
    let sl;
    let ingredients: {
      amount: number;
      ingredientsId: string;
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
        ingredients = loadedsl.ingredientsForShoppingList;
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < ingredientsForShoppingList.length; index++) {
          // tslint:disable-next-line:no-shadowed-variable
          const element = ingredientsForShoppingList[index];
          if (ingredients.find(ing => ing.ingredientsId === element.ingredientsId)) {
            ingredients.find(ing => ing.ingredientsId === element.ingredientsId).amount += element.amount;
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
      return this.http.put(`
      https://eatupappproject.firebaseio.com/shoppingList/${loadedsl.id}.json`,
        { ingredients, fetchedUserId }
      );
    }), take(1), tap(() => {
      this.appShoppingList.next(sl);
    }));
  }

  /* deleteShoppingListItem(ingId: string) {
    let fetchedUserId: string;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      return this.appShoppingList;
    }), take(1), switchMap(loadedSl => {
      const ingredients = loadedSl.ingredientsForShoppingList.filter(ing => ing.ingredientsId !== ingId);
      return this.http.put(`
      https://eatupappproject.firebaseio.com/shoppingList/${loadedSl.id}.json`,
        { ingredients, fetchedUserId }
      );
    }));
  } */
}
