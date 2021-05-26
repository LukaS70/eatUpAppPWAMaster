export class ShoppingList {
    constructor(
        public id,
        public userId,
        public ingredientsForShoppingList: {amount: number, ingredientsId: string, checked: boolean}[]
    ) {}
}
