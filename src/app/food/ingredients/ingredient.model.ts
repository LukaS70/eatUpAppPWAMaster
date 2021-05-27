import { Nutrition } from './../../shared/nutrition.modal';
export class Ingredient {
    constructor(
        public id: string,
        public name: string,
        public image: string,
        public nutrition: Nutrition,
        public reviewRequested: boolean,
        public isPublic: boolean,
        public measurementUnit: string,
        public category: string,
        public creator: string,
        public amount?: number
    ) { }
}
