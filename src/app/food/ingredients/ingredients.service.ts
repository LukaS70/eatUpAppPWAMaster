import { Nutrition } from './../../shared/nutrition.modal';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { Ingredient } from './ingredient.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface IngredientData {
  _id?: string;
  id: string;
  name: string;
  image: string;
  nutrition: Nutrition;
  reviewRequested: boolean;
  public: boolean;
  measurementUnit: string;
  category: string;
  creator: string;
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
    return this.http.get<{ [key: string]: IngredientData }>(`http://localhost:5000/api/ingredients`)
      .pipe(take(1), map(ingredientData => {
        const ing = [];
        console.log(ingredientData);

        for (const key in ingredientData.ingredients) {
          if (ingredientData.ingredients.hasOwnProperty(key)) {
            ing.push(new Ingredient(
              ingredientData.ingredients[key].id,
              ingredientData.ingredients[key].name,
              ingredientData.ingredients[key].image,
              ingredientData.ingredients[key].nutrition,
              ingredientData.ingredients[key].reviewRequested,
              ingredientData.ingredients[key].public,
              ingredientData.ingredients[key].measurementUnit,
              ingredientData.ingredients[key].category,
              ingredientData.ingredients[key].creator,
              ingredientData.ingredients[key].amount
            ));
          }
        }
        console.log(ing);

        return ing;
      }), tap(ing => {
        this.appIngredients.next(ing);
      }));
  }

  getIngredient(id: string) {
    return this.http.get<{ [key: string]: IngredientData }>(`http://localhost:5000/api/ingredients/${id}`)
      .pipe(take(1), map(ingredientData => {
        console.log(ingredientData);

        return new Ingredient(
          id,
          ingredientData.ingredient.name,
          ingredientData.ingredient.image,
          ingredientData.ingredient.nutrition,
          ingredientData.ingredient.reviewRequested,
          ingredientData.ingredient.public,
          ingredientData.ingredient.measurementUnit,
          ingredientData.ingredient.category,
          ingredientData.ingredient.creator,
          ingredientData.ingredient.amount
        );
      }));
  }

  addIngredients(name: string, image: string, nutrition: Nutrition, reviewRequested: boolean, measurementUnit: string, category: string) {
    let generatedId: string;
    let creator: string;
    let newIngredient: Ingredient;
    return this.http.post<IngredientData>(`http://localhost:5000/api/ingredients`,
      {
        name: name,
        image: image,
        nutrition: nutrition,
        reviewRequested: reviewRequested,
        measurementUnit: measurementUnit,
        category: category
      }
    ).pipe(take(1), switchMap(resData => {
      generatedId = resData._id;
      creator = resData.creator
      return this.ingredients;
    }), take(1), tap(ing => {
      newIngredient = new Ingredient(
        generatedId,
        name,
        image,
        nutrition,
        reviewRequested,
        true,
        measurementUnit,
        category,
        creator
      );
      this.appIngredients.next(ing.concat(newIngredient));
    }));
  }

  updateIngredient(ingredientId: string, name: string, image: string, nutrition: Nutrition, reviewRequested: boolean, measurementUnit: string, category: string) { // change
    let updatedIngredients: Ingredient[];
    return this.ingredients.pipe(take(1), switchMap(ings => {
      if (!ings || ings.length <= 0) {
        return this.fetchIngredients();
      } else {
        return of(ings);
      }
    }), switchMap(ings => {
      const updatedIngredientIndex = ings.findIndex(ing => ing.id === ingredientId);
      updatedIngredients = [...ings];
      const oldIngredient = updatedIngredients[updatedIngredientIndex];
      updatedIngredients[updatedIngredientIndex] = new Ingredient(
        oldIngredient.id,
        name,
        image,
        nutrition,
        reviewRequested,
        true,
        measurementUnit,
        category,
        oldIngredient.creator
      );
      return this.http.patch(
        `http://localhost:5000/api/ingredients/${ingredientId}`,
        {
          name: name,
          image: image,
          nutrition: nutrition,
          reviewRequested: reviewRequested,
          measurementUnit: measurementUnit,
          category: category
        }
      );
    }), tap(() => {
      this.appIngredients.next(updatedIngredients);
    }));
  }

  deleteIngredient(id: string) {
    return this.http.delete(`http://localhost:5000/api/ingredients/${id}`).pipe(switchMap(() => {
      return this.ingredients;
    }), take(1), tap(ings => {
      this.appIngredients.next(ings.filter(i => i.id !== id));
    }));
  }
}
