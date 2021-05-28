import { Nutrition } from './../../shared/nutrition.modal';
export class Recipe {
    constructor(
        public id: string,
        public name: string,
        public instructions: string,
        public image: string,
        public ingredients: {ingredient: string, amount: number}[],
        public nutrition: Nutrition,
        public reviewRequested: boolean,
        public isPublic: boolean,
        public category: string,
        public creator: string
    ) {}
}
