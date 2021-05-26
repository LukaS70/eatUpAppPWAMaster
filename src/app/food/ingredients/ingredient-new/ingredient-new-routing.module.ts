import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IngredientNewPage } from './ingredient-new.page';

const routes: Routes = [
  {
    path: '',
    component: IngredientNewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IngredientNewPageRoutingModule {}
