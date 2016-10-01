import * as React from "react";
import { Cursor, Reducer, ReducerOrProvider, getReducer, amend, assign } from "immuto";

export type PolymorphicTypeMethods<S, A, P> = {
    reduce(state: S, action: A): S;
    render(props: P & { binding: Cursor<S, A> }): JSX.Element;
}

export type Polymorph<S, A, P> = S & { polymorphicType: PolymorphicTypeMethods<S, A, P> };

export function render<S, A, P>(props: P & { binding: Cursor<Polymorph<S, A, P>, A> }) {
    return props.binding.state.polymorphicType.render(props);
}

function stub<S, A, P>(emptyState: S): Polymorph<S, A, P> {        
    const reduce = (state: S, action: A) => state;
    const render = (props: {}) => undefined! as JSX.Element;
    return amend(emptyState, { polymorphicType: { reduce, render } });
}

function defineWithProps<S, A, P>(reducerOrProvider: ReducerOrProvider<S, A>) {

    const plainReducer = getReducer(reducerOrProvider);

    const reducer = (state: Polymorph<S, A, P>, action: A): Polymorph<S, A, P> => 
            amend(state.polymorphicType.reduce(state, action),
                    { polymorphicType: state.polymorphicType });

    const empty = stub<S, A, P>(plainReducer.empty);

    const reduce: Reducer<Polymorph<S, A, P>, A> = assign(
        reducer, { empty }
    );

    function derive<DS, DA>(                    
        derivedProvider: ReducerOrProvider<DS & S, DA | A>,
        derivedRenderer: (props: P & { binding: Cursor<DS & S, DA | A> }) => JSX.Element
    ): (init: DS & S) => Polymorph<S, A, P> {
        const derivedReducer = getReducer(derivedProvider);

        const polymorphicType: PolymorphicTypeMethods<S, A, P> = {
            reduce(state: S, action: A): S {
                return wrap(derivedReducer(state as DS & S, action));
            },

            render(props: P & { binding: Cursor<S, A> }) {
                return derivedRenderer(props as (P & { binding: Cursor<DS & S, DA | A> }));
            }
        };

        function wrap(state: DS & S): Polymorph<S, A, P> {
            return amend(state, { polymorphicType });
        }

        return wrap;                        
    }

    return {
        empty,
        reduce,
        derive,
        polymorphType: undefined! as Polymorph<S, A, P>
    };
}

export function polymorph<S, A>(reducerOrProvider: ReducerOrProvider<S, A>) {

    return assign(defineWithProps<S, A, {}>(reducerOrProvider), {
        props<P>() {
            return defineWithProps<S, A, P>(reducerOrProvider);
        }
    });
}