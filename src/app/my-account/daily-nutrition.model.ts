export class DailyNutrition {
    constructor(
        public id: string,
        public day: Date,
        public nutrition: {
            calories: number,
            totalFats: number,
            saturatedFats: number,
            totalCarbohydrates: number,
            sugar: number,
            proteine: number
        },
        public creator: string
    ) { }
}
