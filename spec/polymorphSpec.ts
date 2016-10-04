import * as React from "react";
import * as ReactDOM from "react-dom";

import * as I from "immuto";
import { action, reducer, amend, array, property, replace, snapshot, primitive } from "immuto";

import { polymorph, render } from "../src/polymorph";
import { bindToStore } from "../src/bindToStore";

import { jsdom, DocumentWithParentWindow } from "jsdom";
import { propagateToGlobal } from "./propagateToGlobal";

/**
 * --------------------------------------------------------------------------
 * Product - acts as the "base class" of Book and Food.
 * --------------------------------------------------------------------------
 */

interface Product {
    readonly price: number; 
}

namespace Product {
    
    export const empty: Product = { price: 0 };

    export const setPrice = action("SET_PRICE",
        (product: Product, price: number) => amend(product, { price }));

    export const reduce = reducer(empty).action(setPrice);
}

namespace Product {
    export type Cursor = typeof Product.reduce.cursorType;
}

/**
 * --------------------------------------------------------------------------
 * Book - extends Product, adding some data and actions. Note the use of 
 * mixin which lets us build on the reducer of Product, gaining its actions.
 * --------------------------------------------------------------------------
 */

interface Book extends Product {
    readonly title: string;    
    readonly authors: string[];
}

namespace Book {

    export const title = property("TITLE", (book: Book) => book.title);

    export const setTitle = action("SET_TITLE",
        (book: Book, title: string) => amend(book, { title }));

    export const addAuthor = action("ADD_AUTHOR",
        (book: Book, author: string) => amend(book, {
             authors: book.authors.concat(author) 
        }));

    export const empty: Book = {
        price: 0,
        title: "",
        authors: []
    };

    export const reduce = Product.reduce.mixin(        
        reducer(empty)
            .action(title)
            .action(setTitle)
            .action(addAuthor)
    );

    export type Cursor = typeof Book.reduce.cursorType;
}

/**
 * --------------------------------------------------------------------------
 * Food - extends Product, adding some data and actions
 * --------------------------------------------------------------------------
 */

type Flavour = "sweet"|"savoury"|"none";

interface Food extends Product {
    readonly flavour: Flavour;
}

namespace Food {

    export const flavour = property("FLAVOUR", (food: Food) => food.flavour);

    export const empty: Food = {     
        flavour: "none",
        price: 0
    };

    export const reduce = Product.reduce.mixin(
        reducer(empty).action(flavour)
    );

    export type Cursor = typeof Food.reduce.cursorType;
}

/**
 * --------------------------------------------------------------------------
 * PolyProduct - a polymorphic reference to a Product, so it can actually
 * refer to something that extends Product (Book, Food). It also has the
 * ability to be rendered via Polymorph.render, so you get to specify
 * additional props to be passed.
 * --------------------------------------------------------------------------
 */

interface PolyProductProps {
    punctuation: string;
}

const PolyProduct = polymorph(Product).props<PolyProductProps>();
type PolyProduct = typeof PolyProduct.polymorphType;

/**
 * --------------------------------------------------------------------------
 * PolyProducts - an ordinary array but the items happen to be PolyProduct
 * objects.
 * --------------------------------------------------------------------------
 */

type PolyProducts = PolyProduct[];

namespace PolyProducts {
    export const empty: PolyProducts = [];
    export const at = array(PolyProduct);
    export const add = action("ADD", 
        (ar: PolyProducts, payload: PolyProduct) => ar.concat(payload));
    export const reduce = reducer(empty).action(at).action(add);
    export type Cursor = typeof reduce.cursorType;
}

/**
 * --------------------------------------------------------------------------
 * queuedActions - purely for testing purposes, a way to simulate the user
 * interacting with the rendered UI.
 * --------------------------------------------------------------------------
 */

let queuedActions: (() => void)[] = [];

export function executeQueuedActions() {
    const actions = queuedActions;
    queuedActions = [];

    for (const action of actions) {
        action();
    }
}

/**
 * --------------------------------------------------------------------------
 * Factory functions for each type of self-rendering PolyProduct. Each can
 * render itself however it likes. It receives a prop called `binding` that
 * is a cursor to the specific derived type, e.g. Book, Food, so it can
 * dispatch actions to itself. 
 * --------------------------------------------------------------------------
 */

const PolyBook = PolyProduct.derive(Book, props => {
    queuedActions.push(() => {
        props.binding(Book.addAuthor("Mr Click"));

        // Also double the price
        props.binding(Product.setPrice(props.binding.state.price * 2));
    });

    return React.createElement("span", undefined, 
        `Book${props.punctuation} ${props.binding.state.title} ` + 
        `by ${props.binding.state.authors.join()}`);
});

