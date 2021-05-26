import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecipeNewPageRoutingModule } from './recipe-new-routing.module';

import { RecipeNewPage } from './recipe-new.page';
import { ImagePickerComponentModule } from 'src/app/shared/image-picker/image-picker.component.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    RecipeNewPageRoutingModule,
    ImagePickerComponentModule,
  ],
  declarations: [RecipeNewPage]
})
export class RecipeNewPageModule {}
