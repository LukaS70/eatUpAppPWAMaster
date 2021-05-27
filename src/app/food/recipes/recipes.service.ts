import { Nutrition } from './../../shared/nutrition.modal';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Recipe } from './recipe.model';
import { HttpClient } from '@angular/common/http';

interface RecipeData {
  id: string;
  name: string;
  instructions: string;
  image: string;
  ingredients: { ingredientId: string, amount: number }[];
  nutrition: Nutrition;
  reviewRequested: boolean;
  public: boolean;
  category: string;
  creator: string;
}
@Injectable({
  providedIn: 'root'
})
export class RecipesService {
  appRecipes = new BehaviorSubject<Recipe[]>([]);

  get recipes() {
    return this.appRecipes.asObservable(); // posto je subject
  }

  constructor(private authService: AuthService, private http: HttpClient) { }

  fetchRecipes() {
    return this.http.get<{ [key: string]: RecipeData }>('http://localhost:5000/api/recipes')
      .pipe(take(1), map(recipeData => {
        const rec = [];
        for (const key in recipeData.recipes) {
          if (recipeData.recipes.hasOwnProperty(key)) {
            rec.push(new Recipe(
              recipeData.recipes[key].id,
              recipeData.recipes[key].name,
              recipeData.recipes[key].instructions,
              recipeData.recipes[key].image,
              recipeData.recipes[key].ingredients,
              recipeData.recipes[key].nutrition,
              recipeData.recipes[key].reviewRequested,
              recipeData.recipes[key].public,
              recipeData.recipes[key].category,
              recipeData.recipes[key].creator
            ));
          }
        }
        return rec;
      }), tap(rec => {
        this.appRecipes.next(rec);
      }));
  }

  getRecipe(id: string) {
    return this.http.get<RecipeData>(`http://localhost:5000/api/recipes/${id}`)
      .pipe(take(1), map(recipeData => {
        return new Recipe(
          recipeData.id,
          recipeData.name,
          recipeData.instructions,
          recipeData.image,
          recipeData.ingredients,
          recipeData.nutrition,
          recipeData.reviewRequested,
          recipeData.public,
          recipeData.category,
          recipeData.creator
        );
      }));
  }

  addRecipes(
    name: string,
    instructions: string,
    image: string,
    ingredients: { ingredientId: string, amount: number }[],
    nutrition: Nutrition,
    reviewRequested: boolean,
    category: string
  ) {
    return this.http.post<{}>(`http://localhost:5000/api/recipes`,
      {
        name: name,
        instructions: instructions,
        image: image,
        ingredients: ingredients,
        nutrition: nutrition,
        reviewRequested: reviewRequested,
        category: category
      }
    ).pipe(take(1), tap(this.fetchRecipes));  // change ???
  }

  updateRecipe(   //change
    recipeId: string,
    name: string,
    ingredientsForRecipe: { ingredientsId: string, amount: number }[],
    calories: number,
    image: string,
    category: string,
    instructions: string
  ) {
    /* let updatedRecipes: Recipe[];
    let fetchedUserId;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      return this.recipes.pipe(take(1), switchMap(rec => {
        if (!rec || rec.length <= 0) {
          return this.fetchRecipes();
        } else {
          return of(rec);
        }
      }), switchMap(rec => {
        const updatedRecipeIndex = rec.findIndex(recep => recep.id === recipeId);
        updatedRecipes = [...rec];
        const oldRecipe = updatedRecipes[updatedRecipeIndex];
        updatedRecipes[updatedRecipeIndex] = new Recipe(
          oldRecipe.id,
          name,
          ingredientsForRecipe,
          calories,
          image,
          category,
          instructions,
          fetchedUserId
        );
        return this.http.put(
          `https://eatupappproject.firebaseio.com/recipes/${recipeId}.json`,
          { ...updatedRecipes[updatedRecipeIndex], id: null }
        );
      }), tap(() => {
        this.appRecipes.next(updatedRecipes);
      }));
    })); */
  }

  deleteRecipe(id: string) {
    return this.http.delete(`https://eatupappproject.firebaseio.com/recipes/${id}.json`).pipe(switchMap(() => {
      return this.recipes;
    }), take(1), tap(recs => {
      this.appRecipes.next(recs.filter(r => r.id !== id));
    }));
  }
}
