import { take, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Recipe } from './recipe.model';
import { HttpClient } from '@angular/common/http';

interface RecipeData {
  name: string;
  ingredientsForRecipe: {ingredientsId: string, amount: number}[];
  calories: number;
  image: string;
  category: string;
  instructions: string;
  userId: string;
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
    return this.http.get<{ [key: string]: RecipeData }>('https://eatupappproject.firebaseio.com/recipes.json')
      .pipe(take(1), map(recipeData => {
        const rec = [];
        for (const key in recipeData) {
          if (recipeData.hasOwnProperty(key)) {
            rec.push(new Recipe(
              key,
              recipeData[key].name,
              recipeData[key].ingredientsForRecipe,
              recipeData[key].calories,
              recipeData[key].image,
              recipeData[key].category,
              recipeData[key].instructions,
              recipeData[key].userId
            ));
          }
        }
        return rec;
      }), tap(rec => {
        this.appRecipes.next(rec);
      }));
  }

  getRecipe(id: string) {
    let fetchedUserId;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      return this.http.get<RecipeData>(`https://eatupappproject.firebaseio.com/recipes/${id}.json`)
        .pipe(take(1), map(recipeData => {
          return new Recipe(
            id,
            recipeData.name,
            recipeData.ingredientsForRecipe,
            recipeData.calories,
            recipeData.image,
            recipeData.category,
            recipeData.instructions,
            fetchedUserId
          );
        }));
    }));
  }

  addRecipes(
    name: string,
    ingredientsForRecipe: {ingredientsId: string, amount: number}[],
    calories: number,
    image: string,
    category: string,
    instructions: string
  ) {
    let generatedId: string;
    let fetchedUserId: string;
    let newRecipe: Recipe;
    return this.authService.user.pipe(take(1), switchMap(user => {
      fetchedUserId = user.id;
      newRecipe = new Recipe(
        Math.random().toString(),
        name,
        ingredientsForRecipe,
        calories,
        image,
        category,
        instructions,
        fetchedUserId
      );
      return this.http.post<{ name: string }>('https://eatupappproject.firebaseio.com/recipes.json',
        { ...newRecipe, id: null });
    }), switchMap(resData => {
      generatedId = resData.name;
      return this.recipes;
    }), take(1), tap(rec => {
      newRecipe.id = generatedId;
      this.appRecipes.next(rec.concat(newRecipe));
    }));
  }

  updateRecipe(
    recipeId: string,
    name: string,
    ingredientsForRecipe: {ingredientsId: string, amount: number}[],
    calories: number,
    image: string,
    category: string,
    instructions: string
  ) {
    let updatedRecipes: Recipe[];
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
    }));
  }

  deleteRecipe(id: string) {
    return this.http.delete(`https://eatupappproject.firebaseio.com/recipes/${id}.json`).pipe(switchMap(() => {
      return this.recipes;
    }), take(1), tap(recs => {
      this.appRecipes.next(recs.filter(r => r.id !== id));
    }));
  }
}
