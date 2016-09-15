import * as React from "react";

/**
 * Given a react stateless component, we return a ComponentClass
 * which implements shouldComponentUpdate by comparing the values
 * of all the props to see if they've changed.
 *
 * Note that for each prop we call its valueOf method, to ensure
 * we are not comparing the identity of a wrapper for the actual
 * value of importance. Two wrappers may refer to the same value
 * and should be treated as equal.
 *
 * This protocol is obeyed by certain built-in JS types and also
 * by any immuto object with a state property (valueOf returns
 * the state.)
 *
 * Aside from this, the comparison is shallow. This will only cause
 * repaint bugs if prop values are not immutable.
 */

function getValue(props: any, key: string) {
    const val = props[key];
    return val === undefined || val === null ? val : val.valueOf();
}

export function optimize<Props>(
    statelessComponent: (props: Props) => JSX.Element
): React.ComponentClass<Props> {

    return class extends React.Component<Props, {}> {

        shouldComponentUpdate(newProps: Props) {
            const oldProps = this.props;

            return Object.keys(newProps).every(oldKey =>
                    Object.prototype.hasOwnProperty.call(newProps, oldKey)) &&
                Object.keys(newProps).every(key =>
                    getValue(newProps, key) === getValue(oldProps, key));
        }

        render() {
            return statelessComponent(this.props);
        }
    }
}
