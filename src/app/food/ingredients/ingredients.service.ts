import { take, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { Ingredient } from './ingredient.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface IngredientData {
  name: string;
  calories: number;
  measurementUnit: string;
  image: string;
  amount?: number;
}
@Injectable({
  providedIn: 'root'
})
export class IngredientsService {
  appIngredients = new BehaviorSubject<Ingredient[]>([]);

  get ingredients() {
    return this.appIngredients.asObservable(); // posto je subject
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  fetchIngredients() {
    return this.http.get<{ [key: string]: IngredientData }>('https://eatupappproject.firebaseio.com/ingredients.json')
    .pipe(take(1), map(ingredientData => {
      const ing = [];
      for (const key in ingredientData) {
        if (ingredientData.hasOwnProperty(key)) {
          ing.push(new Ingredient(
            key,
            ingredientData[key].name,
            ingredientData[key].calories,
            ingredientData[key].measurementUnit,
            ingredientData[key].image,
            ingredientData[key].amount
          ));
        }
      }
      return ing;
    }), tap(ing => {
      this.appIngredients.next(ing);
    }));
  }

  getIngredient(id: string) {
    return this.http.get<IngredientData>(`https://eatupappproject.firebaseio.com/ingredients/${id}.json`)
    .pipe(take(1), map(ingredientData => {
      return new Ingredient(
        id,
        ingredientData.name,
        ingredientData.calories,
        ingredientData.measurementUnit,
        ingredientData.image,
        ingredientData.amount
      );
    }));
  }

  addIngredients(name: string, calories: number, measurementUnit: string, image: string, amount?: number) {
    let generatedId: string;
    let fetchedUserId: string;
    let newIngredient: Ingredient;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      newIngredient = new Ingredient(
        Math.random().toString(),
        name,
        calories,
        measurementUnit,
        image,
        amount
      );
      return this.http.post<{name: string}>('https://eatupappproject.firebaseio.com/ingredients.json',
      { ...newIngredient, id: null });
    }), switchMap(resData => {
      generatedId = resData.name;
      return this.ingredients;
    }), take(1), tap(ing => {
      newIngredient.id = generatedId;
      this.appIngredients.next(ing.concat(newIngredient));
    }));
  }

  updateIngredient(ingredientId: string, name: string, calories: number, measurementUnit: string, image: string, amount?: number) {
    let updatedIngredients: Ingredient[];
    return this.ingredients.pipe(take(1), switchMap(ings => {
      if (!ings || ings.length <= 0) {
        return this.fetchIngredients();
      } else {
        return of(ings);
      }
    }), switchMap(ings => {
      const updatedIngredientIndex = ings.findIndex(ing => ing.id === ingredientId);
      updatedIngredients = [ ...ings ];
      const oldIngredient = updatedIngredients[updatedIngredientIndex];
      updatedIngredients[updatedIngredientIndex] = new Ingredient(
        oldIngredient.id,
        name,
        calories,
        measurementUnit,
        image,
        amount
      );
      return this.http.put(
        `https://eatupappproject.firebaseio.com/ingredients/${ingredientId}.json`,
        { ...updatedIngredients[updatedIngredientIndex], id: null }
      );
    }), tap(() => {
      this.appIngredients.next(updatedIngredients);
    }));
  }

  deleteIngredient(id: string) {
    return this.http.delete(`https://eatupappproject.firebaseio.com/ingredients/${id}.json`).pipe(switchMap(() => {
      return this.ingredients;
    }), take(1), tap(ings => {
      this.appIngredients.next(ings.filter(i => i.id !== id));
    }));
  }
}
