import { Nutrition } from './../../shared/nutrition.modal';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { AuthService } from './../../auth/auth.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Recipe } from './recipe.model';
import { HttpClient } from '@angular/common/http';

interface RecipeData {
  _id?: string;
  id: string;
  name: string;
  instructions: string;
  image: string;
  ingredients: { ingredient: string, amount: number }[];
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
        console.log(rec);
        return rec;
      }), tap(rec => {
        this.appRecipes.next(rec);
      }));
  }

  getRecipe(id: string) {
    return this.http.get<{ [key: string]: RecipeData }>(`http://localhost:5000/api/recipes/${id}`)
      .pipe(take(1), map(recipeData => {
        return new Recipe(
          recipeData.recipe.id,
          recipeData.recipe.name,
          recipeData.recipe.instructions,
          recipeData.recipe.image,
          recipeData.recipe.ingredients,
          recipeData.recipe.nutrition,
          recipeData.recipe.reviewRequested,
          recipeData.recipe.public,
          recipeData.recipe.category,
          recipeData.recipe.creator
        );
      }));
  }

  addRecipes(
    name: string,
    instructions: string,
    image: string,
    ingredients: { ingredient: string, amount: number }[],
    nutrition: Nutrition,
    reviewRequested: boolean,
    category: string
  ) {
    let generatedId: string;
    let creator: string;
    let newRecipe: Recipe;
    return this.http.post<RecipeData>(`http://localhost:5000/api/recipes`,
      {
        name: name,
        instructions: instructions,
        image: image,
        ingredients: ingredients,
        nutrition: nutrition,
        reviewRequested: reviewRequested,
        category: category
      }
    ).pipe(take(1), switchMap(resData => {
      generatedId = resData._id;
      creator = resData.creator
      return this.recipes;
    }), take(1), tap(rec => {
      newRecipe = new Recipe(
        generatedId,
        name,
        instructions,
        image,
        ingredients,
        nutrition,
        reviewRequested,
        true,
        category,
        creator
      );
      this.appRecipes.next(rec.concat(newRecipe));
    }));
  }

  updateRecipe(
    recipeId: string,
    name: string,
    instructions: string,
    image: string,
    ingredients: { ingredient: string, amount: number }[],
    nutrition: Nutrition,
    reviewRequested: boolean,
    category: string
  ) {
    let updatedRecipes: Recipe[];
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
        instructions,
        image,
        ingredients,
        nutrition,
        reviewRequested,
        true,
        category,
        oldRecipe.creator
      );
      return this.http.patch(
        `http://localhost:5000/api/recipes/${recipeId}`,
        {
          name: name,
          instructions: instructions,
          image: image,
          ingredients: ingredients,
          nutrition: nutrition,
          reviewRequested: reviewRequested,
          category: category
        }
      );
    }), tap(() => {
      this.appRecipes.next(updatedRecipes);
    }));
  }

  deleteRecipe(id: string) {
    return this.http.delete(`http://localhost:5000/api/recipes/${id}`).pipe(switchMap(() => {
      return this.recipes;
    }), take(1), tap(recs => {
      this.appRecipes.next(recs.filter(r => r.id !== id));
    }));
  }
}
