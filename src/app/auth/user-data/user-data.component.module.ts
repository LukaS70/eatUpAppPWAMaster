import { UserDataComponent } from './user-data.component';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    declarations: [
        UserDataComponent
    ],
    imports: [
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        CommonModule
    ],
    entryComponents: [
        UserDataComponent
    ]
})
export class UserDataComponentModule { }
