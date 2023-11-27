import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject, NetworkedGame4dObject } from "../bit-components";
import { HubsWorld } from "../app";
import { game4dRegisterObject, game4dDeregisterObject, game4dRegisterVariables } from "../utils/game4d-api_bak";
import { GAME4DOBJECT_FLAGS } from "../inflators/game4d-object";

const game4dObjectQuery = defineQuery([Game4dObject]);
//Do I always need these?
const dbgQuery = enterQuery(game4dObjectQuery);
// const game4dObjectExitQuery = exitQuery(game4dObjectQuery);

export function game4dObjectSystem(world: HubsWorld) {

    dbgQuery(world).forEach(function (eid) {
        G4D.dbg_listVars(eid);

        // if (id != null && id != undefined) {
        //     game4dRegisterObject(id, eid, isActive(eid));
        // } else {
        //     console.error("Game4d Object %d has no string attached to its identifier!");
        // }

        // let variables = APP.getString(Game4dObject.variables[eid])

        // if (variables != null && id != undefined) {
        //     game4dRegisterVariables(id, variables);
        // } else {
        //     console.warn("Object %s has no variables! Might be expected behavior, but this is worth checking!", id);
        // }

    });

    game4dObjectQuery(world).forEach(function (eid) {

        if (Game4dObject.varid[eid] != NetworkedGame4dObject.varid[eid]) {
            // console.log("Do variable updates!");
            G4D.synchronizeVars(eid, NetworkedGame4dObject.updates[eid], NetworkedGame4dObject.varid[eid]);
            Game4dObject.varid[eid] = NetworkedGame4dObject.varid[eid];
        }

        if (Game4dObject.actid[eid] != NetworkedGame4dObject.actid[eid]) {
            // console.log("Do action updates!");
            G4D.synchronizeActs(eid, NetworkedGame4dObject.actions[eid], NetworkedGame4dObject.actid[eid]);
            Game4dObject.actid[eid] = NetworkedGame4dObject.actid[eid];
        }
    });
}