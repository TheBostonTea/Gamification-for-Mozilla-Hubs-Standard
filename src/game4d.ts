import { ElOrEid } from "./utils/bit-utils";
import { G4Droutine, G4Dvartype, G4DUNKNOWNVAR } from "./utils/game4d-utils";

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
    args: string;
    children: Array<RoutineFormat> | undefined;
};

function get_val(type: string, content:string) : G4Dvartype {
    switch (type) {
        case 'int':
            return Number(content);

        case 'float':
// type G4Dstring = {
//     name: string;
//     val: string;
// }

// type G4Dnum = {
//     name: string;
// }
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

    varMap : Map<number, Map<string, G4Dvartype>>;
    routineMap : Map<number, G4Droutine | null>;
    objectMap = new Map<string, ElOrEid>();

    global : Map<string, G4Dvartype>;

    varid : number;
    routineid: number;

    constructor(/*Might want to put a global script here later */) {
        // Reserve 0 for global routines; Any global scope variables/routines are called first before searching...
        this.varMap = new Map([[0, new Map<string, G4Dvartype>]]);
        this.routineMap = new Map([[0, new G4Droutine]]);
        this.global = this.varMap.get(0)!;

        this.varid = 1;
        this.routineid = 1;

        console.log("Game4D System up and running...");
    }

    registerVars(jsonstr: string) : number {
        const jsonobj: Array<VariableFormat> = JSON.parse(jsonstr);
        let vars = new Map<string, G4Dvartype>();

        jsonobj.forEach(v => {
            vars.set(v["name"], get_val(v["type"], v["content"]));
        });

        let varid = this.varid++;
        this.varMap.set(varid, vars);

        return varid;
    }

    registerRoutine(jsonstr: string): number {
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
        let routine = this.routineMap.get(gid);
        if(routine) {
            routine.call(oid);
        } else {
            console.error("Routine with " + gid + " not found!");
        }
        // return undefined;
    }

    getVar(vid: number, name: string) : G4Dvartype {
        let m : Map<string, G4Dvartype> | undefined = this.varMap.get(vid);
        
        // if(m){
        //     co
        // }
        console.log(this.global.get(name));
        if(m && m.get(name)) {
            return m.get(name)!;
        } else if(this.global.get(name)) {
            return this.global.get(name)!;
        }
        console.error("Error, no variable found for vid: " + vid + ", name: " + name);
        return {debug_info: `GETVAR NULLRET; GID:${vid} NAME:${name}`} as G4DUNKNOWNVAR;
    }

    dbg_listVars(gid: number) : void {
        let vars : Map<string, G4Dvartype> | undefined = this.varMap.get(gid);
        if (vars != undefined) {
            vars.forEach((value: G4Dvartype, key: string) => {
                console.log("key: \"" + key + "\"\n val: " + value);                
            });
        } else {
            console.log("No vars here!");
        }
    }



}