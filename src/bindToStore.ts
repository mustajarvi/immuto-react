import { Store, Cursor, snapshot } from "immuto";
import * as React from "react";

/**
 * Given a store, and a function from cursor to JSX.Element, we return
 * a ComponentClass. The resulting component has no props - the idea
 * is to do this at the root, to produce an App component ready to be
 * rendered.
 */

export function bindToStore<S, A>(
    store: Store<S, A>,
    render: (cursor: Cursor<S, A>) => JSX.Element
): React.ComponentClass<{}> {

    return class extends React.Component<{}, { cursor?: Cursor<S, A> }> {

        private unsub?: (() => void);

        constructor() {
            super();

            this.unsub = store.subscribe(() => this.storeChanged());
            this.state = { cursor: snapshot(store) };
        }

        componentWillUnmount() {
            if (this.unsub) {
                this.unsub();
                this.unsub = undefined;
            }
        }

        storeChanged() {
            this.setState({ cursor: snapshot(store) });
        }

        render() {
            if (!this.state.cursor) {
                // won't really happen
                throw new Error('Cursor is undefined.');
            }

            return render(this.state.cursor);
        }
    }
}
