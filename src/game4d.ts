import { ElOrEid } from "./utils/bit-utils";
import { G4Droutine, G4DType, G4DUNKNOWNVAR, G4DBehavior, G4DVar, G4DMemory, isVarRef, G4DGetType, G4DNOREF, G4DVarRef } from "./utils/game4d-utils";

declare global {
  interface Window {
    G4D: Game4DSystem;
  }

  const G4D: Game4DSystem;
}

export interface VariableFormat {
    name: string;
    type: string;
    content: string;
};

export interface RoutineFormat {
    function: string;
    args: Array<string>;
    children: Array<RoutineFormat> | undefined;
};

function get_val(type: string, content:string) : G4DType {
    switch (type) {
        case 'int':
            return Number(content);

        case 'float':
            return Number(content);

        case 'string':
            return content;

        case 'boolean':
            return Boolean(content);
        default:
            return {debug_info: `UNKNOWNTYPE; TYPE:${type}, CONTENT:${content}`} as G4DUNKNOWNVAR; 

    }
}

export class G4DSyncMemory extends G4DMemory {
    updateId : number = 0;
    locked: boolean = false;
    updateQueue: Array<string> = [];
    synchronizeQueue : Array<string> = [];
    toUpdate: boolean = false;
    //TODO: construct!

    constructor(eid: number) {
        super(eid);
    }

    updateVal(key: string, value: G4DType) : void {
        // Currently, memory is never locked.
        if(!this.locked) {
            super.updateVal(key, value);
        } else {
            console.warn(`Variable ${key} cannot be updated! Memory is locked!...`);
            this.updateQueue.push(`{${key} , ${value}}`);
        }
    }

    pushUpdates() : number {
        this.updateId++;
        return this.updateId;
    }
}

export class Game4DSystem {

    // TODO: Preallocate varmap to increase efficiency!
    varMap : Map<number, G4DSyncMemory>;
    routineMap : Map<number, G4Droutine | null>;
    // Need this for calling objects with name.
    objectMap = new Map<string, ElOrEid>();
    
    behaviorQueue : Array<string> = [];
    variableQueue : Array<string> = [];

    global : G4DSyncMemory;

    varid : number;
    routineid: number;

    constructor(/*Might want to put a global script here later */) {
        // Reserve 0 for global routines; Any global scope variables/routines are called first before searching...
        this.varMap = new Map([[0, new G4DSyncMemory(0)]]);
        this.routineMap = new Map([[0, new G4Droutine]]);
        this.global = this.varMap.get(0)!;

        this.varid = 1;
        this.routineid = 1;

        console.log("Game4D System up and running...");
    }

    registerVars(eid: number, jsonstr: string) : number {
        console.log("Parsing: " + jsonstr);
        const jsonobj: Array<VariableFormat> = JSON.parse(jsonstr);
        let mem = new G4DSyncMemory(eid);

        jsonobj.forEach(v => {
            mem.initVal(v["name"], get_val(v["type"], v["content"]));
        });

        this.varMap.set(eid, mem);

        // Update id.
        return 0;
    }

    // UpdateVars(eid: number, map: Map<string, G4DVarType>) {
    //     //TODO; 
    // }

    registerRoutine(jsonstr: string): number {
        console.log("Parsing: " + jsonstr);
        const jsonobj: Array<RoutineFormat> = JSON.parse(jsonstr);
        let routine = new G4Droutine(/** Parse stuff here... */);

        jsonobj.forEach(n => {
            routine.AddNode(n["function"], n["args"], n["children"]);
        });

        let routineid = this.routineid++;
        this.routineMap.set(routineid, routine);
        return routineid;
    }

    callRoutine(gid: number, oid: number) {
        console.log(`Routine called: ${gid}, ${oid}`);
        let routine = this.routineMap.get(gid);
        if(routine) {
            routine.call(oid);
        } else {
            console.error("Routine with " + gid + " not found!");
        }
        // return undefined;
    }

    getVal(eid: number, name: string) : G4DType {
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);
        
        // if(m){
        //     co
        // }
        // console.log(this.global.getVal(name));
        if(m !== undefined) {

        } else if(this.global.getVal(name)) {
            return this.global.getVal(name)!;
        }
        console.error("Error, no variable found for vid: " + eid + ", name: " + name);
        return {debug_info: `GETVAR NULLRET; GID:${eid} NAME:${name}`} as G4DUNKNOWNVAR;
    }

    findRef(eid: number, name: string) : G4DVar {
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);
        // console.warn(name, eid, m!.get(name));

        if(m && m.getVal(name) !== undefined){
            return {name: name, location: m} as G4DVarRef;
        } else if (this.global.getVal(name)!== undefined){
            return {name: name, location: this.global} as G4DVarRef;
        } else {
            return {name: name, eid:eid} as G4DNOREF;
        }
    
    }

    dbg_listVars(eid: number) : void {
        let mem : G4DMemory | undefined = this.varMap.get(eid);
        if (mem !== undefined) {
            mem.debugList();
        } else {
            console.log("No vars here!");
        }
    }



}