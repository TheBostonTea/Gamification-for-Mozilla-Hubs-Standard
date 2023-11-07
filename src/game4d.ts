import { ElOrEid } from "./utils/bit-utils";
import { fetchAction, isSideEffect } from "./utils/game4d-api";
import { G4Droutine, G4DType, G4DUNKNOWNVAR, G4DBehavior, G4DVar, G4DMemory, isVarRef, G4DGetType, G4DNOREF, G4DVarRef, G4DInnerMemory } from "./utils/game4d-utils";

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

export interface LiteralFormat {
    type: string;
    content: string;
}

export interface ActionFormat {
    function: string;
    literals: Array<LiteralFormat>;
}

export interface RoutineFormat {
    function: string;
    args: Array<string>;
    children: Array<RoutineFormat> | undefined;
};

export function G4DGetValFromType(content: string, type:string) : G4DType {
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

function dereference_args(args: Array<G4DVar>) : Array<LiteralFormat>{
    let literals: Array<LiteralFormat> = [];
    args.forEach(arg => {
        if(isVarRef(arg)) {
            let val = arg.location.getVal(arg.name);
            let t = G4DGetType(val);
            // console.log((`${arg.name}, ${t}, ${val}`))
            literals.push({type: t, content: String(val)} as LiteralFormat);
        } else {
            literals.push({type: "UNKOWNVAR", content:String(arg.eid) } as LiteralFormat);
        }
    });

    return literals;
}

export class G4DSyncMemory extends G4DMemory {
    varid : number = 0;
    actid : number = 0;
    locked: boolean = false;
    updateQueue: Array<VariableFormat> = [];
    actionQueue : Array<ActionFormat> = [];

    toUpdateVars: boolean = false;
    toQueueActions: boolean = false;
    //TODO: construct!

    constructor(eid: number) {
        super(eid);
    }

    updateVal(key: string, value: G4DType) : void {
        // Currently, memory is never locked.
        if(!this.locked) {
            super.updateVal(key, value);
            this.toUpdateVars = true;
            this.updateQueue.push({name : key, type : G4DGetType(value), content : value} as VariableFormat);
        } else {
            console.warn(`Variable ${key} cannot be updated! Memory is locked!...`);
        }
    }

    pushAction(funct: string, args: Array<G4DVar>) : void {
        if (isSideEffect(funct)) {
            this.actionQueue.push({function: funct, literals: dereference_args(args)} as ActionFormat);
            this.toQueueActions = true;
        } else {
            console.warn(`Non-side effect function ${funct} with arguments ${args} was pushed onto the behavior queue!`);
        }
    }

    fetchUpdates() : string {
        if(this.toUpdateVars && this.updateQueue.length > 0) {
            this.varid++;
            let updatestr = JSON.stringify(this.updateQueue);
            this.updateQueue = [];
            return updatestr
        } else {
            return "";
        }
    }

    fetchActions() : string {
        if(this.toQueueActions && this.actionQueue.length > 0) {
            this.actid++;
            let actionstr = JSON.stringify(this.actionQueue);
            this.actionQueue = [];
            return actionstr
        } else {
            return "";
        }
    }

    hasUpdates() : boolean {
        return this.toUpdateVars;
    }

    hasActions() : boolean {
        return this.toQueueActions;
    }

    getVarid() {
        return this.varid;
    }

    getActid() {
        return this.actid;
    }

    pushUpdates(updatestr: string, varid: number) : void {
        // console.log("Push me, and then just touch me, till blablabla " + updatestr);
        this.varid = varid;
        const update: Array<VariableFormat> = JSON.parse(updatestr);

        update.forEach(u => {
            // console.log(`${u['name']}, ${u['type']}, ${u['content']}`);
            this.mem.set(u["name"], G4DGetValFromType(u["content"], u["type"]));
        });
    }

    pushBehaviors(actionstr: string, actid: number) : void {
        // console.log(actionstr);

        this.actid = actid;
        const actions: Array<ActionFormat> = JSON.parse(actionstr);

        let mem: G4DInnerMemory = new G4DInnerMemory(super.eid);

        actions.forEach(a => {
            // console.log(`${a['function']}, ${a['literals']}`);
            let args: Array<G4DVar> = [];
            a['literals'].forEach(l =>  {
                if(l !== undefined) {
                    // console.log(l.content, l.type);
                    args.push(mem.registerLiteral(l.content, l.type));
                } else {
                    // console.log(l);
                }
            })

            let fun = fetchAction(a['function']);
            fun(super.eid, mem, ...args);
        });
    }

}

export class Game4DSystem {

    // TODO: Preallocate varmap to increase efficiency!
    varMap : Map<number, G4DSyncMemory>;
    routineMap : Map<number, G4Droutine | null>;
    // Need this for calling objects with name.
    objectMap = new Map<string, ElOrEid>();
    // updateQueue = new Array<string>();

    
    behaviorQueue : Array<string> = [];

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
        console.debug("Parsing: " + jsonstr);
        const jsonobj: Array<VariableFormat> = JSON.parse(jsonstr);
        let mem = new G4DSyncMemory(eid);

        jsonobj.forEach(v => {
            mem.initVal(v["name"], G4DGetValFromType(v["content"], v["type"]));
        });

        this.varMap.set(eid, mem);

        // Update id.
        return 0;
    }

    // UpdateVars(eid: number, map: Map<string, G4DVarType>) {
    //     //TODO; 
    // }

    registerRoutine(jsonstr: string): number {
        console.debug("Parsing: " + jsonstr);
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
        console.debug(`Routine called: ${gid}, ${oid}`);
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
        
        if(m !== undefined) {
            if(m.getVal(name) !== undefined) {
                return m.getVal(name)!;
            } 
        } else if(this.global.getVal(name) !== undefined) {
            return this.global.getVal(name)!;
        }
        console.error("Error, no variable found for vid: " + eid + ", name: " + name);
        return {debug_info: `GETVAR NULLRET; GID:${eid} NAME:${name}`} as G4DUNKNOWNVAR;
    }

    fetchUpdates(eid: number) : number | undefined{
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            let updates = m.fetchUpdates();
            if(updates !== undefined) {
                return APP.getSid(updates);
            } 
        }
        
        return APP.getSid("");
    }

    fetchActions(eid: number) : number | undefined{
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            let actions = m.fetchActions();
            if(actions !== undefined) {
                return APP.getSid(actions);
            } 
        }
        
        return APP.getSid("");
    }

    pushAction(eid: number, funct: string, ...args: Array<G4DVar>) : void{
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            m.pushAction(funct, args);
        }
    }


    hasUpdates(eid: number) : boolean {
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.hasUpdates();
        }
        
        return false;
    }

    hasActions(eid: number) : boolean {
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.hasActions();
        }
        
        return false;
    }

    getVarid(eid:number) : number | undefined{
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.getVarid();
        }
        
        return undefined;
    }

    getActid(eid:number) : number | undefined{
        let m : G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.getActid();
        }
        
        return undefined;
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

    synchronizeVars(eid: number, uid: number, varid: number) : void {
        let mem : G4DSyncMemory | undefined = this.varMap.get(eid);
        let update : string = APP.getString(uid)!;

        if(mem !== undefined) {
            mem.pushUpdates(update, varid);
        } else {
            console.warn(`Warning, no memory found for ${eid}!`);
        }
    }

    synchronizeActs(eid: number, aid: number, actid: number) : void {
        let mem : G4DSyncMemory | undefined = this.varMap.get(eid);
        let actions : string = APP.getString(aid)!;

        if(mem !== undefined) {
            mem.pushBehaviors(actions, actid);
        } else {
            console.warn(`Warning, no memory found for ${eid}!`);
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