import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecipesPage } from './recipes.page';

const routes: Routes = [
  {
    path: '',
    component: RecipesPage
  },
  {
    path: 'new',
    loadChildren: () => import('./recipe-new/recipe-new.module').then( m => m.RecipeNewPageModule)
  },
  {
    path: 'edit/:recipeId',
    loadChildren: () => import('./recipe-edit/recipe-edit.module').then( m => m.RecipeEditPageModule)
  },
  {
    path: ':recipeId',
    loadChildren: () => import('./recipe-detail/recipe-detail.module').then( m => m.RecipeDetailPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipesPageRoutingModule {}
