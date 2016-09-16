import * as React from "react";
import * as ReactDOM from "react-dom";
import { optimize } from "../src/optimize";

import { jsdom, DocumentWithParentWindow } from "jsdom";

describe("optimize", () => {

    it("optimizes rendering", () => {

        let rendered = 0;

        const Comp1 = ({x, y}: { x: string, y: number }) => {
            rendered++;
            return React.createElement("div", undefined, [x, y + ""]);
        };

        const Comp2 = optimize(Comp1);

        const doc = jsdom("<div></div>");
        propagateToGlobal(doc);
        const root = doc.querySelector("div");

        ReactDOM.render(React.createElement(Comp2, { y: 43, x: "hi" }), root);
        expect(rendered).toEqual(1);

        ReactDOM.render(React.createElement(Comp2, { y: 44, x: "hi" }), root);
        expect(rendered).toEqual(2);

        // same props, shouldn't render
        ReactDOM.render(React.createElement(Comp2, { y: 44, x: "hi" }), root);
        expect(rendered).toEqual(2);

        ReactDOM.render(React.createElement(Comp2, { y: 44, x: "bye" }), root);
        expect(rendered).toEqual(3);
    });

    it("correctly handles wrapper objects implementing valueOf", () => {

        let rendered = 0;

        function wrap(val: any) {
            return { valueOf() { return val } };
        }

        const Comp1 = ({x, y}: { x: any, y: any }) => {
            rendered++;
            return React.createElement("div", undefined, [x.valueOf() + "", y.valueOf() + ""]);
        };

        const Comp2 = optimize(Comp1);

        const doc = jsdom("<div></div>");
        propagateToGlobal(doc);
        const root = doc.querySelector("div");

        ReactDOM.render(React.createElement(Comp2, { y: wrap(43), x: "hi" }), root);
        expect(rendered).toEqual(1);

        ReactDOM.render(React.createElement(Comp2, { y: 44, x: wrap("hi") }), root);
        expect(rendered).toEqual(2);

        // same props, shouldn't render
        ReactDOM.render(React.createElement(Comp2, { y: wrap(44), x: "hi" }), root);
        expect(rendered).toEqual(2);

        // same again
        ReactDOM.render(React.createElement(Comp2, { y: 44, x: wrap("hi") }), root);
        expect(rendered).toEqual(2);

        ReactDOM.render(React.createElement(Comp2, { y: 44, x: wrap("bye") }), root);
        expect(rendered).toEqual(3);
    });
});

function propagateToGlobal(doc: DocumentWithParentWindow) {
    const proc = global as any;
    const win = doc.defaultView;
    proc.document = doc;
    proc.window = win;

    for (const key in Object.keys(win)) {
        if (key in proc) continue
        proc[key] = win[key];
    }
}
