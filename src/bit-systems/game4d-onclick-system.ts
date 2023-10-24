import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject, Game4dOnClick, Interacted } from "../bit-components";
import { HubsWorld } from "../app";
import { game4dRegisterObject , game4dDeregisterObject, game4dRegisterVariables, game4dGetIDFromEID, game4dRegisterOnClick, game4dOnClick} from "../utils/game4d-api";
import { GAME4DONCLICK_FLAGS } from "../inflators/game4d-onclick";

const game4dOnClickQuery = defineQuery([Game4dOnClick]);
const game4dOnClickEnterQuery = enterQuery(game4dOnClickQuery);
const game4dOnClickExitQuery = exitQuery(game4dOnClickQuery);

function isActive(eid: number) : boolean {
    if (Game4dOnClick.flags[eid] & GAME4DONCLICK_FLAGS.ACTIVE) {
        return true;
    }
    return false;
}

function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

export function game4dOnClickystem(world: HubsWorld) {

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
        if (clicked(eid)){
            console.log("Clicked!")
            G4D.callRoutine(Game4dOnClick.actions[eid], Game4dObject.variables[eid]);
            console.log(Game4dOnClick.actions[eid]);
        }
    });
}