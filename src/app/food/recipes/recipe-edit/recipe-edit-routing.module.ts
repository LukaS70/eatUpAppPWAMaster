import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecipeEditPage } from './recipe-edit.page';

const routes: Routes = [
  {
    path: '',
    component: RecipeEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipeEditPageRoutingModule {}
