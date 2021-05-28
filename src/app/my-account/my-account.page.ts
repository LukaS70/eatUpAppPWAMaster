import { Nutrition } from './../shared/nutrition.modal';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { User } from '../auth/user.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import {
  LoadingController,
  AlertController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { UserDataComponent } from '../auth/user-data/user-data.component';
import { NgForm } from '@angular/forms';
import { ISODateString } from '@capacitor/core';
import { ChartDataSets } from 'chart.js';
import { Label, Color } from 'ng2-charts';
import { DailyNutrition } from './daily-nutrition.model';
import { take } from 'rxjs/operators';


@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.page.html',
  styleUrls: ['./my-account.page.scss'],
})
export class MyAccountPage implements OnInit, OnDestroy {
  user: User;
  editedUser: User;
  authSub: Subscription;
  isLoading = false;
  date: ISODateString;
  @ViewChild('f') form: NgForm;
  suggestedCalories: number;
  editMode = false;
  displayingData: string = 'calories';

  chartData: ChartDataSets[] = [{ data: null, label: null }];
  chartLabels: Label[];

  chartData2: ChartDataSets[] = [{ data: null, label: null, barPercentage: 1, categoryPercentage: 1 }];
  chartLabels2: Label[];

  chartOptions = {};

  chartOptions2 = {};

  chartColors: Color[] = [
    {
      borderColor: '#000000',
      backgroundColor: '#cae5c4',
      hoverBackgroundColor: '#cfe8ca',
      hoverBorderColor: '#success',
      pointBackgroundColor: '#438a06',
      pointBorderColor: '#success',
      borderWidth: 1
    }
  ];

  chartColors2: Color[] = [{}];

  chartType = 'line';
  chartType2 = 'horizontalBar';

  chartPlugins2 = {};

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() { // bilo je didEnter, ovako deluje da bolje radi
    this.isLoading = true;
    this.authSub = this.authService.user.subscribe((activeUser) => {
      if (!activeUser) {
        return;
      }
      this.user = activeUser;
      this.editedUser = new User(
        this.user.id,
        this.user.email,
        this.user.firstName,
        this.user.lastName,
        this.user.gender,
        this.user.dateOfBirth,
        this.user.weight,
        this.user.height,
        this.user.maxCalories,
        this.user.dailyNutrition,
        this.user.shoppingList,
        this.user.userToken,
        this.user.tokenExpirationDate
      );
      this.date = new Date(this.editedUser.dateOfBirth).toISOString();
      this.calculateCalories();
      this.setChartData();
      this.isLoading = false;
    });
  }

