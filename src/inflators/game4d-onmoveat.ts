import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dOnMoveAt } from "../bit-components";

export type Game4dOnMoveAtParams = {
    behaviorRef: string,
    args: string,
    rets: string,
    interactionRange: number,
    timeout: number;
}

export function inflateGame4dOnMoveAt(world: HubsWorld, eid: number, params: Game4dOnMoveAtParams) {
    console.debug("Inflate Game4dOnMoveAt %d:", eid);
    console.debug(`Behavior: ${params.behaviorRef}, Args: ${params.args}`)
    addComponent(world, Game4dOnMoveAt, eid);
    Game4dOnMoveAt.behaviorRef[eid] = APP.getSid(params.behaviorRef);
    Game4dOnMoveAt.args[eid] = APP.getSid(params.args);
    Game4dOnMoveAt.rets[eid] = APP.getSid(params.rets);
    Game4dOnMoveAt.range[eid] = params.interactionRange;
    Game4dOnMoveAt.timeout[eid] = params.timeout;
    Game4dOnMoveAt.lastInteraction[eid] = 0.0;

    // addComponent(world, boxCollider, eid)
}