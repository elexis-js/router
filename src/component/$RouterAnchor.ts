import { $Anchor, $AnchorOptions, $StateArgument } from "elexis";

export interface $RouterAnchorOptions extends $AnchorOptions{}
export class $RouterAnchor extends $Anchor {
    constructor(options?: $RouterAnchorOptions) {
        super(options);
        Object.assign(this.__$property__, {preventDefault: false})
        this.on('click', (e) => { if (!this.href()) return; e.preventDefault(); if (!this.__$property__.preventDefault) $.open(this.href(), this.target())})
    }

    preventDefault(): boolean;
    preventDefault(boolean: $StateArgument<boolean>): this;
    preventDefault(boolean?: $StateArgument<boolean>) { return $.fluent(this, arguments, () => this.__$property__.preventDefault, () => $.set(this.__$property__, 'preventDefault', boolean))}
}