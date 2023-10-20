import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject } from "../bit-components";
import { HubsWorld } from "../app";
import { game4dRegisterObject , game4dDeregisterObject, game4dRegisterVariables} from "../utils/game4d-api";
import { GAME4DOBJECT_FLAGS } from "../inflators/game4d-object";

const game4dObjectQuery = defineQuery([Game4dObject]);
//Do I always need these?
const game4dObjectEnterQuery = enterQuery(game4dObjectQuery);
const game4dObjectExitQuery = exitQuery(game4dObjectQuery);

function isActive(eid: number) : boolean {
    if (Game4dObject.flags[eid] & GAME4DOBJECT_FLAGS.ACTIVE) {
        return true;
    }
    return false;
}

export function game4dObjectSystem(world: HubsWorld) {

    game4dObjectEnterQuery(world).forEach(function (eid) {
        G4D.dbg_listVars(Game4dObject.variables[eid]);

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

    game4dObjectExitQuery(world).forEach( function (eid) {
        // console.log("Deregistering Game4d Object %d with name %s", eid, APP.getString(Game4dObject.identifier[eid]));
        // let id: string = APP.getString(Game4dObject.identifier[eid])!

        // if (id != null && id != undefined) {
        //     game4dDeregisterObject(id, eid)
        // } else {
        //     console.error("Game4d Object %d has no string attached to its identifier!");
        // }

    });
}