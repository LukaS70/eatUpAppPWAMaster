import { NgModule } from '@angular/core';
import { ImagePickerComponent } from './image-picker.component';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [
        IonicModule,
        CommonModule
    ],
    exports: [
        ImagePickerComponent
    ],
    declarations: [
        ImagePickerComponent
    ]
})
export class ImagePickerComponentModule { }

