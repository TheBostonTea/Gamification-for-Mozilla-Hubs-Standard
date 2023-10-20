import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dObject } from "../bit-components";

// Bitflag for is active yes/no. 
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

export type Game4dObjectParams = {
    identifier: string;
    isActive: boolean,
    variables: string
}

export function inflateGame4dObject( world: HubsWorld, eid: number, params: Game4dObjectParams) {
    console.log("Inflate Game4dObject %d", eid);
    addComponent(world, Game4dObject, eid);
    Game4dObject.identifier[eid] = APP.getSid(params.identifier);
    params.isActive && (Game4dObject.flags[eid] |= GAME4DOBJECT_FLAGS.ACTIVE);
    Game4dObject.variables[eid] = G4D.registerVars(params.variables)
}