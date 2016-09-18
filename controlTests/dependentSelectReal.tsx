import * as React from "react";

import { TextInput, SelectNumber, SelectString } from "../index";
import * as I from "immuto";
import { amend, property, reducer, collection, primitive, arrayOperations } from "immuto";

export interface DependentSelectReal {
    names: string[];
    selectedIndex: number;
    selectedName: string;
}

export namespace DependentSelectReal {

    export const names = collection("NAMES", primitive<string>(), arrayOperations<string>(), (s: DependentSelectReal) => s.names,
        (s, names) => amend(s, { names, selectedName: names[s.selectedIndex] || "" }));

    export const selectedIndex = property("SELECTED_INDEX", (s: DependentSelectReal) => s.selectedIndex,
        (s, selectedIndex) => amend(s, { selectedIndex, selectedName: s.names[selectedIndex] || "" })
    );

    export const selectedName = property("SELECTED_NAME", (s: DependentSelectReal) => s.selectedName,
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

export function DependentSelectRealEditor({ binding }: { binding: DependentSelectReal.Cursor }) {
    
    const numbers: number[] = [];
    for (var n = 0; n < binding.state.names.length; n++) {
        numbers.push(n);
    }

    return (
        <div>
            <table><tbody>
                <tr>
                    <td>Select by index</td>
                    <td><SelectNumber binding={DependentSelectReal.selectedIndex(binding)} options={numbers} /></td>
                </tr>
                <tr>
                    <td>Select by name</td>
                    <td><SelectString binding={DependentSelectReal.selectedName(binding)} options={binding.state.names} /></td>
                </tr>
                <tr>
                    <td>Edit name</td>
                    <td><TextInput binding={DependentSelectReal.names(binding, binding.state.selectedIndex)} /></td>
                </tr>                
            </tbody></table>            
        </div>
    );
}

