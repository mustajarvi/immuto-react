import * as React from "react";

import { TextInput, SelectNumber, SelectString, RadioButtonString } from "../index";
import * as I from "immuto";
import { amend, property, reducer, reference, primitive, array } from "immuto";

export type Names = string[];

export namespace Names {
    export const empty: Names = [];
    export const at = array(primitive<string>());
    export const reduce = reducer(empty).action(at);
}

export interface DependentSelectComputed {
    names: Names;
    selectedIndex: number;
}

export namespace DependentSelectComputed {

    export const names = reference("NAMES", Names, 
        (s: DependentSelectComputed) => s.names);

    export const selectedIndex = property("SELECTED_INDEX", 
        (s: DependentSelectComputed) => s.selectedIndex);

/**
 * An example of a "virtual" or "computed" property. It's really
 * just another way of setting selectedIndex. Compare with
 * DependentSelectedReal, which does it the hard way.
 */    
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
                    <td><SelectNumber binding={binding.$(DependentSelectComputed.selectedIndex)} options={numbers} /></td>
                </tr>
                <tr>
                    <td>Select by name</td>
                    <td><SelectString binding={binding.$(DependentSelectComputed.selectedName)} options={binding.state.names} /></td>
                </tr>
                <tr>
                    <td>Edit name</td>
                    <td><TextInput binding={binding.$(DependentSelectComputed.names)
                                                   .$(Names.at(binding.state.selectedIndex))} /></td>
                </tr>
                <tr>
                    <td>Radio buttons</td>
                    <td>
                    {
                        binding.state.names.map(name => (
                            <div key={name}>
                                <label>
                                    <RadioButtonString binding={binding.$(DependentSelectComputed.selectedName)} 
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
