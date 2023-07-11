import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Door, Interacted } from "../bit-components";
import { HubsWorld } from "../app";
import { findAncestor } from "../utils/three-utils";

// Function to check if the door has an "Interacted" component. Why not just put this in the code itself? I dunno.
// It is more readable and documentable.
// Works because the 
function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

// Create a map for storing the animation state in.
const state = new Map();

// We need a set of queries to handle the door. These will check when objects are created, and will search for each object of a type. 
const doorQuery = defineQuery([Door]);
const doorEnterQuery = enterQuery(doorQuery);
const doorExitQuery = exitQuery(doorQuery);

export function doorSystem(world: HubsWorld) {
    doorEnterQuery(world).forEach(function (eid) {
        console.log("Eyy! a new door! %d", eid);
        // Get the object with the mixer, so that we can play animations!
        // TODO: (obj: any): is not very typescript! Seek out the correct type here!
        const { mixer, animations } = findAncestor(world.eid2obj.get(eid), (obj: any) => obj.mixer);
        // Which animation to fetch?
        // TODO: Write a nice wrapper to make explicit the type of the stuff returned above and below,
        //       to make debugging easier
        const action = mixer.clipAction(animations[0]);
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;

        // Store the mixer and animation (within action) in the state to store them for later!
        state.set(eid, {mixer, action});
    });

    doorExitQuery(world).forEach( function (eid) {
        console.log("Aww, door was removed :( %d", eid);

        // Fetch the mixer and animation to deconstruct!
        // TODO: Proper typing!
        const {mixer, action} = state.get(eid);
        // cleanup on exit!
        action.stop();
        mixer.uncacheAction(action);
        state.delete(eid);
    });

    doorQuery(world).forEach(function (eid) {
        // If the door was clicked, Do this!
        const {mixer, action} = state.get(eid);

        if (clicked(eid)){
            console.log("The door %d was clicked!", eid);

            Door.isOpen[eid] = Door.isOpen[eid] ? 0 : 1;
            if (Door.isOpen[eid] == 1) {
                console.log("Door is opening");
                action.setEffectiveTimeScale(1);
            } else {
                console.log("Door is closing");
                action.setEffectiveTimeScale(-1);
            }
            action.paused = false;
            action.play();
        }

        // TODO: Magic Number! Very unneat!
        mixer.update(world.time.delta / 1000);
    });
}
