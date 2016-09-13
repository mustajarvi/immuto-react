import * as I from "immuto";
import * as React from "react";

interface SubscriberState<S, A> {
    inner?: I.Cursor<S, A>;
}

class Subscriber<Props, S, A> extends React.Component<Props, SubscriberState<S, A>> {

    private sub?: I.Subscribable;
    private unsub?: (() => void);

    constructor(
        private renderInner: (props: Props, cursor: I.Cursor<S, A>) => JSX.Element
    ) {
        super();
        this.state = {};
    }

    subscribe(subscribable: I.Subscribable) {
        if (subscribable === this.sub) {
            return;
        }

        this.unsubscribe();
        this.sub = subscribable;
        this.unsub = subscribable.subscribe(() => this.storeChanged());
    }

    unsubscribe() {
        if (this.unsub) {
            this.unsub();
            this.unsub = undefined;
            this.sub = undefined;
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    storeChanged() {
        if (this.state.inner) {
            this.setState({
                inner: this.state.inner.refresh()
            });
        }
    }

    render() {
        return this.state.inner
            ? this.renderInner(this.props, this.state.inner)
            : null;
    }
}

export function bindToStore<P, S, A>(
    render: (props: P, cursor: I.Cursor<S, A>) => JSX.Element,
    store: I.Store<S, A>
): React.ComponentClass<P> {

    return class extends Subscriber<P, S, A> {

        constructor() {
            super(render);
        }

        componentWillMount() {
            this.setState({
                inner: I.snapshot(store)
            });

            this.subscribe(store);
        }
    }
}

export interface CursorProps<S, A, K> {
    cursor: I.Cursor<S, A>;
    path: K;
}

export function bindToCursor<IS, IA, OS, OA, P, K>(
    render: (props: P, cursor: I.Cursor<IS, IA>) => JSX.Element,
    traverse: (outer: I.Cursor<OS, OA>, path: K) => I.Cursor<IS, IA>
): React.ComponentClass<P & CursorProps<OS, OA, K>> {

    type Props = P & CursorProps<OS, OA, K>;

    return class extends Subscriber<Props, IS, IA> {

        constructor() {
            super(render);
        }

        updateFromProps(newProps: Props) {
            this.subscribe(newProps.cursor.subscribable);

            const traversed = traverse(newProps.cursor, newProps.path);

            if (!this.state.inner || traversed.state !== this.state.inner.state) {
                this.setState({
                    inner: traversed
                });
            }
        }

        componentWillMount() {
            this.updateFromProps(this.props);
        }

        componentWillUpdate(nextProps: Props) {
            this.updateFromProps(this.props);
        }
    }
}
