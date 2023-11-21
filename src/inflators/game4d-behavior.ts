import { HubsWorld } from "../app";


export type Game4DBehaviorParams = {
    name: string,
    params: string,
    returnTypes: string,
    behavior: string
}

export function inflateGame4DBehavior(world: HubsWorld, eid: number, params: Game4DBehaviorParams) {

    console.log("Inflate G4DBehavior %d", eid);
    G4D.registerBehavior(params.name, params.params, params.returnTypes, params.behavior);

    // Do not add components: Behaviors 'float' in memory!
    // TODO: rewrite Behaviors to be components, that allow for interaction flags, better following the entity component system pattern.
    //      (For after the thesis...)
}
