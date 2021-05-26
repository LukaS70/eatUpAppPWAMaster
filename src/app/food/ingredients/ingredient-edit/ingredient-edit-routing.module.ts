import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IngredientEditPage } from './ingredient-edit.page';

const routes: Routes = [
  {
    path: '',
    component: IngredientEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngredientEditPageRoutingModule {}
