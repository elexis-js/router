import { $Anchor, type $AnchorOptions } from "elexis/node/$Anchor";
import type { $StateArgument } from "elexis/structure/$State";
import { $Router } from "./$Router";

export interface $RouterAnchorOptions extends $AnchorOptions{}
export class $RouterAnchor extends $Anchor {
    declare protected $data: $Anchor['$data'] & {
        preventDefault: boolean;
    }
    constructor(options?: Partial<$RouterAnchorOptions>) {
        super(options);
        this.$data.preventDefault = false;
        this.on('click', (e) => { if (!this.href()) return; e.preventDefault(); if (!this.$data.preventDefault) $Router.open(this.href(), this.target())})
    }

    preventDefault(): boolean;
    preventDefault(boolean: $StateArgument<boolean>): this;
    preventDefault(boolean?: $StateArgument<boolean>) { return $.fluent(this, arguments, () => this.$data.preventDefault, () => $.set(this.$data, 'preventDefault', boolean))}
}