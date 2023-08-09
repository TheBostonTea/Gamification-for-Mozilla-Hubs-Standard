import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Game4dObject } from "../bit-components";
import { HubsWorld } from "../app";
import { game4dRegisterObject , game4dDeregisterObject, game4dRegisterVariables} from "../utils/game4d-api";

const game4dObjectQuery = defineQuery([Game4dObject]);
//Do I always need these?
const game4dObjectEnterQuery = enterQuery(game4dObjectQuery);
const game4dObjectExitQuery = exitQuery(game4dObjectQuery);

export function game4dObjectSystem(world: HubsWorld) {

    game4dObjectEnterQuery(world).forEach(function (eid) {
        let name = APP.getString(Game4dObject.identifier[eid])

        if (name != null && name != undefined) {
            game4dRegisterObject(name, eid)
        } else {
            console.error("Game4d Object %d has no string attached to its identifier!");
        }

        let variables = APP.getString(Game4dObject.variables[eid])

        if (variables != null && name != undefined) {
            game4dRegisterVariables(name, variables);
        } else {
            console.warn("Object %s has no variables! Might be expected behavior, but this is worth checking!", name);
        }

    });

    game4dObjectExitQuery(world).forEach( function (eid) {
        console.log("Deregistering Game4d Object %d with name %s", eid, APP.getString(Game4dObject.identifier[eid]));
        let name: string = APP.getString(Game4dObject.identifier[eid])!

        if (name != null && name != undefined) {
            game4dDeregisterObject(name, eid)
        } else {
            console.error("Game4d Object %d has no string attached to its identifier!");
        }

    });

    // scriptQuery(world).forEach(function (eid) {
        
    //     // If the script object was clicked, Do this!
    //     if (clicked(eid)){
    //         console.log("The question %d was clicked!", eid);
    //         console.log("%s Script!", APP.getString(Script.script[eid]));
    //         eval(<string>APP.getString(Script.script[eid]));
    //     }
    // });
}