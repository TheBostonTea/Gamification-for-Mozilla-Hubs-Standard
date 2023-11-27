import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject, Game4dOnMoveAt, NetworkedGame4dObject } from "../bit-components";
import { HubsWorld } from "../app";
// import { game4dRegisterObject, game4dDeregisterObject, game4dRegisterVariables, game4dGetIDFromEID, game4dRegisterOnClick, game4dOnClick } from "../utils/game4d-api_bak";
// import { GAME4DONCLICK_FLAGS } from "../inflators/game4d-onclick";
import { takeOwnership } from "../utils/take-ownership";
import { PlayerInfo } from "../game4d";
import { Vector3 } from "three";
import { GAME4DOBJECT_FLAGS } from "../inflators/game4d-object";
// import { distanceToPlayer } from "../utils/game4d-utils";

function distanceToPlayer(world: HubsWorld, eid: number): number {
    let localPlayer: PlayerInfo | undefined = undefined;
    const worldPos = new Vector3();

    const obj = world.eid2obj.get(eid);

    if (obj === undefined) {
        console.error(`No object can be found for object with eid ${eid}`);
    }

    obj?.getWorldPosition(worldPos)

    const playerInfos = window.APP.componentRegistry["player-info"];
    if (playerInfos) {
        for (let i = 0; i < playerInfos.length; i++) {
            const playerInfo = playerInfos[i];
            if ((playerInfo as PlayerInfo).isLocalPlayerInfo) {
                localPlayer = (playerInfo as PlayerInfo);
                break;
            }
        }
    }

    if (localPlayer === undefined) {
        console.error("No local player found!")
        return Infinity;
    } else {
        // console.debug(`Local player found: Id ${NAF.clientId}`);
        let dist = localPlayer.el.object3D.position.distanceTo(worldPos);
        console.debug(dist);
        return dist;
    }



}

const game4dOnMoveAtQuery = defineQuery([Game4dOnMoveAt]);
// const game4dOnClickEnterQuery = enterQuery(game4dOnClickQuery);
// const game4dOnClickExitQuery = exitQuery(game4dOnClickQuery);


// function clicked(eid: number) {
//     return hasComponent(APP.world, Interacted, eid);
// }

export function game4dOnMoveAtSystem(world: HubsWorld, t: number) {

    // game4dOnClickEnterQuery(world).forEach(function (eid) {
    //     // G4D.dbg_listVars(G)
    //     // console.log("Register On-Click");
    //     // let id = game4dGetIDFromEID(eid);

    //     // if (typeof id != "undefined") {
    //     //     let actions = "";
    //     //     let actionstr = APP.getString(Game4dOnClick.actions[eid]);
    //     //     if(actionstr != null && typeof actionstr != "undefined") {
    //     //         actions = actionstr;
    //     //     }
    //     //     game4dRegisterOnClick(id, eid, isActive(eid), actions);
    //     // } else {
    //     //     console.error("ERROR: No Game4d Object found for Eid %d", eid);
    //     // }
    // });

    // game4dOnClickExitQuery(world).forEach( function (eid) {


    // });

    game4dOnMoveAtQuery(world).forEach(function (eid) {

        if (t > Game4dOnMoveAt.lastInteraction[eid] + Game4dOnMoveAt.timeout[eid] * 1000 && Game4dObject.flags[eid] & GAME4DOBJECT_FLAGS.ACTIVE) {
            console.log(t, Game4dOnMoveAt.lastInteraction[eid]);
            if (distanceToPlayer(world, eid) < Game4dOnMoveAt.range[eid]) {
                console.log("In range!");
                Game4dOnMoveAt.lastInteraction[eid] = t;


                // // If the script object was clicked, Do this!
                // if (clicked(eid)) {
                // console.log("Clicked!")

                G4D.callBehavior(APP.getString(Game4dOnMoveAt.behaviorRef[eid])!, eid, [], APP.getString(Game4dOnMoveAt.args[eid])!, APP.getString(Game4dOnMoveAt.rets[eid])!);
                console.log(Game4dOnMoveAt.behaviorRef[eid]);

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
        }
    });
}