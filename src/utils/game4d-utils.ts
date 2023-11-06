import { string } from "prop-types";
import { RoutineFormat } from "../game4d";

export type G4DType = number | boolean | string | G4DUNKNOWNVAR;

export type G4DUNKNOWNVAR = {
    debug_info: string,
}

export type G4DFunct  = (eid: number, mem: G4DMemory, ...args : Array<G4DVar>) => void;

export type G4DNode = {
    action: G4DFunct,
    args: Array<string>,
    next: G4DNode | undefined;
};

export type G4DBehavior = {}; 

//TODO: Actual references to variables, setting of arguments...
//TODO: "Entrypoint" variables
export type G4DVar = G4DVarRef | G4DNOREF;

export type G4DVarRef = {
    name: string,
    location: G4DMemory
}

export type G4DNOREF = {
    name: string,
    eid: number;
}

export class G4DMemory {
    mem: Map<string, G4DType>;
    eid: number;

    constructor(eid: number) {
        this.mem = new Map<string, G4DType>();
        this.eid = eid;
    }

    getRef(key: string) : G4DVar {
        let val = this.mem.get(key);

        if(val !== undefined) {
            return {name: key, location: this} as G4DVarRef;
        } else {
            return {name: key, eid: this.eid} as G4DNOREF;
        }
    }

    getVal(key: string): G4DType | undefined {
        return this.mem.get(key);
    }

    initVal(key: string, value: G4DType) : void {
        if(this.mem.get(key) === undefined) {
            this.mem.set(key, value);
        } else {
            console.warn(`Warning: ${key} is already set in memory! Ignoring...`);
        }
    }

    updateVal(key: string, value: G4DType) : void {
        // Currently, memory is never locked.
        let orig = this.getVal(key);
        if(orig == undefined) {
            console.warn(`Variable ${key} not in memory ${this.eid}`);
        } else if(G4DGetType(value) !== G4DGetType(this.getVal(key))){
            console.warn(`Updated Variable '${key}' of incorrect type! Expected ${G4DGetType(this.getVal(key))}, got ${G4DGetType(value)}`);
        } else {
            this.mem.set(key, value);
        }
    }

    debugList() : void {
        this.mem.forEach((value: G4DType, key: string) => {
            console.log("key: \"" + key + "\"\n val: " + value);                
        });
    }

}

class G4DInnerMemory extends G4DMemory {
    index: number;

    constructor(eid: number) {
        super(eid);
        this.index = 0;
    }

    registerLiteral(literal: G4DType/*, type: string*/) : G4DVarRef{
        let name = String(this.index++);
        super.mem.set(name, literal);
        return {name:name, location: this} as G4DVarRef;
    }
}

export const isVarRef = (v: G4DVar) : v is G4DVarRef => (v as G4DVarRef).location !== undefined;

export const isUnknownvar = (t: G4DType): t is G4DUNKNOWNVAR => (t as G4DUNKNOWNVAR).debug_info !== undefined;

export function G4DGetType(t: G4DType | undefined) : string {
    if (t === undefined) {
        return "undefined";
    }else if(isUnknownvar(t)) {
        return "UNKOWNVAR";
    } else {
        return typeof t;
    }
}


function resolveArguments(eid: number, mem: G4DInnerMemory, args: Array<string>): Array<G4DVar> {
    let arr: Array<G4DVar> = [];

    args.forEach(arg => {
        // Parse reference!
        if (arg.charAt(0) === "@") {
            console.log("Found reference: " + arg);
            let name = arg.substring(1);

            let ref = mem.getRef(name);

            if(isVarRef(ref)) {
                arr.push(ref);
            } else {
                ref = G4D.findRef(eid, name);
                if(isVarRef(ref)) {
                    arr.push(ref);
                } else {
                    console.error(`Cannot find reference of argument ${arg} in context of entity ${eid}!`);
                    arr.push(ref);
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
    let typecheck = isVarRef(strf) &&  typeof strf.location.getVal(strf.name) === "string";
    let fargs : Array<G4DType> = [];
    args.forEach(arg => {
        typecheck = typecheck && isVarRef(arg);
        if(typecheck) {
            fargs.push((arg as G4DVarRef).location.getVal(arg.name)!);
        }
    });
    if(typecheck){
        console.log((strf as G4DVarRef).location.getVal(strf.name), args);
    }
}

function G4DIncrement(eid: number, mem: G4DMemory, a:G4DVar) {
    console.log("Increment!");
    if(isVarRef(a)/* && isVarRef(incr)*/) {
        let val = a.location.getVal(a.name);
        if (typeof val === "number"/* && typeof incr === "number"*/) {
            a.location.updateVal(a.name, val + 1);
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
        //this.tail = undefined;
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
        if (!this.head) {
            console.warn(`Empty routine from entity;${eid} called!`);
            return;
        } 

        let mem = new G4DInnerMemory(eid);


        while(curr){
            let args: Array<G4DVar> = resolveArguments(eid, mem, curr.args);
            curr.action(eid, mem, ...args);
            curr = curr.next;
        }



    }
}


