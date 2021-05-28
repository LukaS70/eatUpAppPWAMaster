export class ShoppingList {
    constructor(
        public id,
        public creator,
        public items: { ingredient: string, amount: number, checked: boolean }[]
    ) { }
}
