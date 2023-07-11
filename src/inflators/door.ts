import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Door} from "../bit-components";

// Bitflag for door open/closed. System does not support booleans on this
// level
export const DOOR_FLAGS = {
    OPEN: 1 << 0
}

// Set the parameters that we expect for the Doorinflator. In this case, we just want one boolean; isOpen
// a type is a set of properties, that may be fulfilled depending on the exact implementation
export type DoorParams = {
    isOpen?: boolean;
}

// Set default values for the parameters. 
// Required is a typescript utility type: https://www.typescriptlang.org/docs/handbook/utility-types.html
// that requires all the properties of the set type to be fulfilled.
const DEFAULTS: Required<DoorParams> = {
    isOpen: false
}

// The inflator itself, used to 
export function inflateDoor( world: HubsWorld, eid: number, params: DoorParams){

    params = Object.assign({}, params, DEFAULTS) as Required<DoorParams>;
    addComponent(world, Door, eid);
    // This is an ugly shortcut where the lhs is evaluated first, and only if true, the right side is executed. Probably
    // should be rewritten so something neater.
    params.isOpen && (Door.isOpen[eid] |= DOOR_FLAGS.OPEN);
    console.log("I HAS BEEN INFLATED! %d", eid)
}
