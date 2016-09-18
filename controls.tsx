import * as React from "react";
import * as ReactDOM from "react-dom";
import { TextInput, SelectNumber, SelectString, bindToStore } from "./index";
import { reference, reducer, Cursor } from "immuto";

import { DependentSelectComputed, DependentSelectComputedEditor } from "./controlTests/dependentSelectComputed";
import { DependentSelectReal, DependentSelectRealEditor } from "./controlTests/dependentSelectReal";
import { SelectAll, SelectAllEditor } from "./controlTests/selectAll";

interface AllTests {
    dependentSelectReal: DependentSelectReal;
    dependentSelectComputed: DependentSelectComputed;
    selectAll: SelectAll;
}

namespace AllTests {
    export const dependentSelectReal = reference("DSR", 
        DependentSelectReal.reduce, (s: AllTests) => s.dependentSelectReal);

    export const dependentSelectComputed = reference("DSC", 
        DependentSelectComputed.reduce, (s: AllTests) => s.dependentSelectComputed);

    export const selectAll = reference("SELECT_ALL", 
        SelectAll.reduce, (s: AllTests) => s.selectAll);

    export const empty: AllTests = {
        dependentSelectReal: DependentSelectReal.reduce.empty,
        dependentSelectComputed: DependentSelectComputed.reduce.empty,
        selectAll: SelectAll.reduce.empty
    }

    export const reduce = reducer(empty)
        .action(dependentSelectReal)
        .action(dependentSelectComputed)
        .action(selectAll);

    export type Cursor = typeof reduce.cursorType;
}

function AllTestsEditor({ binding }: { binding: AllTests.Cursor }) {
    
    return (
        <div>
            <fieldset>
                <legend>DependentSelectReal</legend>
                <DependentSelectRealEditor binding={ AllTests.dependentSelectReal(binding) } />
            </fieldset>
            <fieldset>
                <legend>DependentSelectComputed</legend>
                <DependentSelectComputedEditor binding={ AllTests.dependentSelectComputed(binding) } />
            </fieldset>
            <fieldset>
                <legend>SelectAll</legend>
                <SelectAllEditor binding={ AllTests.selectAll(binding) } />
            </fieldset>
        </div>
    );
}

const App = bindToStore(AllTests.reduce.store(), b => <AllTestsEditor binding={b} />);
ReactDOM.render(<App />, document.querySelector("#root"));

