import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Game4dOnClick, RemoteHoverTarget, SingleActionButton} from "../bit-components";

// Bitflag for is active yes/no. 
export const GAME4DOBJECT_FLAGS = {
    ACTIVE: 1 << 0,
    HASVARIABLE: 1 << 1
}

const Game4dActions = new Map ([
    ['console', 1],
    ['ui', 0] //Not yet active!
]);

const Game4dTypes = new Map ([
    ['string', 1],
    ['uint', 2],
    ['sint', 3],
    ['float', 4]
]);

export type Game4dOnClickParams = {
    isActive: boolean,
    actionType: string,
    hasVariable: boolean,
    variableName: string,
    variableType: string,
    variableContent: string
}

export function inflateGame4dOnClick( world: HubsWorld, eid: number, params: Game4dOnClickParams) {
    console.log("Inflate Game4dOnClick %d", eid);
    addComponent(world, Game4dOnClick, eid);
    params.isActive && (Game4dOnClick.flags[eid] |= GAME4DOBJECT_FLAGS.ACTIVE);
    params.hasVariable && (Game4dOnClick.flags[eid] |= GAME4DOBJECT_FLAGS.HASVARIABLE);
    Game4dOnClick.actionType[eid] = Game4dActions.get(params.actionType) || 0;
    Game4dOnClick.variableName[eid] = APP.getSid(params.variableName);
    Game4dOnClick.variableType[eid] = Game4dTypes.get(params.variableType) || 0;
    Game4dOnClick.variableContent[eid] = APP.getSid(params.variableContent);

    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, SingleActionButton, eid);
}