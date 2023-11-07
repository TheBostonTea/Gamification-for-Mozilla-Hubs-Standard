import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dobject, Networked, NetworkedGame4dobject } from "../bit-components";

// Bitflag for is active yes/no. 
// TODO: deprecate flags!
export const GAME4DOBJECT_FLAGS = {
    ACTIVE: 1 << 0,
    HASVARIABLE: 1 << 1
}

// const Game4dTypes = new Map ([
//     ['string', 1],
//     ['uint', 2],
//     ['sint', 3],
//     ['float', 4]
// ]);

export type G4DObjectParams = {
    variables: string
}

export function inflateG4DObject( world: HubsWorld, eid: number, params: G4DObjectParams) {

    console.log("Inflate G4DObject %d", eid);
    addComponent(world, Game4dobject, eid);
    addComponent(world, Networked, eid);
    addComponent(world, NetworkedGame4dobject, eid);

    Game4dobject.varid[eid] = G4D.registerVars(eid, params.variables);
    Game4dobject.actid[eid] = G4D.getActid(eid)!;

    NetworkedGame4dobject.varid[eid] = Game4dobject.varid[eid];
    NetworkedGame4dobject.updates[eid] = APP.getSid("");
    NetworkedGame4dobject.actid[eid] = Game4dobject.actid[eid];
    NetworkedGame4dobject.actions[eid] = APP.getSid("");
}
