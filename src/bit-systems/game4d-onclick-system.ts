import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject, Game4dOnClick, Interacted, NetworkedGame4dObject } from "../bit-components";
import { HubsWorld } from "../app";
// import { game4dRegisterObject, game4dDeregisterObject, game4dRegisterVariables, game4dGetIDFromEID, game4dRegisterOnClick, game4dOnClick } from "../utils/game4d-api_bak";
// import { GAME4DONCLICK_FLAGS } from "../inflators/game4d-onclick";
import { takeOwnership } from "../utils/take-ownership";
import { GAME4DOBJECT_FLAGS } from "../inflators/game4d-object";

const game4dOnClickQuery = defineQuery([Game4dOnClick]);
const game4dOnClickEnterQuery = enterQuery(game4dOnClickQuery);
const game4dOnClickExitQuery = exitQuery(game4dOnClickQuery);


function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

export function game4dOnClicksystem(world: HubsWorld) {

    game4dOnClickEnterQuery(world).forEach(function (eid) {
        // G4D.dbg_listVars(G)
        // console.log("Register On-Click");
        // let id = game4dGetIDFromEID(eid);

        // if (typeof id != "undefined") {
        //     let actions = "";
        //     let actionstr = APP.getString(Game4dOnClick.actions[eid]);
        //     if(actionstr != null && typeof actionstr != "undefined") {
        //         actions = actionstr;
        //     }
        //     game4dRegisterOnClick(id, eid, isActive(eid), actions);
        // } else {
        //     console.error("ERROR: No Game4d Object found for Eid %d", eid);
        // }
    });

    // game4dOnClickExitQuery(world).forEach( function (eid) {


    // });

    game4dOnClickQuery(world).forEach(function (eid) {

        // // If the script object was clicked, Do this!
        if (clicked(eid) && Game4dObject.flags[eid] & GAME4DOBJECT_FLAGS.ACTIVE) {
            console.log("Clicked!")

            G4D.callBehavior(APP.getString(Game4dOnClick.behaviorRef[eid])!, eid, [], APP.getString(Game4dOnClick.args[eid])!, APP.getString(Game4dOnClick.rets[eid])!);
            console.log(Game4dOnClick.behaviorRef[eid]);

            if (G4D.hasUpdates(eid) || G4D.hasActions(eid)) {
                takeOwnership(world, eid);

                if (G4D.hasUpdates(eid)) {
                    NetworkedGame4dObject.updates[eid] = G4D.fetchUpdates(eid)!;
                    Game4dObject.varid[eid] = G4D.getVarid(eid)!;
                    NetworkedGame4dObject.varid[eid] = Game4dObject.varid[eid];
                }

                if (G4D.hasActions(eid)) {
                    NetworkedGame4dObject.actions[eid] = G4D.fetchActions(eid)!;
                    Game4dObject.actid[eid] = G4D.getActid(eid)!;
                    NetworkedGame4dObject.actid[eid] = Game4dObject.actid[eid];
                }

            }
        }
    });
}