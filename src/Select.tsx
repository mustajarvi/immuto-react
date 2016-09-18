import * as React from "react";
import { Property, replace } from "immuto";
import { FormElementProps, removeProps } from "./FormElementProps";
import { optimize } from "./optimize";

export interface SelectProps<T> extends FormElementProps {
    binding: Property<T>;
    options: T[];
    labels?: (value: T) => string;
    size?: number;
}

function stringify(value: any): string {
    if (value === undefined) {
        return "undefined";
    }
    value = value.valueOf();
    return JSON.stringify(value);
}

export function TypedSelect<T>() {
    return optimize((props: SelectProps<T>) => {

        const labels = props.labels || ((value: T) => value + "");

        function updateValue(ev: React.FormEvent<HTMLSelectElement>) {
            // Find a value in the list that coerces to the new value
            for (const option of props.options) {
                if (stringify(option) === ev.currentTarget.value) {
                    props.binding(replace(option));
                    return;
                }
            }
        }

        return <select {...removeProps(props, "binding", "options")}
                        value={stringify(props.binding.state)} 
                        onChange={updateValue}>
            {
                props.options.map(option => {
                    const val = stringify(option);
                    return <option key={val} value={val}>{labels(option)}</option>
                })
            }
            </select>;
    });
}

export const Select = TypedSelect<any>();
export const SelectString = TypedSelect<string>();
export const SelectNumber = TypedSelect<number>();
