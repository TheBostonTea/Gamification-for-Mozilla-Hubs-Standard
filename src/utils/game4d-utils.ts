import { string } from "prop-types";
import { RoutineFormat } from "../game4d";

export type G4Dvar = number | boolean | string | G4DUNKNOWNVAR;

export type G4DUNKNOWNVAR = {
    debug_info: string,
}

export type G4DNode = {
    action: Function,
    argument: G4DVarRef,
    next: G4DNode | undefined;
};

//TODO: Actual references to variables, setting of arguments...
//TODO: "Entrypoint" variables
export type G4DVarRef = {
    content: G4Dvar;
    type: string
}

function fetchArgument(arg: string): G4DVarRef {
    return {content: arg, type: "string"} as G4DVarRef
}




// Actions through the api are defined here:string
function G4DUNKNOWNACTION(...args: Array<string | number | boolean>) {
    console.warn("game4d object \"%s\" has called an unknown action, with the following arguments:");
    args.forEach(arg => {
        console.warn(arg);   
    });
}

function G4DConsolelog(strf: string, ...args : Array<string | number | boolean> ) {
    console.log(strf, args);
}

function fetchAction(funct: string): Function{
    switch (funct) {
        case "console":
            return G4DConsolelog;
            
    
        default:
            return G4DUNKNOWNACTION;
    }
}

export class G4Droutine {
    head: G4DNode | undefined;
    tail: G4DNode | undefined;

    constructor() {
        console.log("Routine has been created!");
        this.head = undefined;
        this.tail = undefined;
    }

    AddNode(funct: string, args: string, children: Array<RoutineFormat> | undefined) : void {
        
        let node = {action: fetchAction(funct), argument: fetchArgument(args), next: undefined} as G4DNode; 

        if(!this.head) {
            this.head = node;
            this.tail = node;
        } else {
            this.tail!.next = node;
            this.tail = node;
        }
    }

    call(/*supplied variables?*/) : void {

        let curr: G4DNode | undefined = this.head;

        while(curr){
            curr.action(curr.argument.content);
            curr = curr.next;
        }

        if (!this.head) {
            console.warn("Empty routine called!");
            return;
        } 

    }
}


