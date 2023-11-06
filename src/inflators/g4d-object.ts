import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { G4DObject, Networked, NetworkedG4DObject } from "../bit-components";

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
    identifier: string;
    isActive: boolean,
    variables: string
}

export function inflateG4DObject( world: HubsWorld, eid: number, params: G4DObjectParams) {

    console.log("Inflate G4DObject %d", eid);
    addComponent(world, G4DObject, eid);
    addComponent(world, Networked, eid);
    addComponent(world, NetworkedG4DObject, eid);

    G4DObject.identifier[eid] = APP.getSid(params.identifier);
    params.isActive && (G4DObject.flags[eid] |= GAME4DOBJECT_FLAGS.ACTIVE);
    G4DObject.varid[eid] = G4D.registerVars(eid, params.variables);
    NetworkedG4DObject.varid[eid] = G4DObject.varid[eid];
}