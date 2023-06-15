import { addComponent } from "bitecs";
import { myDoor } from "../bit-components";


export function inflateDoor(world, eid, {isOpen}){
    console.log("Inflating myDoor; ", eid)
    addComponent(world, myDoor, eid);
    Door.isOpen[eid] = isOpen;


}