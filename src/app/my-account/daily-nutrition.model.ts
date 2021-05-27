import { Nutrition } from './../shared/nutrition.modal';
export class DailyNutrition {
    constructor(
        public id: string,
        public day: Date,
        public nutrition: Nutrition,
        public creator: string
    ) { }
}
