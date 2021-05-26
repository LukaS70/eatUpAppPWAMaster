import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecipeEditPageRoutingModule } from './recipe-edit-routing.module';

import { RecipeEditPage } from './recipe-edit.page';
import { ImagePickerComponentModule } from 'src/app/shared/image-picker/image-picker.component.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RecipeEditPageRoutingModule,
    ImagePickerComponentModule
  ],
  declarations: [RecipeEditPage]
})
export class RecipeEditPageModule {}
