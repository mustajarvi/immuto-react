import * as React from "react";

import { CheckBox } from "../index";
import * as I from "immuto";
import { amend, property, reducer, reference, primitive, array, replace } from "immuto";

export interface Selectable {
    label: string;
    selected: boolean;
}

export namespace Selectable {
    export const selected = property("SELECTED", (s: Selectable) => s.selected);
    export const empty: Selectable = { label: "", selected: false }
    export const reduce = reducer(empty).action(selected);
    export type Cursor = typeof reduce.cursorType;
}

export type Selectables = Selectable[];

export namespace Selectables {
    export const empty: Selectables = [];
    export const at = array(Selectable.reduce);
    export const reduce = reducer(empty).action(at);
}

export function SelectableEditor({ binding }: { binding: Selectable.Cursor }) {
    
    return (
        <label>
            <CheckBox binding={Selectable.selected(binding)} /> {binding.state.label}
        </label>
    );
}

export interface SelectAll {
    selectables: Selectable[];
}

export namespace SelectAll {

    export const selectables = reference("SELECTABLES", Selectables.reduce, 
        (s: SelectAll) => s.selectables);

    export const all = property("ALL", 
        (s: SelectAll) => {
            const count = s.selectables.filter(i => i.selected).length;
            return count === s.selectables.length ? true :
                count === 0 ? false :
                undefined;
        },
        (s: SelectAll, v: boolean) => ({

            selectables: s.selectables.map(i => 
                Selectable.reduce(i, Selectable.selected.update(replace(v))))
        })
    );

    export const empty: SelectAll = {
        selectables: [
            { label: "Homer", selected: false },
            { label: "Marge", selected: true },
            { label: "Bart", selected: false },
            { label: "Lisa", selected: true },
            { label: "Maggie", selected: true }
        ]
    };

    export const reduce = reducer(empty)
        .action(selectables)
        .action(all);

    export type Cursor = typeof reduce.cursorType;
}

export function SelectAllEditor({ binding: model }: { binding: SelectAll.Cursor }) {
    
    return (
        <div>
            <div><label><CheckBox binding={model.$(SelectAll.all)} /> Select all</label></div>
            <hr/>
            {
                model.state.selectables.map((s, i) => (
                    <div key={s.label}>
                        <SelectableEditor binding={model.$(SelectAll.selectables).$(Selectables.at(i))}/> 
                    </div>
                ))
            }
        </div>
    );
}
