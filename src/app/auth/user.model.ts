import { DailyNutrition } from '../my-account/daily-nutrition.model';

export class User {
    constructor(
        public id: string,
        public email: string,
        public firstName: string,
        public lastName: string,
        public gender: string,
        public dateOfBirth: Date,
        public weight: number,
        public height: number,
        public maxCalories: number,
        public dailyNutrition: DailyNutrition[],
        public shoppingList: any,       // change
        public token: string,
        public tokenExpirationDate: Date
    ) {}

    get userToken() {
        if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
            return null;
        }
        return this.token;
    }

    get tokenDuration() {
        if (!this.token) {
            return 0;
        }
        return this.tokenExpirationDate.getTime() - new Date().getTime();
        // return 10000;
    }
}
