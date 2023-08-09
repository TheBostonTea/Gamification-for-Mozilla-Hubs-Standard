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

//TODO: replace with strings!
const TypesMap  = new Map <number, Function> ([
    [0, Game4dUNKNOWNVAR],
    [1, BigInt],
    [2, Number],
    [3, String],
    [4, Boolean]
]);

//TODO: Replace with strings!
const FunctionsMap = new Map <number, Function> ([
    [0, game4dUNKNOWNACTION],
    [1, game4dConsolelog]//,
    //[2, game4dCall]
]);

const ObjectIdMap = new Map <string, Game4dObjectEntry> ([]);
const ObjectEidMap = new Map <number, Game4dObjectEntry> ([]);

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
    arguments: Map<string, Game4dVariable>
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
    children: Array<ActionNode>
    //Maybe it's own variable map?
}

type Game4dObjectEntry = {
    name: string,
    eid: number,
    game4dObject: Game4dObject
}


export function game4dRegisterObject(src: string, eid: number) : number {
    if (GAME4DDEBUG) {
        console.log("Registering object %s, eid %d", src, eid);
    }

    if (ObjectIdMap.has(src) || ObjectEidMap.has(eid)) {
        console.error("4dgame object \"%s\" is registered again when it already exists! "
        + "All behaviours of the duplicate object will be bound to the object with the original id!", src);
        return 1;
    }

    const game4dObject = new Game4dObject();

    ObjectIdMap.set(src, {name: src, eid: eid, game4dObject: game4dObject} as Game4dObjectEntry);
    ObjectEidMap.set(eid, {name: src, eid: eid, game4dObject: game4dObject} as Game4dObjectEntry);

    return 0;
}

export function game4dRegisterVar(src: string, name: string, type: number, content: string): number {
    const entry = ObjectIdMap.get(src);
    if (typeof entry == "undefined"){
        console.error("4dgame object \"%s\" is having a variable registered without being registered itself!");
        return 1;
    }

    entry!.game4dObject.addVariable(name, type, content);
    return 0;
}

export function game4dRegisterInteraction(src: string, name: string, type: number, content: string): number {
    // const entry = ObjectIdMap.get(src);
    // if (typeof entry == "undefined"){
    //     console.error("4dgame object \"%s\" is having a variable registered without being registered itself!");
    //     return 1;
    // }

    // entry!.game4dObject.addVariable(name, type, content);
    // return 0;
    return 0;
}

// Actions through the api are defined here:
function game4dUNKNOWNACTION(src: string, ...args: Array<string | number | boolean>) {
    console.warn("game4d object \"%s\" has called an unknown action, with the following arguments:");
    args.forEach(arg => {
        console.warn(arg);   
    });
}

// This function ought to be deprecated, or at least guarded!
function game4dConsolelog(src: string, strf: string, ...args : Array<string | number | boolean> ) {
    console.log(strf, args);
}

function game4dCall(src: string, target: string, signal: string, ...args: Array<string | number | boolean>) {
    Pass
}

function HandleInteraction(node: InteractionNode | undefined, ObjectVars: Map<string, Game4dVariable>, ...args: Array<Game4dVariable>) {
    Pass
}



interface Game4dInterface {
    onClick : () => void,

}

class Game4dObject implements Game4dInterface { 

    vars: Map<string, Game4dVariable>;
    onClickNode : InteractionNode;

    addVariable (name: string, type: number, content: string) : void {
        this.vars.set(name, (TypesMap.get(type)!)(content));
    }

    // Generic JSON unpacking here...
    // setOnClick(content: string){

    // }


    setOnClick(action: number, ...args: Array<string>) {

    }


    onClick () : void {
        HandleInteraction(this.onClickNode, this.vars);
    }
}
// const Function game4dActions = game4dConsolelog | game4dCall | game4dUNKNOWNACTION;



