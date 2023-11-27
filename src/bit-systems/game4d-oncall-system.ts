import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject, Game4dOnCall, NetworkedGame4dObject } from "../bit-components";
import { HubsWorld } from "../app";
// import { game4dRegisterObject, game4dDeregisterObject, game4dRegisterVariables, game4dGetIDFromEID, game4dRegisterOnClick, game4dOnClick } from "../utils/game4d-api_bak";
// import { GAME4DONCLICK_FLAGS } from "../inflators/game4d-onclick";
import { takeOwnership } from "../utils/take-ownership";
import { PlayerInfo } from "../game4d";
import { Vector3 } from "three";
import { G4DType } from "../utils/game4d-utils";
import { ON_CALL_FLAGS } from "../inflators/game4d-oncall";
// import { distanceToPlayer } from "../utils/game4d-utils";


const game4dOnCallQuery = defineQuery([Game4dOnCall]);
// const game4dOnClickEnterQuery = enterQuery(game4dOnClickQuery);
// const game4dOnClickExitQuery = exitQuery(game4dOnClickQuery);


// function clicked(eid: number) {
//     return hasComponent(APP.world, Interacted, eid);
// }

export function game4dOnCallSystem(world: HubsWorld) {


    game4dOnCallQuery(world).forEach(function (eid) {

        if (G4D.hasCalls(APP.getString(Game4dObject.identifier[eid])!)) {

            const msgs: Array<string> | undefined = G4D.getCall(APP.getString(Game4dObject.identifier[eid])!, (Game4dOnCall.flags[eid] & ON_CALL_FLAGS.limitSources) !== 0, APP.getString(Game4dOnCall.allowedSources[eid])!);

            if (msgs !== undefined) {

                console.log(`${eid} has been called, with messages: `, ...msgs);

                G4D.callBehavior(APP.getString(Game4dOnCall.behaviorRef[eid])!, eid, msgs, APP.getString(Game4dOnCall.args[eid])!, APP.getString(Game4dOnCall.rets[eid])!);
                // console.log(Game4dOnCall.behaviorRef[eid]);

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
                //     }
            } else {
                console.log("no calls!");
            }
        }
    });
}