import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Game4dOnClick, RemoteHoverTarget, SingleActionButton } from "../bit-components";

export type Game4dOnClickParams = {
    behaviorRef: string
    args: string
    rets: string
}

export function inflateGame4dOnClick(world: HubsWorld, eid: number, params: Game4dOnClickParams) {
    console.debug("Inflate Game4dOnClick %d:", eid);
    console.debug(`Behavior: ${params.behaviorRef}, Args: ${params.args}`)
    addComponent(world, Game4dOnClick, eid);
    Game4dOnClick.behaviorRef[eid] = APP.getSid(params.behaviorRef);
    Game4dOnClick.args[eid] = APP.getSid(params.args);
    Game4dOnClick.rets[eid] = APP.getSid(params.rets);

    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, SingleActionButton, eid);
}