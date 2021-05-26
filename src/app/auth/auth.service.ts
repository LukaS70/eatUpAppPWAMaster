/* import { NotificationsService } from './../shared/notifications.service'; */
import { DailyCalories } from './../my-account/daily-calories.model';
import { environment } from './../../environments/environment';
import { User } from './user.model';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, take, switchMap } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';
/* import { Platform } from '@ionic/angular'; */

export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
  registered?: boolean;
}

export interface RefreshTokenResponseData {
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

export interface UserData {
  dateOfBirth: string;
  firstName: string;
  gender: string;
  height: number;
  lastName: string;
  maxCalories: number;
  userId: string;
  weight: number;
  dailyCalories?: DailyCalories[];

}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  user = new BehaviorSubject<User>(null);
  private logoutTimer: any;

  get userIsAuthentcated() {
    return this.user.asObservable().pipe(map(user => {
      if (user) {
        return !!user.userToken;
      } else {
        return false;
      }
    }));
  }

  constructor(private http: HttpClient, /* private notificationsService: NotificationsService, private platform: Platform */) { }

  postUserData(
    userFirstName: string,
    userLastName: string,
    userGender: string,
    userDateOfBirth: Date,
    userWeight: number,
    userHeight: number,
    userMaxCalories: number
  ) {
    let generatedId;
    return this.user.pipe(take(1), switchMap(userData => {
      const user = new User(
        userData.id,
        userData.email,
        userFirstName,
        userLastName,
        userGender,
        userDateOfBirth,
        userWeight,
        userHeight,
        userMaxCalories,
        null,
        userData.userToken,
        userData.tokenExpirationDate,
        userData.refreshToken,
        null
      );
      this.user.next(user);
      console.log(user);
      return this.http.post<{ name: string }>('https://eatupappproject.firebaseio.com/userData.json', {
        userId: userData.id,
        firstName: userFirstName,
        lastName: userLastName,
        gender: userGender,
        dateOfBirth: userDateOfBirth,
        weight: userWeight,
        height: userHeight,
        maxCalories: userMaxCalories,
        dailyCalories: null
      });
    }), switchMap(resData => {
      generatedId = resData.name;
      return this.user;
    }), take(1), tap(u => {
      u.userDataId = generatedId;
      this.user.next(u);
    }));
  }

  updateUserData(
    userFirstName: string,
    userLastName: string,
    userGender: string,
    userDateOfBirth: Date,
    userWeight: number,
    userHeight: number,
    userMaxCalories: number,
    userDailtyCalories: DailyCalories[]
  ) {
    return this.user.pipe(take(1), switchMap(userData => {
      const user = new User(
        userData.id,
        userData.email,
        userFirstName,
        userLastName,
        userGender,
        userDateOfBirth,
        userWeight,
        userHeight,
        userMaxCalories,
        userDailtyCalories,
        userData.userToken,
        userData.tokenExpirationDate,
        userData.refreshToken,
        userData.userDataId
      );
      this.user.next(user);
      console.log(user);
      return this.http.put(`https://eatupappproject.firebaseio.com/userData/${userData.userDataId}.json`, {
        userId: userData.id,
        firstName: userFirstName,
        lastName: userLastName,
        gender: userGender,
        dateOfBirth: userDateOfBirth,
        weight: userWeight,
        height: userHeight,
        maxCalories: userMaxCalories,
        dailyCalories: userDailtyCalories
      });
    }));
  }

  updateDailyCalories(
    userDailyCalories: DailyCalories[]
  ) {
    return this.user.pipe(take(1), switchMap(userData => {
      const user = new User(
        userData.id,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.gender,
        userData.dateOfBirth,
        userData.weight,
        userData.height,
        userData.maxCalories,
        userDailyCalories,
        userData.userToken,
        userData.tokenExpirationDate,
        userData.refreshToken,
        userData.userDataId
      );
      this.user.next(user);
      console.log(user);
      return this.http.put(`https://eatupappproject.firebaseio.com/userData/${userData.userDataId}.json`, {
        userId: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth,
        weight: userData.weight,
        height: userData.height,
        maxCalories: userData.maxCalories,
        dailyCalories: userDailyCalories
      });
    }));
  }

