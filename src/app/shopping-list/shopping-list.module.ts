import { ShoppingListAddComponent } from './shopping-list-add/shopping-list-add.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShoppingListPageRoutingModule } from './shopping-list-routing.module';

import { ShoppingListPage } from './shopping-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ShoppingListPageRoutingModule
  ],
  declarations: [ShoppingListPage, ShoppingListAddComponent],
  entryComponents: [ShoppingListAddComponent]
})
export class ShoppingListPageModule {}
