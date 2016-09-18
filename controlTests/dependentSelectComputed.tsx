import * as React from "react";

import { TextInput, SelectNumber, SelectString, RadioButtonString } from "../index";
import * as I from "immuto";
import { amend, property, reducer, collection, primitive, arrayOperations } from "immuto";

export interface DependentSelectComputed {
    names: string[];
    selectedIndex: number;
}

export namespace DependentSelectComputed {

    export const names = collection("NAMES", primitive<string>(), arrayOperations<string>(), 
        (s: DependentSelectComputed) => s.names);

    export const selectedIndex = property("SELECTED_INDEX", 
        (s: DependentSelectComputed) => s.selectedIndex);
    
    export const selectedName = property("COMPUTED_NAME", 
        (s: DependentSelectComputed) => s.names[s.selectedIndex] || "",
        (s, selectedName) => {
            const selectedIndex = s.names.indexOf(selectedName);
            return selectedIndex === -1 ? s : amend(s, { selectedIndex }); 
        }
    );

    export const empty: DependentSelectComputed = {
        names: ["Homer", "Marge", "Bart", "Lisa", "Maggie"],
        selectedIndex: 0
    };

    export const reduce = reducer(empty)
        .action(names)
        .action(selectedIndex)
        .action(selectedName);

    export type Cursor = typeof reduce.cursorType;
}

export function DependentSelectComputedEditor({ binding }: { binding: DependentSelectComputed.Cursor }) {
    
    const numbers: number[] = [];
    for (var n = 0; n < binding.state.names.length; n++) {
        numbers.push(n);
    }

    return (
        <div>
            <table><tbody>
                <tr>
                    <td>Select by index</td>
                    <td><SelectNumber binding={DependentSelectComputed.selectedIndex(binding)} options={numbers} /></td>
                </tr>
                <tr>
                    <td>Select by name</td>
                    <td><SelectString binding={DependentSelectComputed.selectedName(binding)} options={binding.state.names} /></td>
                </tr>
                <tr>
                    <td>Edit name</td>
                    <td><TextInput binding={DependentSelectComputed.names(binding, binding.state.selectedIndex)} /></td>
                </tr>
                <tr>
                    <td>Radio buttons</td>
                    <td>
                    {
                        binding.state.names.map(name => (
                            <div key={name}>
                                <label>
                                    <RadioButtonString binding={DependentSelectComputed.selectedName(binding)} 
                                                       selectionValue={name} /> {name}
                                </label>
                            </div>
                        ))
                    }
                    </td>
                </tr>
            </tbody></table>
        </div>
    );
}
