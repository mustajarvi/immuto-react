import { DocumentWithParentWindow } from "jsdom";

export function propagateToGlobal(doc: DocumentWithParentWindow) {
    const proc = global as any;
    const win = doc.defaultView;
    proc.document = doc;
    proc.window = win;

    for (const key in Object.keys(win)) {
        if (key in proc) continue
        proc[key] = win[key];
    }
}