  onUpdateUserData() {
    if (!this.form.valid) {
      return;
    }
    this.alertCtrl.create({
      header: 'Save Changes?',
      message: 'Do you want to save changes to your personal data?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: () => {
            this.updateUserData();
          }
        }
      ]
    }).then(alertEl => {
      alertEl.present();
    });
    // udate
    // updated user je novi ?? nzm da l ovo mora posto ima subscribe za usera
  }

  updateUserData() {
    this.loadingCtrl.create({
      keyboardClose: true,
      message: 'Saving changes...'
    }).then(loadingEl => {
      loadingEl.present();
      this.authService.updateUserData(
        this.form.value['first-name'],
        this.form.value['last-name'],
        this.form.value['user-gender'],
        this.form.value['date-of-birth'],
        this.form.value['user-weight'],
        this.form.value['user-height'],
        this.form.value['max-calories']
      ).subscribe(() => {
        loadingEl.dismiss();
        if (this.editMode) {
          this.editMode = false;
        }
        this.toastCtrl.create({
          message: 'Data updated successfuly!',
          duration: 2000,
          cssClass: 'toastClass'
        }).then(toastEl => {
          toastEl.present();
        });
      });
    });
  }

  calculateCalories() {
    const dateOfBirth = new Date(this.date);
    const ageDifMs = new Date().getTime() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (this.editedUser.gender === 'male') {
      this.suggestedCalories = Math.round(66.47 + (13.75 * this.editedUser.weight) + (5.0 * this.editedUser.height - (6.75 * age)));
    } else if (this.editedUser.gender === 'female') {
      this.suggestedCalories = Math.round(665.09 + (9.56 * this.editedUser.weight) + (1.84 * this.editedUser.height - (4.67 * age)));
    }
  }

  onEditMode() {
    if (!this.editMode) {
      this.editMode = true;
    } else {
      if (
        this.user.firstName === this.editedUser.firstName &&
        this.user.lastName === this.editedUser.lastName &&
        this.user.gender === this.editedUser.gender &&
        new Date(this.user.dateOfBirth).getTime() === new Date(this.date).getTime() &&
        this.user.weight === this.editedUser.weight &&
        this.user.height === this.editedUser.height &&
        this.user.maxCalories === this.editedUser.maxCalories
      ) {
        this.editMode = false;
      } else {
        if (!this.form.valid) {
          return;
        }
        this.alertCtrl.create({
          header: 'Save Changes?',
          message: 'Do you want to save changes to your personal data?',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                this.editedUser.firstName = this.user.firstName;
                this.editedUser.lastName = this.user.lastName;
                this.editedUser.gender = this.user.gender;
                this.date = new Date(this.user.dateOfBirth).toISOString();
                this.editedUser.weight = this.user.weight;
                this.editedUser.height = this.user.height;
                this.editedUser.maxCalories = this.user.maxCalories;
                this.editMode = false;
              }
            },
            {
              text: 'Save',
              handler: () => {
                this.updateUserData();
              }
            }
          ]
        }).then(alertEl => {
          alertEl.present();
        });
      }
    }
  }

  setChartData() {
    this.chartData[0].data = [];
    this.chartLabels = [];
    this.chartData2[0].data = [];
    this.chartLabels2 = [];
    let sumForAverage = 0;
    let avg = 0;
    if (this.user.dailyNutrition) {
      // tslint:disable-next-line:prefer-for-of
      for (let index = 0; index < this.user.dailyNutrition.length; index++) {
        const element = this.user.dailyNutrition[index];
        const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' });
        const [{ value: month }, , { value: day }, , { value: year }] = dateTimeFormat.formatToParts(new Date(element.day));
        this.chartLabels.push(`${day}-${month}`);
        this.chartData[0].data.push(element.nutrition[this.displayingData]);
        sumForAverage += element.nutrition[this.displayingData];
      }

      avg = Math.round(((sumForAverage / this.user.dailyNutrition.length) + Number.EPSILON) * 100) / 100;

      const maxDate = new Date(Math.max.apply(Math, this.user.dailyNutrition.map((o) => new Date(o.day)))); // proveriti da l radi
      const objLatest = this.user.dailyNutrition.find((o) => new Date(o.day).getTime() === maxDate.getTime());
      maxDate.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (maxDate && maxDate.getTime() === now.getTime()) {
        // tslint:disable-next-line:quotemark
        this.chartLabels2.push("Today's Calories");
        this.chartData2[0].data.push(objLatest.nutrition.calories);
      }

      if (objLatest.nutrition.calories <= this.user.maxCalories) {
        this.chartColors2 = [
          {
            borderColor: '#aec7a9',
            backgroundColor: '#cae5c4',
            hoverBackgroundColor: '#cfe8ca',
            hoverBorderColor: '#aec7a9',
            borderWidth: 1
          }
        ];
      } else {
        this.chartColors2 = [
          {
            borderColor: '#fa3e3e',
            backgroundColor: '#ff9494',
            hoverBackgroundColor: '#eda1a1',
            hoverBorderColor: '#fa3e3e',
            borderWidth: 1
          }
        ];
      }
    }

    this.chartOptions = {
      responsive: true,
      title: {
        display: true,
        text: 'Daily ' + this.displayingData.toLowerCase().charAt(0).toUpperCase() + this.displayingData.toLowerCase().slice(1) + ' (Avg. ' + avg + ')'
      },
      pan: {
        enabled: true,
        mode: 'xy'
      },
      zoom: {
        enabled: true,
        mode: 'xy'
      },
      scales: {
        yAxes: [{
          display: true,
          ticks: {
            beginAtZero: true,
            stepSize:  this.displayingData === 'calories' ? 500 : 50,
            suggestedMax: this.displayingData === 'calories' ? this.user.maxCalories + 1000 : 300
          }
        }]
      }
    };

    this.chartOptions2 = {
      maintainAspectRatio: false,
      responsive: true,
      title: {
        display: true,
        // tslint:disable-next-line:quotemark
        text: "Today's Calories"
      },
      scales: {
        xAxes: [{
          id: 'x-axis-0',
          display: true,
          ticks: {
            beginAtZero: true,
            stepSize: 250,
            suggestedMax: this.user.maxCalories + 100
          },
          scaleLabel: {
            display: true,
            labelString: 'kcal'
          }
        }],
        yAxes: [{
          display: true,
          ticks: {
            display: false
          }
        }]
      },
      annotation: {
        annotations: [{
          type: 'line',
          mode: 'vertical',
          scaleID: 'x-axis-0',
          value: this.user.maxCalories,
          borderColor: 'red',
          borderWidth: 3,
          /* label: {
            content: 'Max',
            enabled: true,
            position: 'bottom'
          } */
        }]
      }
    };

    this.chartPlugins2 = {
      plugins: [{
      }]
    };
  }

  onAddCalories() {
    this.alertCtrl.create({
      header: 'Add Calories',
      inputs: [
        {
          name: 'calories',
          placeholder: 'Calories',
          type: 'number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: data => {
            if (!data.calories || +data.calories <= 0) {
              return;
            } else {
              this.loadingCtrl.create({
                keyboardClose: true,
                message: 'Adding calories...'
              }).then(loadingEl => {
                loadingEl.present();
                const nutrition = new Nutrition(+data.calories, 0, 0, 0, 0, 0);
                this.authService.updateDailyNutrition(nutrition).pipe(take(1)).subscribe(() => {
                  loadingEl.dismiss();
                  this.toastCtrl.create({
                    message: 'Calories added successfuly!',
                    duration: 2000,
                    cssClass: 'toastClass'
                  }).then(toastEl => {
                    toastEl.present();
                  });
                });
              });
            }
          }
        }
      ]
    }).then(alertEl => {
      alertEl.present();
    });
  }

  /* calculateCalories() {
    const dateOfBirth = new Date(this.form.value.dateOfBirth);
    const ageDifMs = new Date().getTime() - dateOfBirth.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (this.form.value.gender === 'male') {
      this.suggestedCalories = Math.round(66.47 + (13.75 * this.form.value.weight) + (5.0 * this.form.value.height - (6.75 * age)));
    } else if (this.form.value.gender === 'female') {
      this.suggestedCalories = Math.round(665.09 + (9.56 * this.form.value.weight) + (1.84 * this.form.value.height - (4.67 * age)));
    }*/


  ionViewWillLeave() {
    if (this.editMode) {
      this.onEditMode();
    }
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }
}
