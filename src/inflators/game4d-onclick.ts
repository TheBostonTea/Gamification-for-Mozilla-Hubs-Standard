import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Game4dOnClick, RemoteHoverTarget, SingleActionButton} from "../bit-components";

// Bitflag for is active yes/no. 
export const GAME4DONCLICK_FLAGS = {
    ACTIVE: 1 << 0,
    HASVARIABLE: 1 << 1
}

export type Game4dOnClickParams = {
    isActive: boolean,
    actions: string
}

export function inflateGame4dOnClick( world: HubsWorld, eid: number, params: Game4dOnClickParams) {
    console.log("Inflate Game4dOnClick %d", eid);
    addComponent(world, Game4dOnClick, eid);
    params.isActive && (Game4dOnClick.flags[eid] |= GAME4DONCLICK_FLAGS.ACTIVE);
    Game4dOnClick.actions[eid] = APP.getSid(params.actions);

    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, SingleActionButton, eid);
}