export class Ingredient {
    constructor(
        public id: string,
        public name: string,
        public calories: number,
        public measurementUnit: string,
        public image: string,
        public amount?: number
    ) {}
}
