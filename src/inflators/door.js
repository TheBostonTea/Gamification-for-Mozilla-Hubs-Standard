import { addComponent } from "bitecs";
import { myDoor } from "../bit-components";


export function inflateDoor(world, eid, {isOpen}){
    addComponent(world, myDoor, eid);
    Door.isOpen[eid] = isOpen;


}