import { UserDataComponent } from './user-data/user-data.component';
import { Observable } from 'rxjs';
import { AuthService, AuthResponseData } from './auth.service';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    this.authenticate(email, password);
    form.reset();
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    let loadingMessage = 'Logging in...';
    if (!this.isLogin) {
      loadingMessage = 'Signing up...';
    }
    this.loadingCtrl.create({ keyboardClose: true, message: loadingMessage }).then(loadingEl => {
      loadingEl.present();
      let authObs: Observable<AuthResponseData>;
      if (this.isLogin) {
        authObs = this.authService.login(email, password);
      } else {
        authObs = this.authService.sigup(email, password);
        this.modalCtrl.create({ component: UserDataComponent }).then(modalEl => {
          modalEl.present();
          return modalEl.onDidDismiss();
        }).then(resultData => {
          if (resultData.role === 'confirm') {
            const data = resultData.data.userData;
            this.authService.postUserData(
              data.firstName,
              data.lastName,
              data.gender,
              data.dateOfBirth,
              data.weight,
              data.height,
              data.maxCalories
            ).subscribe();
          } else {
            return;
          }
        });
      }
      authObs.subscribe(resData => {
        this.isLoading = false;
        loadingEl.dismiss();
        this.router.navigateByUrl('/food/tabs/recipes');
      }, errorRes => {
        loadingEl.dismiss();
        this.modalCtrl.dismiss();
        let errorMessage = 'An unknown error occured!';
        if (!errorRes.error || !errorRes.error.error) {
          this.showAlert(errorMessage);
        }
        switch (errorRes.error.error.message) {
          case 'EMAIL_EXISTS':
            errorMessage = 'This email is already in use.';
            break;
          case 'EMAIL_NOT_FOUND':
            errorMessage = 'This email does not exist.';
            break;
          case 'INVALID_PASSWORD':
            errorMessage = 'Incorrect password.';
            break;
        }
        this.showAlert(errorMessage);
      });
    });
  }

  private showAlert(alertMessage: string) {
    this.alertCtrl.create({
      header: 'Authentication failed',
      message: alertMessage,
      buttons: ['Okay']
    }).then(alertEl => {
      alertEl.present();
    });
  }
}
