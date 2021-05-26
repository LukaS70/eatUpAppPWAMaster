import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngredientNewPageRoutingModule } from './ingredient-new-routing.module';

import { IngredientNewPage } from './ingredient-new.page';
import { ImagePickerComponentModule } from 'src/app/shared/image-picker/image-picker.component.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    IngredientNewPageRoutingModule,
    ImagePickerComponentModule
  ],
  declarations: [IngredientNewPage]
})
export class IngredientNewPageModule {}
