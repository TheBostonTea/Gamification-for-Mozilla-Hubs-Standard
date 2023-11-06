import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dobject, NetworkedGame4dobject } from "../bit-components";
import { HubsWorld } from "../app";
import { game4dRegisterObject , game4dDeregisterObject, game4dRegisterVariables} from "../utils/game4d-api";
import { GAME4DOBJECT_FLAGS } from "../inflators/game4d-object";

const game4dObjectQuery = defineQuery([Game4dobject]);
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

    game4dObjectQuery(world).forEach( function (eid) {

        if (Game4dobject.varid[eid] != NetworkedGame4dobject.varid[eid]) {
            console.log("Do variable updates!");
            G4D.synchronize(eid, NetworkedGame4dobject.updates[eid], NetworkedGame4dobject.varid[eid]);
            Game4dobject.varid[eid] = NetworkedGame4dobject.varid[eid];
        }
    });
}