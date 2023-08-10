// Map all the possible actions within an action node as integers to be stored inside the component.

import { Pass } from "postprocessing";
import { TypeOperatorNode } from "typescript";


// // TODO: Do not store inside component; Map to data to a separate datastructure directly!
export const Game4dActionsMap = new Map ([
    ['console', 1],
    ['ui', 0] //Not yet active!
]);

// Map all possible datatype of variables as integers to be stored inside the component.
// TODO: Do not store inside component; Map data to a seperate datastructure directly!
export const Game4dTypesMap = new Map ([
    ['int', 1],
    ['float', 2],
    ['string', 3],
    ['boolean', 4]
]);

const GAME4DDEBUG = true;

const TypesMap  = new Map <string, Function> ([
    ["", Game4dUNKNOWNVAR],
    ["int", BigInt],
    ["float", Number],
    ["string", String],
    ["boolean", Boolean]
]);

const FunctionsMap = new Map <string, Function> ([
    ["", game4dUNKNOWNACTION],
    ["console", game4dConsolelog]//,
    //[2, game4dCall]
]);

const ObjectIdMap = new Map <string, Game4dObject> ([]);
const ObjectEidMap = new Map <number, Game4dObject> ([]);

// Wanna do this differently...?
type game4dUNKNOWNVAR = {
    content: string
}

// type varRef = {
//     name: string,
//     reference: Game4dVariable
// }

function Game4dUNKNOWNVAR(str: string) {
    return {content: str} as game4dUNKNOWNVAR;
}

type Game4dVariable = game4dUNKNOWNVAR | BigInt | number | string | boolean;

// type Game4

// TODO: Write as an Object!


type FunctionNode = {
    action: Function,
    argument: string
}

// type OperatorNode = {
//     op: TypeOperatorNode
// }

type IfNode = {
    children: Array<ActionNode>
    else: LogicNode
}

type ElseNode = {
    children: Array<ActionNode>
}

type LogicNode = IfNode | ElseNode;

type ActionNode = FunctionNode //| 

type InteractionNode = {
    isActive: boolean
    children: Array<ActionNode>
    //Maybe it's own variable map?
}


export function game4dRegisterObject(id: string, eid: number, isActive: boolean): void{
    if (GAME4DDEBUG) {
        console.log("Registering object %s, eid %d", id, eid);
    }

    if (ObjectIdMap.has(id) || ObjectEidMap.has(eid)) {
        console.warn("4dgame object \"%s\" is registered again when it already exists! "
        + "All behaviours of the duplicate object will be bound to the object with the original id!", id);
        return;
    }

    const game4dObject = new Game4dObject(id, eid, isActive);

    ObjectIdMap.set(id, game4dObject);
    ObjectEidMap.set(eid, game4dObject);
}

export function game4dDeregisterObject(id: string, eid: number): void{
    if (GAME4DDEBUG) {
        console.log("Deregistering object %s, eid %d", id, eid);
    }

    if (!ObjectIdMap.has(id)) {
        console.error("4dgame object \"%s\" is deregistered again when its identifier already does not exist! ", id);
    } else {
        ObjectIdMap.delete(id);
    }

    if (!ObjectEidMap.has(eid)) {
        console.error("4dgame object \"%d\" is deregistered again when its eid already does not exist! ", eid);
    } else {
        ObjectEidMap.delete(eid);
    }

}

// function RegisterVariable(obj: Game4dObject, name: string, type: number, content: string): void {
//     if (typeof obj == "undefined"){
//         console.error("4dgame object \"%s\" is having a variable registered without being registered itself!");
//         return;
//     }

//     obj.addVariable(name, type, content);
// }

export function game4dRegisterVariables(id: string, variables: string): void {
    const obj = ObjectIdMap.get(id);

    if (typeof obj == "undefined"){
        console.error("4dgame object \"%s\" is having a variable registered without being registered itself!");
        return;
    }

    // console.log(variables);
    const variableobj = JSON.parse(variables);

    for (var i in variableobj) {
        obj.addVariable(variableobj[i]["name"], variableobj[i]["type"], variableobj[i]["content"]);
    }

}

