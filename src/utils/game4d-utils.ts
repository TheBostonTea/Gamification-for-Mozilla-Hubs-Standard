import { string } from "prop-types";
import { RoutineFormat } from "../game4d";

export type G4DVarType = number | boolean | string | G4DUNKNOWNVAR;

export type G4DUNKNOWNVAR = {
    debug_info: string,
}

export type G4DFunct  = (eid: number, mem: G4DMemory, ...args : Array<G4DVar>) => void;

export type G4DNode = {
    action: G4DFunct,
    args: Array<string>,
    next: G4DNode | undefined;
};

//TODO: Actual references to variables, setting of arguments...
//TODO: "Entrypoint" variables
export type G4DVar = G4DVarRef | G4DNOREF;

export type G4DVarRef = {
    name: string,
    location: Map<string, G4DVarType>;
}

export type G4DNOREF = {
    name:string,
    eid: number;
}

class G4DMemory {
    index: number;
    memory: Map<string, G4DVarType>;

    constructor() {
        this.index = 0;
        this.memory = new Map<string, G4DVarType>();
    }

    get(key: string) : G4DVarType | undefined{
        return this.memory.get(key);
    }

    getMem() : Map<string, G4DVarType> {
        return this.memory;
    }

    registerLiteral(literal: G4DVarType/*, type: string*/) : G4DVarRef{
        let name = String(this.index++);
        this.memory.set(name, literal);
        return {name:name, location: this.memory} as G4DVarRef;
    }
}

export const isVarRef = (v: G4DVar) : v is G4DVarRef => (v as G4DVarRef).location !== undefined;


function resolveArguments(eid: number, mem: G4DMemory, args: Array<string>): Array<G4DVar> {
    let arr: Array<G4DVar> = [];

    args.forEach(arg => {
        if (arg.charAt(0) === "@") {
            console.log("Found reference: " + arg);
            let name = arg.substring(1);

            if(mem.get(arg) !== undefined) {
                arr.push({name:name, location:mem.getMem()} as G4DVarRef);
            } else {
                let location: Map<string, G4DVarType> | undefined = G4D.findReference(eid, name);
                if(location) {
                    arr.push({name:name, location:location} as G4DVarRef);
                } else {
                    console.error(`Cannot find reference of argument ${arg} in context of entity ${eid}!`);
                    arr.push({name:arg, eid:eid} as G4DNOREF);
                }
            }
        } else if(arg.charAt(0) === "_") {
            // Only support strings for now!
            arr.push(mem.registerLiteral(arg.substring(1)));
        } else {
            console.error("Malformed argument name or content: " + arg);
            arr.push({name:arg, eid:eid} as G4DNOREF);
        }
    });

    return arr;
}

// Actions through the api are defined here:string
function G4DUNKNOWNACTION(eid:number, mem: G4DMemory, ...args: Array<G4DVarRef>) {
    let stringf = `Entity ${eid} has called an unknown action, with the following arguments:`
    
    args.forEach(arg => {
        stringf += "\n\t" + arg + ",";  
    });
    console.warn(stringf);
}

function G4DConsolelog(eid: number, mem: G4DMemory, strf:G4DVar, ...args : Array<G4DVar> ) {
    let typecheck = isVarRef(strf) &&  typeof strf.location.get(strf.name) === "string";
    let fargs : Array<G4DVarType> = [];
    args.forEach(arg => {
        typecheck = typecheck && isVarRef(arg);
        if(typecheck) {
            fargs.push((arg as G4DVarRef).location.get(arg.name)!);
        }
    });
    if(typecheck){
        console.log((strf as G4DVarRef).location.get(strf.name), args);
    }
}

function G4DIncrement(eid: number, mem: G4DMemory, a:G4DVar) {
    console.log("Increment!");
    if(isVarRef(a)/* && isVarRef(incr)*/) {
        let val = a.location.get(a.name);
        if (typeof val === "number"/* && typeof incr === "number"*/) {
            a.location.set(a.name, val + 1);
            console.log(val + 1);
        } else {
            //TODO; neat error handling
            console.error("Variable of incorrect of unknown type in increment!");
        }
    }

}

function fetchAction(funct: string): G4DFunct{
    switch (funct) {
        case "console":
            return G4DConsolelog;

        case "increment":
            return G4DIncrement;
            
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

    AddNode(funct: string, args: Array<string>, children: Array<RoutineFormat> | undefined) : void {
        
        let node = {action: fetchAction(funct), args: args, next: undefined} as G4DNode; 

        if(!this.head) {
            this.head = node;
            this.tail = node;
        } else {
            this.tail!.next = node;
            this.tail = node;
        }
    }

    call(eid: number/*supplied variables?*/) : void {

        let curr: G4DNode | undefined = this.head;
        // Define local memory used for inner variables or literals;
        let mem = new G4DMemory();

        while(curr){
            let args: Array<G4DVar> = resolveArguments(eid, mem, curr.args);
            curr.action(eid, mem, ...args);
            curr = curr.next;
        }

        if (!this.head) {
            console.warn(`Empty routine from entity;${eid} called!`);
            return;
        } 

    }
}


