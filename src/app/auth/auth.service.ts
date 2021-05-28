import { ShoppingList } from './../shopping-list/shopping-list.model';
import { Nutrition } from './../shared/nutrition.modal';
import { DailyNutrition } from '../my-account/daily-nutrition.model';
import { User } from './user.model';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, take, switchMap } from 'rxjs/operators';
import { Plugins } from '@capacitor/core';

export interface AuthResponseData {
  userId: string;
  email: string;
  token: string;
}
export interface UserData {
  userId: string;
  email: string
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  maxCalories: number;
  dailyNutrition?: DailyNutrition[];
  shoppingList?: ShoppingList
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

  constructor(private http: HttpClient) { }

  updateDailyNutrition(nutrition: Nutrition) {
    return this.user.pipe(take(1), switchMap(userData => {
      let dailyNutrition = userData.dailyNutrition;
      let updatedDailyNutrition: DailyNutrition[];
      let maxDate = null;
      let objLatest: DailyNutrition = null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dailyNutrition && dailyNutrition.length !== 0) {
        maxDate = new Date(Math.max.apply(Math, dailyNutrition.map((o) => new Date(o.day)))); // proveriti da l radi
        objLatest = dailyNutrition.find((o) => new Date(o.day).getTime() === maxDate.getTime());
        maxDate.setHours(0, 0, 0, 0);
      }

      if (maxDate && objLatest && maxDate.getTime() === today.getTime()) {
        const objLatestIndex = dailyNutrition.findIndex(dn => dn.id === objLatest.id);
        updatedDailyNutrition = [...dailyNutrition];

        objLatest.nutrition.calories = Math.round((objLatest.nutrition.calories + nutrition.calories + Number.EPSILON) * 100) / 100;
        objLatest.nutrition.totalFats = Math.round((objLatest.nutrition.totalFats + nutrition.totalFats + Number.EPSILON) * 100) / 100;
        objLatest.nutrition.saturatedFats = Math.round((objLatest.nutrition.saturatedFats + nutrition.saturatedFats + Number.EPSILON) * 100) / 100;
        objLatest.nutrition.totalCarbohydrates = Math.round((objLatest.nutrition.totalCarbohydrates + nutrition.totalCarbohydrates + Number.EPSILON) * 100) / 100;
        objLatest.nutrition.sugar = Math.round((objLatest.nutrition.sugar + nutrition.sugar + Number.EPSILON) * 100) / 100;
        objLatest.nutrition.proteine = Math.round((objLatest.nutrition.proteine + nutrition.proteine + Number.EPSILON) * 100) / 100;

        updatedDailyNutrition[objLatestIndex] = objLatest;
        console.log('existing');
        console.log(updatedDailyNutrition);
      } else {
        updatedDailyNutrition = [...dailyNutrition];
        let createdDailyNutrition = new DailyNutrition(
          null,
          today,
          nutrition,
          userData.id
        );
        updatedDailyNutrition.push(createdDailyNutrition);
        console.log('new');
        console.log(updatedDailyNutrition);
      }

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
        updatedDailyNutrition,
        userData.shoppingList,
        userData.token,
        userData.tokenExpirationDate
      );
      this.user.next(user);
      console.log(user);
      return this.http.post(`http://localhost:5000/api/daily-nutrition`, {
        nutrition
      });
    }));
  }

  updateUserData(
    userFirstName: string,
    userLastName: string,
    userGender: string,
    userDateOfBirth: Date,
    userWeight: number,
    userHeight: number,
    userMaxCalories: number
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
        userData.dailyNutrition,
        userData.shoppingList,
        userData.token,
        userData.tokenExpirationDate
      );
      this.user.next(user);
      console.log(user);
      return this.http.patch(`http://localhost:5000/api/users/${userData.id}`, {
        firstName: userFirstName,
        lastName: userLastName,
        gender: userGender,
        dateOfBirth: userDateOfBirth,
        weight: userWeight,
        height: userHeight,
        maxCalories: userMaxCalories
      });
    }));
  }

  sigup(userEmail: string, userPassword: string, firstName: string, lastName: string, gender: string, dateOfBirth: Date, weight: number, height: number, maxCalories: number) {
    return this.http.post<AuthResponseData>(`http://localhost:5000/api/users/signup`, {
      email: userEmail,
      password: userPassword,
      firstName: firstName,
      lastName: lastName,
      gender: gender,
      dateOfBirth: dateOfBirth,
      weight: weight,
      height: height,
      maxCalories: maxCalories
    }).pipe(tap(this.setUserData.bind(this)));
  }

  login(userEmail: string, userPassword: string) {
    return this.http.post<AuthResponseData>(`http://localhost:5000/api/users/login`, {
      email: userEmail,
      password: userPassword
    }).pipe(tap(this.setUserData.bind(this)));
  }

  logout() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.user.next(null);
    Plugins.Storage.remove({ key: 'authData' });
  }

  autoLogin() {
    return from(Plugins.Storage.get({ key: 'authData' })).pipe(map(storedData => {
      if (!storedData || !storedData.value) {
        return null;
      }
      const parsedData = JSON.parse(storedData.value) as {
        userId: string;
        email: string;
        token: string;
        tokenExpirationDate: string;
      };
      const expirationTime = new Date(parsedData.tokenExpirationDate);
      if (expirationTime <= new Date()) {
        return null;
      }
      const user = new User(
        parsedData.userId,
        parsedData.email,
        null, null, null, null, null, null, null, null, null,
        parsedData.token,
        expirationTime
      );
      return user;
    }), tap(user => {
      if (user) {
        this.user.next(user);
        this.autoLogout(user.tokenDuration, user);
        this.getUserData(user.id, user.email, user.userToken, user.tokenExpirationDate).pipe(take(1)).subscribe();
      }
    }), map(user => {
      return !!user;
    }));
  }

  getUserData(id: string, email: string, token: string, tokenExpirationDate: Date) {
    let user: User;
    return this.http.get<{ [key: string]: UserData }>(`http://localhost:5000/api/users/${id}`)
      .pipe(map(usersData => {
        if (usersData) {
          console.log(usersData);

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
                usersData[key].dailyNutrition,
                usersData[key].shoppingList,
                token,
                tokenExpirationDate
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
    const expirationTime = new Date(new Date().getTime() + 3600000);
    const user = new User(
      userData.userId,
      userData.email,
      null, null, null, null, null, null, null, null, null,
      userData.token,
      expirationTime
    );

    this.user.next(user);
    this.autoLogout(user.tokenDuration, user);
    this.storeUserData(userData.userId, userData.email, userData.token, expirationTime.toISOString());
    this.getUserData(userData.userId, userData.email, userData.token, expirationTime).subscribe();
    console.log(user);
  }


  private autoLogout(duration: number, activeUser: User) {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, duration);
  }

  private storeUserData(
    userUserId: string,
    userEmail: string,
    userToken: string,
    userTokenExpirationDate: string
  ) {
    const data = JSON.stringify({
      userId: userUserId,
      email: userEmail,
      token: userToken,
      tokenExpirationDate: userTokenExpirationDate
    });
    Plugins.Storage.set({ key: 'authData', value: data });
  }

  ngOnDestroy() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
  }
}
