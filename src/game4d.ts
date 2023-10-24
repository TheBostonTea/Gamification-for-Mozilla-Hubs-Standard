import { ElOrEid } from "./utils/bit-utils";
import { G4Droutine, G4DVarType, G4DUNKNOWNVAR } from "./utils/game4d-utils";

declare global {
  interface Window {
    G4D: Game4DSystem;
  }

  const G4D: Game4DSystem;
}

export const Game4dTypesMap = new Map ([
    ['int', 1],
    ['float', 2],
    ['string', 3],
    ['boolean', 4]
]);

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

function get_val(type: string, content:string) : G4DVarType {
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

export class Game4DSystem {

    varMap : Map<number, Map<string, G4DVarType>>;
    routineMap : Map<number, G4Droutine | null>;
    objectMap = new Map<string, ElOrEid>();

    global : Map<string, G4DVarType>;

    varid : number;
    routineid: number;

    constructor(/*Might want to put a global script here later */) {
        // Reserve 0 for global routines; Any global scope variables/routines are called first before searching...
        this.varMap = new Map([[0, new Map<string, G4DVarType>]]);
        this.routineMap = new Map([[0, new G4Droutine]]);
        this.global = this.varMap.get(0)!;

        this.varid = 1;
        this.routineid = 1;

        console.log("Game4D System up and running...");
    }

    registerVars(eid: number, jsonstr: string) : number {
        console.log("Parsing: " + jsonstr);
        const jsonobj: Array<VariableFormat> = JSON.parse(jsonstr);
        let vars = new Map<string, G4DVarType>();

        jsonobj.forEach(v => {
            vars.set(v["name"], get_val(v["type"], v["content"]));
        });

        this.varMap.set(eid, vars);

        return eid;
    }

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

    getVar(eid: number, name: string) : G4DVarType {
        let m : Map<string, G4DVarType> | undefined = this.varMap.get(eid);
        
        // if(m){
        //     co
        // }
        console.log(this.global.get(name));
        if(m && m.get(name)) {
            return m.get(name)!;
        } else if(this.global.get(name)) {
            return this.global.get(name)!;
        }
        console.error("Error, no variable found for vid: " + eid + ", name: " + name);
        return {debug_info: `GETVAR NULLRET; GID:${eid} NAME:${name}`} as G4DUNKNOWNVAR;
    }

    findReference(eid: number, name: string) : Map<string, G4DVarType> | undefined {
        let m : Map<string, G4DVarType> | undefined = this.varMap.get(eid);
        let o : Map<string, G4DVarType> = this.varMap.get(0)!;
        console.warn(name, eid, m!.get(name));

        if(m && m.get(name) !== undefined){
            return m;
        } else if (o.get(name)!== undefined){
            return o;
        } else {
            console.warn(`Entity with id ${eid} has no variable map, while variable ${name} is called with this reference`);
            console.log(m);
        }

        return undefined;
    }

    dbg_listVars(gid: number) : void {
        let vars : Map<string, G4DVarType> | undefined = this.varMap.get(gid);
        if (vars != undefined) {
            vars.forEach((value: G4DVarType, key: string) => {
                console.log("key: \"" + key + "\"\n val: " + value);                
            });
        } else {
            console.log("No vars here!");
        }
    }



}