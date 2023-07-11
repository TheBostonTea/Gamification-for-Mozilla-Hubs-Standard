import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Door, Interacted } from "../bit-components";
import { HubsWorld } from "../app";

// Function to check if the door has an "Interacted" component. Why not just put this in the code itself? I dunno.
// It is more readable and documentable.
// Works because the 
function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

//We need a set of queries to handle the door. These will 
const doorQuery = defineQuery([Door]);
const doorEnterQuery = enterQuery(doorQuery);
const doorExitQuery = exitQuery(doorQuery);

export function doorSystem(world: HubsWorld) {
    doorEnterQuery(world).forEach(function (eid) {
        console.log("Eyy! a new door! %d", eid);
    });

    doorExitQuery(world).forEach( function (eid) {
        console.log("Aww, door was removed :( %d", eid);
    });

    doorQuery(world).forEach(function (eid) {
        // If the door was clicked, Do this!
        if (clicked(eid)){
            console.log("The door %d was clicked!", eid);

            Door.isOpen[eid] = Door.isOpen[eid] ? 0 : 1;
            if (Door.isOpen[eid] == 1) {
                console.log("Door is opening");
            } else {
                console.log("Door is closed");
            }
        }
    });
}
