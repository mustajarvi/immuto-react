import { CSSProperties } from "react";
import { assign } from "immuto";

export interface FormElementProps {
    autofocus?: boolean;
    className?: string;
    style?: CSSProperties;
    disabled?: boolean;
    form?: string;
    name?: string;
    readonly?: boolean;
    required?: boolean;
    tabindex?: number;
}

export function removeProps(props: any, ...names: string[]) {
    const clone = assign({}, props);
    for (const name of names) {
        delete clone[name];
    }
    return clone;
}
