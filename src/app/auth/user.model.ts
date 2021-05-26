import { DailyCalories } from './../my-account/daily-calories.model';

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
        public dailyCalories: DailyCalories[],
        public token: string,
        public tokenExpirationDate: Date,
        public refreshToken: string,
        public userDataId
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