export function game4dRegisterOnClick(id: string, eid: number, isActive: boolean, actions: string): void {
    const obj = ObjectIdMap.get(id);

    if (typeof obj == "undefined"){
        console.error("4dgame object \"%s\" is having an On-Click interaction registered without being registered itself!");
        return;
    }

    // Check this to ensure that no things are called from malicious contexts, as the eid is arbitrary, but the id is not!
    if (obj.eid != eid) {
        return;
    }

    let actionlist: Array<ActionNode> = [];
    const actionobj = JSON.parse(actions);
    
    for (var i in actionobj) {
        console.log(actionobj[i]);
        console.log(actionobj[i]["function"]);
        console.log(actionobj[i]["args"]);
    
        let afun = FunctionsMap.get(actionobj[i]["function"]);
        if (typeof afun == "undefined") {
            console.warn("WARNING: unknown Function: %s", actionobj[i]["function"]);
            afun = game4dUNKNOWNACTION;
        }

        let anode: FunctionNode = {action: afun, argument: actionobj[i]["args"]} as FunctionNode;
        actionlist.push(anode);
    }

    const inode: InteractionNode = {isActive: isActive, children: actionlist} as InteractionNode;
    obj.setOnClick(inode)
}

export function game4dOnClick(id: string, eid: number) : void {
    const obj = ObjectIdMap.get(id);

    if (typeof obj == "undefined"){
        console.error("4dgame object \"%s\" is having an On-Click interaction registered without being registered itself!");
        return;
    }


    // Check this to ensure that no things are called from malicious contexts, as the eid is arbitrary, but the id is not!
    if (obj.eid != eid) {
        return;
    }

    // Maybe add the owner here? In case this is relevant...
    obj.onClick();
}

// export function game4dRegisterInteraction(src: string, name: string, type: number, content: string): number {
//     // const entry = ObjectIdMap.get(src);
//     // if (typeof entry == "undefined"){
//     //     console.error("4dgame object \"%s\" is having a variable registered without being registered itself!");
//     //     return 1;
//     // }

//     // entry!.game4dObject.addVariable(name, type, content);
//     // return 0;
//     return 0;
// }

export function game4dGetIDFromEID(eid: number) : string | undefined {
    if (!ObjectEidMap.has(eid)) {
        if (GAME4DDEBUG) { 
            console.warn("Id to Eid %d not found!", eid);
        }
        return undefined;
    }

    return ObjectEidMap.get(eid)!.getID();
}

// Actions through the api are defined here:
function game4dUNKNOWNACTION(...args: Array<string | number | boolean>) {
    console.warn("game4d object \"%s\" has called an unknown action, with the following arguments:");
    args.forEach(arg => {
        console.warn(arg);   
    });
}

// This function ought to be deprecated, or at least guarded!
function game4dConsolelog(strf: string, ...args : Array<string | number | boolean> ) {
    console.log(strf, args);
}

function game4dCall(src: string, target: string, signal: string, ...args: Array<string | number | boolean>) {
    Pass
}

function HandleInteraction(inode: InteractionNode | undefined, ObjectVars: Map<string, Game4dVariable>) {
    if (typeof inode == "undefined"){
        console.warn("Interaction called that did not exist!");
    } else if (!inode.isActive) {
        console.warn("Inactive interaction called!");
    } else {
        for (var action of inode.children) {
            console.log(typeof action.action);
            action.action(action.argument);
        }
    }
}



interface Game4dInterface {
    onClick : () => void,

}

class Game4dObject implements Game4dInterface { 
    id: string;
    eid: number;
    isActive: boolean;
    vars: Map<string, Game4dVariable>;
    onClickNode : InteractionNode;

    constructor(id: string, eid: number, isActive: boolean) {
        this.id = id;
        this.eid = eid;
        this.isActive = isActive;
        this.vars = new Map<string, Game4dVariable>;
    }

    addVariable (name: string, type: string, content: string) : void {
        if (this.vars.has(name)) {
            console.warn("Variable %s is registered to Game4d Object %s when it is already registered! Ignoring...", name, this.id);
            return;
        }
        this.vars.set(name, (TypesMap.get(type)!)(content));
        console.log(typeof this.vars.get(name), this.vars.get(name));
    }

    // Generic JSON unpacking here...
    // setOnClick(content: string){

    // }

    getID() : string {
        return this.id;
    }

    getEID() : number {
        return this.eid;
    }


    setOnClick(inode: InteractionNode) {
        this.onClickNode = inode;
    }


    onClick () : void {
        if(this.isActive){
            HandleInteraction(this.onClickNode, this.vars);
        }
    }
}
// const Function game4dActions = game4dConsolelog | game4dCall | game4dUNKNOWNACTION;