  sigup(userEmail: string, userPassword: string) {
    return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIKey}`, {
      email: userEmail,
      password: userPassword,
      returnSecureToken: true
    }).pipe(tap(this.setUserData.bind(this)));
  }

  login(userEmail: string, userPassword: string) {
    return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`, {
      email: userEmail,
      password: userPassword,
      returnSecureToken: true
    }).pipe(tap(this.setUserData.bind(this)));
  }

  refreshUserToken(refreshToken: string) {
    let activeUser: User;
    return this.user.pipe(take(1), switchMap(userData => {
      console.log('RefreshUserToken-Old user data: ');
      console.log(userData);
      activeUser = userData;
      return this.http.post<RefreshTokenResponseData>(`https://securetoken.googleapis.com/v1/token?key=${environment.firebaseAPIKey}`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });
    }), map(res => {
      activeUser.token = res.id_token;
      activeUser.refreshToken = res.refresh_token;
      const expirationTime = new Date(new Date().getTime() + (+res.expires_in * 1000));
      activeUser.tokenExpirationDate = expirationTime;
      this.user.next(activeUser);
      this.storeUserData(
        activeUser.id,
        activeUser.userToken,
        activeUser.tokenExpirationDate.toISOString(),
        activeUser.email,
        activeUser.refreshToken
      );
      console.log('RefreshUserToken-New user data: ');
      console.log(activeUser);
      this.autoLogout(activeUser.tokenDuration, activeUser);
      return activeUser;
    }));
  }

  logout() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.user.next(null);
    Plugins.Storage.remove({ key: 'authData' });
  }

  /* autoLogin() {
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(map(storedData => {
      if (!storedData || !storedData.value) {
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {
        token: string;
        tokenExpirationDate: string;
        userId: string;
        email: string;
      };
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if (expirationTime <= new Date()) {
        return null;
      }
      const user = new User(
        parsedData.userId,
        parsedData.email,
        null, null, null, null, null, null, null, null,
        parsedData.token,
        expirationTime
      );
      return user;
    }), tap(user => {
      if (user) {
        this.user.next(user);
        this.autoLogout(user.tokenDuration);
      }
    }), map(user => {
      return !!user;
    }));
  } */

  autoLogin() {
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(map(storedData => {
      if (!storedData || !storedData.value) {
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {
        token: string;
        tokenExpirationDate: string;
        userId: string;
        email: string;
        refreshToken: string;
      };
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if (expirationTime <= new Date()) {
        return null;
      }
      const user = new User(
        parsedData.userId,
        parsedData.email,
        null, null, null, null, null, null, null, null,
        parsedData.token,
        expirationTime,
        parsedData.refreshToken,
        null
      );
      return user;
    }), tap(user => {
      if (user) {
        this.user.next(user);
        this.autoLogout(user.tokenDuration, user);
        this.getUserData(user.id, user.email, user.userToken, user.tokenExpirationDate, user.refreshToken).pipe(take(1)).subscribe();

        /* if ((this.platform.is('mobile')
         && !this.platform.is('hybrid')) || this.platform.is('desktop')) { // ako vaze ovi uslovi, desktip je
        } else {
          this.notificationsService.scheduleAddNotification();
        } */
      }
    }), map(user => {
      return !!user;
    }));
  }

  autoLoginWithRefreshToken(userId, email, refreshToken) {
    return this.http.post<RefreshTokenResponseData>(`https://securetoken.googleapis.com/v1/token?key=${environment.firebaseAPIKey}`, {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).pipe(take(1), switchMap(res => { // mozda sub i take 1
      console.log(res);

      const user = new User(
        userId,
        email,
        null, null, null, null, null, null, null, null,
        res.id_token,
        new Date(new Date().getTime() + (+res.expires_in * 1000)),
        res.refresh_token,
        null
      );
      this.storeUserData(
        userId,
        res.id_token,
        new Date(new Date().getTime() + (+res.expires_in * 1000)).toISOString(),
        email,
        res.refresh_token
      );
      console.log('Autologin refreshed expired token');
      console.log(user);
      this.user.next(user);
      this.autoLogout(user.tokenDuration, user);
      return this.getUserData(user.id, user.email, user.userToken, user.tokenExpirationDate, user.refreshToken).pipe(take(1));
    }, error => {
      console.log(error);
      return null;
    }));
  }

  getUserData(id: string, email: string, token: string, tokenExpirationDate: Date, refreshToken: string) {
    let user: User;
    return this.http.get<{ [key: string]: UserData }>(`https://eatupappproject.firebaseio.com/userData.json?orderBy="userId"&equalTo="${id}"`)
      .pipe(map(usersData => {
        if (usersData) {
          for (const key in usersData) {
            if (usersData.hasOwnProperty(key)) {
              user = new User(
                id,
                email,
                usersData[key].firstName,
                usersData[key].lastName,
                usersData[key].gender,
                new Date(usersData[key].dateOfBirth),
                usersData[key].weight,
                usersData[key].height,
                usersData[key].maxCalories,
                usersData[key].dailyCalories,
                token,
                tokenExpirationDate,
                refreshToken,
                key
              );
              this.user.next(user);
              console.log(user);
            }
          }
        } else {
          console.log('Could not retrive user data');
        }
        return user;
      }));
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(new Date().getTime() + (+userData.expiresIn * 1000));
    const user = new User(
      userData.localId,
      userData.email,
      null, null, null, null, null, null, null, null,
      userData.idToken,
      expirationTime,
      userData.refreshToken,
      null
    );

    /*    if ((this.platform.is('mobile') && !this.platform.is('hybrid'))
     || this.platform.is('desktop')) { // ako vaze ovi uslovi, desktip je
       } else {
         this.notificationsService.scheduleAddNotification();
       }
    */
    this.user.next(user);
    this.autoLogout(user.tokenDuration, user);
    this.storeUserData(userData.localId, userData.idToken, expirationTime.toISOString(), userData.email, userData.refreshToken);
    this.getUserData(userData.localId, userData.email, userData.idToken, expirationTime, userData.refreshToken).subscribe();
    console.log(user);
  }


  private autoLogout(duration: number, activeUser: User) {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.logoutTimer = setTimeout(() => {
      this.refreshUserToken(activeUser.refreshToken).subscribe(() => {
        console.log('token refreshed');
      });
      // this.logout();
    }, duration);
  }

  private storeUserData(
    userUserId: string,
    userToken: string,
    userTokenExpirationDate: string,
    userEmail: string,
    userRefreshToken: string
  ) {
    const data = JSON.stringify({
      userId: userUserId,
      token: userToken,
      tokenExpirationDate: userTokenExpirationDate,
      email: userEmail,
      refreshToken: userRefreshToken
    });
    Plugins.Storage.set({ key: 'authData', value: data });
  }

  ngOnDestroy() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
  }
}
