import * as React from "react";
import { Property, replace } from "immuto";
import { FormElementProps, removeProps } from "./FormElementProps";

export interface RadioButtonProps<T> extends FormElementProps {
    binding: Property<T>;
    selectionValue: T;
}

export function TypedRadioButton<T>() {
    return (props: RadioButtonProps<T>) => {

        function updateValue(ev: React.FormEvent<HTMLInputElement>) {
            if (ev.currentTarget.checked) {
                props.binding(replace(props.selectionValue))
            }
        }

        return <input type="radio" 
            {...removeProps(props, "binding", "selectionValue")}
            checked={props.binding.state == props.selectionValue}
            onChange={updateValue} />;
    };
}

export const RadioButton = TypedRadioButton<any>();
export const RadioButtonString = TypedRadioButton<string>();
export const RadioButtonNumber = TypedRadioButton<number>();
