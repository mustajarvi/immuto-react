import * as React from "react";
import { Property, replace } from "immuto";
import { FormElementProps, removeProps } from "./FormElementProps";

export interface CheckBoxProps extends FormElementProps {
    binding: Property<boolean | undefined>;
}

export function CheckBox(props: CheckBoxProps) {

    function setIndeterminate(input: HTMLInputElement) {
        if (input) {
            input.indeterminate = props.binding.state === undefined;
        }
    }

    return <input type="checkbox" {...removeProps(props, "binding")}
                  checked={props.binding.state || false}
                  ref={setIndeterminate}
                  onChange={e => {
                      props.binding(replace(e.currentTarget.checked));
                  }}/>;
}
