import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FoodPage } from './food.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: FoodPage,
    children: [
      {
        path: 'recipes',
        loadChildren: () => import('./recipes/recipes.module').then( m => m.RecipesPageModule)
      },
      {
        path: 'ingredients',
        loadChildren: () => import('./ingredients/ingredients.module').then( m => m.IngredientsPageModule)
      },
      {
        path: '',
        redirectTo: '/food/tabs/recipes',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/food/tabs/recipes',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FoodPageRoutingModule {}
