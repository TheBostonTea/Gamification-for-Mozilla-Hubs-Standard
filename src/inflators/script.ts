import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Script, RemoteHoverTarget, SingleActionButton } from "../bit-components";


export type ScriptParams = {
    script: string;
}

export function inflateScript( world: HubsWorld, eid: number, params: ScriptParams) {
    console.log("Inflate script %d", eid);
    addComponent(world, Script, eid);
    Script.script[eid] = APP.getSid(params.script);

    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, SingleActionButton, eid);
}