const PolyFood = PolyProduct.derive(Food, props => {
    queuedActions.push(() => {
        const f = props.binding.state.flavour;
        const newFlavour: Flavour = 
            f === "sweet" ? "savoury" :
            f === "savoury" ? "sweet" :
            "none";
        props.binding.$(Food.flavour)(replace(newFlavour));

        // Also triple the price
        props.binding(Product.setPrice(props.binding.state.price * 2));
    });

    return React.createElement("span", undefined, 
        `Food${props.punctuation} ${props.binding.state.flavour}`);
});

/**
 * --------------------------------------------------------------------------
 * PolyProductsComp - test component that just rendereds all the products
 * in the supplied list. It uses Polymorph.render so each product renders
 * itself.
 * --------------------------------------------------------------------------
 */

function PolyProductsComp({products}: { products: PolyProducts.Cursor }) {
    return React.createElement("div", undefined,
        products.state.map((p, i) =>
            React.createElement("div", { key: i },  
                render({            
                    binding: products.$(PolyProducts.at(i)),
                    punctuation: ':'
                })
            )
        )
    );
}

function toArray<T>(arrayLike: { [index: number]: T, length: number }) {
    const result: T[] = [];
    for (let i = 0; i < arrayLike.length; i++) {
        result.push(arrayLike[i]);
    }
    return result;
}

describe("Polymorph", () => {

    it("supports dynamic polymorphism", () => {

        // Our root store is a collection of mixed products
        const prods = PolyProducts.reduce.store();

        // Call the factories PolyBook and PolyFood to make instances
        prods.dispatch(PolyProducts.add(PolyBook(
            {
                title: "Frogs",
                price: 2.99,
                authors: []
            }
        )));
        prods.dispatch(PolyProducts.add(PolyFood(
            {
                flavour: "sweet",
                price: 1.99
            }
        )));

        expect(prods.getState()[0].price).toEqual(2.99);        
        const book1 = prods.getState()[0] as any as Book; 
        expect(book1.title).toEqual("Frogs");
        expect(book1.authors.length).toEqual(0);

        expect(prods.getState()[1].price).toEqual(1.99);
        const food1 = prods.getState()[1] as any as Food;
        expect(food1.flavour).toEqual("sweet");

        const doc = jsdom("<div></div>");
        propagateToGlobal(doc);
        const root = doc.querySelector("div");

        // Render the collection via PolyProductsComp
        const App = bindToStore(prods, b => 
            React.createElement(PolyProductsComp, { products: b }));
        ReactDOM.render(React.createElement(App), root);

        // Check the text output
        const spans = doc.querySelectorAll("span");
        const spans1Text = toArray(spans).map(span => span.innerHTML).join();
        expect(spans1Text).toEqual('Book: Frogs by ,Food: sweet');

        // Simulate UI interaction with side-effects on state
        executeQueuedActions();

        // Text output should change accordingly...
        const spans2Text = toArray(spans).map(span => span.innerHTML).join();
        expect(spans2Text).toEqual('Book: Frogs by Mr Click,Food: savoury');
        
        // ... due to store contents changing
        const book2 = prods.getState()[0] as any as Book; 
        expect(book2.title).toEqual("Frogs");
        expect(book2.authors[0]).toEqual("Mr Click");

        const food2 = prods.getState()[1] as any as Food;
        expect(food2.flavour).toEqual("savoury");        
    });

    it("supports safe downcasting", () => {

        const book1 = PolyBook({
            title: "Frogs",
            price: 2.99,
            authors: []
        });

        // A book is-a product
        const prod1: PolyProduct = book1;

        expect(PolyBook.isInstance(prod1)).toEqual(true);

        if (PolyBook.isInstance(prod1)) {
            expect(prod1.title).toEqual("Frogs");
        }

        // Unrelated polymorphic type
        const PolyRubbish = polymorph(primitive<{ rubbish: string }>()).props<PolyProductProps>();
        type PolyRubbish = typeof PolyRubbish.polymorphType;

        const DerivedRubbish = PolyRubbish.derive(
            primitive<{ rubbish: string }>(), props => React.createElement("div"));

        const rubbish = DerivedRubbish({ rubbish: "rubbish" });
        expect(PolyBook.isInstance(rubbish)).toEqual(false);

        const store = PolyProduct.reduce.store();
        expect(PolyBook.isCursor(snapshot(store))).toEqual(false);
        
        store.dispatch(replace(book1));

        var cursor1 = snapshot(store);
        expect(PolyBook.isCursor(cursor1)).toEqual(true);

        if (PolyBook.isCursor(cursor1)) {
            expect(cursor1.state.title).toEqual("Frogs");

            cursor1.$(Book.title)(replace("Fish"));

            var cursor2 = snapshot(store);
            expect(PolyBook.isCursor(cursor2)).toEqual(true);
            if (PolyBook.isCursor(cursor2)) {
                expect(cursor2.state.title).toEqual("Fish");
            }
        }

        if (DerivedRubbish.isCursor(cursor1)) {
            expect(cursor1.state.rubbish).toEqual("Should never get here");
        }
    });
});

