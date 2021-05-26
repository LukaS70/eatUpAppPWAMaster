import { NgForm } from '@angular/forms';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.scss'],
})
export class UserDataComponent implements OnInit {
  @Input() date: string;
  @Input() gender: string;
  @Input() weight: number;
  @Input() height: number;
  @ViewChild('f') form: NgForm;
  suggestedCalories: number;

  constructor(private modalCtrl: ModalController, private loadingCtrl: LoadingController) { }

  ngOnInit() {}

  onConfirmUserData() {
    if (!this.form.valid) {
      return;
    }
    this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Saving data...'
    }).then(alertEl => {
      alertEl.present();
      this.modalCtrl.dismiss({
        userData: {
          firstName: this.form.value['first-name'],
          lastName: this.form.value['last-name'],
          gender: this.form.value['user-gender'],
          dateOfBirth: this.form.value['date-of-birth'],
          weight: this.form.value['user-weight'],
          height: this.form.value['user-height'],
          maxCalories: this.form.value['max-calories']
        }
      }, 'confirm');
      alertEl.dismiss();
    });
  }

  onCancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  calculateCalories() {
    const dateOfBirth = new Date(this.date);
    const ageDifMs = new Date().getTime() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (this.gender === 'male') {
      this.suggestedCalories = Math.round(66.47 + (13.75 * this.weight) + (5.0 * this.height - (6.75 * age)));
    } else if (this.gender === 'female') {
      this.suggestedCalories = Math.round(665.09 + (9.56 * this.weight) + (1.84 * this.height - (4.67 * age)));
    }
  }
}
