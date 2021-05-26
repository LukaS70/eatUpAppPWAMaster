import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IngredientEditPageRoutingModule } from './ingredient-edit-routing.module';

import { IngredientEditPage } from './ingredient-edit.page';
import { ImagePickerComponentModule } from 'src/app/shared/image-picker/image-picker.component.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    IngredientEditPageRoutingModule,
    ImagePickerComponentModule
  ],
  declarations: [IngredientEditPage]
})
export class IngredientEditPageModule {}
