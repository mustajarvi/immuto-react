import * as React from "react";

import { TextInput, SelectNumber, SelectString } from "../index";
import * as I from "immuto";
import { amend, property, reducer, reference, primitive, array } from "immuto";

export type Names = string[];

export namespace Names {
    export const empty: Names = [];
    export const at = array(primitive<string>());
    export const reduce = reducer(empty).action(at);
}

export interface DependentSelectReal {
    names: Names;
    selectedIndex: number;
    selectedName: string;
}

/**
 * This is a needlessly complicated version of DependentSelectComputed.
 * Instead of implemented selectedName as a computation over the other
 * data, it actually stores it. This means the other things (names,
 * selectedIndex) have to have custom setters to try and keep selectedName
 * up to date. Easy to get wrong (see if you can spot any bugs...)
 */

export namespace DependentSelectReal {

    export const names = reference("NAMES", Names, 
        (s: DependentSelectReal) => s.names,
        (s, names) => amend(s, { names, selectedName: names[s.selectedIndex] || "" }));

    export const selectedIndex = property("SELECTED_INDEX", 
        (s: DependentSelectReal) => s.selectedIndex,
        (s, selectedIndex) => amend(s, { selectedIndex, selectedName: s.names[selectedIndex] || "" })
    );

    export const selectedName = property("SELECTED_NAME", 
        (s: DependentSelectReal) => s.selectedName,
        (s, selectedName) => {
            const selectedIndex = s.names.indexOf(selectedName);
            return selectedIndex === -1 ? s : amend(s, { selectedIndex, selectedName }); 
        }
    );

    export const empty: DependentSelectReal = {
        names: ["Homer", "Marge", "Bart", "Lisa", "Maggie"],
        selectedIndex: 0,
        selectedName: "Homer"
    };

    export const reduce = reducer(empty)
        .action(names)
        .action(selectedIndex)
        .action(selectedName);

    export type Cursor = typeof reduce.cursorType;
}

export function DependentSelectRealEditor({ binding: model }: { binding: DependentSelectReal.Cursor }) {
    
    const numbers: number[] = [];
    for (var n = 0; n < model.state.names.length; n++) {
        numbers.push(n);
    }

    return (
        <div>
            <table><tbody>
                <tr>
                    <td>Select by index</td>
                    <td><SelectNumber binding={model.$(DependentSelectReal.selectedIndex)} options={numbers} /></td>
                </tr>
                <tr>
                    <td>Select by name</td>
                    <td><SelectString binding={model.$(DependentSelectReal.selectedName)} options={model.state.names} /></td>
                </tr>
                <tr>
                    <td>Edit name</td>
                    <td><TextInput binding={model.$(DependentSelectReal.names)
                                                 .$(Names.at(model.state.selectedIndex))} /></td>
                </tr>                
            </tbody></table>            
        </div>
    );
}

