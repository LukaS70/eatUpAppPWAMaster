import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecipeNewPage } from './recipe-new.page';

const routes: Routes = [
  {
    path: '',
    component: RecipeNewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecipeNewPageRoutingModule {}
