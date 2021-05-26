export class Recipe {
    constructor(
        public id: string,
        public name: string,
        public ingredientsForRecipe: {ingredientsId: string, amount: number}[],
        public calories: number,
        public image: string,
        public category: string,
        public instructions: string,
        public userId: string
    ) {}
}
