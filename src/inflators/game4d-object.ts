import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Game4dObject, Networked, NetworkedGame4dObject } from "../bit-components";
// import { PlayerInfo } from "../game4d";

// Bitflag for is active yes/no. 
// TODO: deprecate flags!
export const GAME4DOBJECT_FLAGS = {
    ACTIVE: 1 << 0
}

// const Game4dTypes = new Map ([
//     ['string', 1],
//     ['uint', 2],
//     ['sint', 3],
//     ['float', 4]
// ]);

export type G4DObjectParams = {
    identifier: string,
    variables: string,
    isActive: boolean
}

export function inflateG4DObject(world: HubsWorld, eid: number, params: G4DObjectParams) {

    console.log("Inflate G4DObject %d", eid);
    addComponent(world, Game4dObject, eid);
    addComponent(world, Networked, eid);
    addComponent(world, NetworkedGame4dObject, eid);

    Game4dObject.identifier[eid] = APP.getSid(params.identifier);
    Game4dObject.varid[eid] = G4D.registerVars(eid, params.variables)!;
    Game4dObject.actid[eid] = G4D.getActid(eid)!;

    params.isActive && (Game4dObject.flags[eid] |= GAME4DOBJECT_FLAGS.ACTIVE)

    NetworkedGame4dObject.varid[eid] = Game4dObject.varid[eid];
    NetworkedGame4dObject.updates[eid] = APP.getSid("");
    NetworkedGame4dObject.actid[eid] = Game4dObject.actid[eid];
    NetworkedGame4dObject.actions[eid] = APP.getSid("");

}
