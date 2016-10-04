import * as React from "react";
import { Cursor, ReducerBuilder, ReducerOrProvider, Replace, builder, getReducer, amend, assign, action } from "immuto";

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

export interface PolymorphFactory<S, A, P, D> {     
    (init: D): Polymorph<S, A, P>;
    from<S2, A2>(possibleInstance: Polymorph<S2, A2, P>): Polymorph<D, A, P> | undefined;
    fromCursor<S2, A2>(possibleCursor: Cursor<Polymorph<S2, A2, P>, A2>): Cursor<Polymorph<D, A, P>, A> | undefined;
};

export interface PolymorphDefinition<S, A, P> {
    empty: Polymorph<S, A, P>;
    reduce: ReducerBuilder<Polymorph<S, A, P>, A | Replace<Polymorph<S, A, P>>>;

    derive<DS, DA>(
        derivedProvider: ReducerOrProvider<DS & S, DA | A>,
        derivedRenderer: (props: P & { binding: Cursor<DS & S, DA | A> }) => JSX.Element
    ): PolymorphFactory<S, A, P, DS & S>;

    polymorphType: Polymorph<S, A, P>;
    cursorType: Cursor<Polymorph<S, A, P>, A | Replace<Polymorph<S, A, P>>>;

    props<P2>(): PolymorphDefinition<S, A, P2>;
}

function defineWithProps<S, A, P>(
    reducerOrProvider: ReducerOrProvider<S, A>
): PolymorphDefinition<S, A, P> {

    const plainReducer = getReducer(reducerOrProvider);

    const empty = stub<S, A, P>(plainReducer.empty);

    const reducer = (state: Polymorph<S, A, P>, action: A): Polymorph<S, A, P> => { 
        if (state === undefined) {
            state = empty;
        }

        return amend(state.polymorphicType.reduce(state, action),
                { polymorphicType: state.polymorphicType });
    }

    const reduce = builder(empty, reducer).action(action("REPLACE", 
        (s: Polymorph<S, A, P>, v: Polymorph<S, A, P>) => v));
 
    function derive<DS, DA>(                    
        derivedProvider: ReducerOrProvider<DS & S, DA | A>,
        derivedRenderer: (props: P & { binding: Cursor<DS & S, DA | A> }) => JSX.Element
    ): PolymorphFactory<S, A, P, DS & S> {
        
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

        function from<S2, A2>(possibleInstance: Polymorph<S2, A2, P>) {
            const asserted = possibleInstance as any as Polymorph<DS & S, A, P>;
            return asserted.polymorphicType === polymorphicType 
                ? asserted : undefined;
        }

        function fromCursor<S2, A2>(possibleCursor: Cursor<Polymorph<S2, A2, P>, A2>) {
            const asserted = possibleCursor as any as Cursor<Polymorph<DS & S, A, P>, A>;
            return asserted.state.polymorphicType === polymorphicType 
                ? asserted : undefined;
        }

        return assign(wrap, { from, fromCursor });
    }

    return {
        empty,
        reduce,
        derive,
        polymorphType: undefined! as Polymorph<S, A, P>,
        cursorType: undefined! as Cursor<Polymorph<S, A, P>, A>,
        props<P2>() {
            return defineWithProps<S, A, P2>(reducerOrProvider);
        }
    };
}

export function polymorph<S, A>(
    reducerOrProvider: ReducerOrProvider<S, A>
): PolymorphDefinition<S, A, {}> {
    return defineWithProps<S, A, {}>(reducerOrProvider);
}
