import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Interacted, Script } from "../bit-components";
import { HubsWorld } from "../app";

function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

const scriptQuery = defineQuery([Script]);
//Do I always need these?
const scriptEnterQuery = enterQuery(scriptQuery);
const scriptExitQuery = exitQuery(scriptQuery);

export function scriptSystem(world: HubsWorld) {

    scriptEnterQuery(world).forEach(function (eid) {

    });

    scriptExitQuery(world).forEach( function (eid) {

    });

    scriptQuery(world).forEach(function (eid) {
        
        // If the script object was clicked, Do this!
        if (clicked(eid)){
            console.log("The question %d was clicked!", eid);
            console.log("%s Script!", APP.getString(Script.script[eid]));
            eval(<string>APP.getString(Script.script[eid]));
        }
    });
}