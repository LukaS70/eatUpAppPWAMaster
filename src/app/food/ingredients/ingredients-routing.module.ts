import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IngredientsPage } from './ingredients.page';

const routes: Routes = [
  {
    path: '',
    component: IngredientsPage
  },
  {
    path: 'new',
    loadChildren: () => import('./ingredient-new/ingredient-new.module').then( m => m.IngredientNewPageModule)
  },
  {
    path: 'edit/:ingredientId',
    loadChildren: () => import('./ingredient-edit/ingredient-edit.module').then( m => m.IngredientEditPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngredientsPageRoutingModule {}
