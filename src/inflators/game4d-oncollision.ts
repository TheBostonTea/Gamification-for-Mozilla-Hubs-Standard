import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dOnCollision, } from "../bit-components";

export type Game4dOnCollisionParams = {
    behaviorRef: string
    args: string
    rets: string
    timeout: number
}

export function inflateGame4dOnCollision(world: HubsWorld, eid: number, params: Game4dOnCollisionParams) {
    console.debug("Inflate Game4dOnCollision %d:", eid);
    console.debug(`Behavior: ${params.behaviorRef}, Args: ${params.args}`)
    addComponent(world, Game4dOnCollision, eid);
    Game4dOnCollision.behaviorRef[eid] = APP.getSid(params.behaviorRef);
    Game4dOnCollision.args[eid] = APP.getSid(params.args);
    Game4dOnCollision.rets[eid] = APP.getSid(params.rets);
    Game4dOnCollision.timeout[eid] = params.timeout;

    // addComponent(world, boxCollider, eid)
}