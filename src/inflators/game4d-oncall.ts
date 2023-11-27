import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dOnCall } from "../bit-components";

export const ON_CALL_FLAGS = {
    limitSources: 1 << 0
}

export type Game4dOnCallParams = {
    behaviorRef: string,
    args: string,
    rets: string,
    limitSources: boolean,
    allowedSources: string,
}

export function inflateGame4dOnCall(world: HubsWorld, eid: number, params: Game4dOnCallParams) {
    console.debug("Inflate Game4dOnCall %d:", eid);
    console.debug(`Behavior: ${params.behaviorRef}, Args: ${params.args}`)
    addComponent(world, Game4dOnCall, eid);
    Game4dOnCall.behaviorRef[eid] = APP.getSid(params.behaviorRef);
    Game4dOnCall.args[eid] = APP.getSid(params.args);
    Game4dOnCall.rets[eid] = APP.getSid(params.rets);
    params.limitSources && (Game4dOnCall.flags[eid] |= ON_CALL_FLAGS.limitSources);
    Game4dOnCall.allowedSources[eid] = APP.getSid(params.allowedSources);
    console.log(params.allowedSources);

    // addComponent(world, boxCollider, eid)
}