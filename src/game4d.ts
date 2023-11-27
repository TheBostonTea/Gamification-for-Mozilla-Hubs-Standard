import { AComponent, AElement } from "aframe";
import { ElOrEid } from "./utils/bit-utils";
import { fetchAction, isSideEffect } from "./utils/game4d-api";
import { G4DBehavior, G4DType, G4DUNKNOWNTYPE, G4DVar, G4DMemory, isVarRef, G4DGetType, G4DNOREF, G4DVarRef, G4DInnerMemory, G4DParam } from "./utils/game4d-utils";

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

export interface ArgumentFormat {
    name: string;
    type: string;
}

export interface LiteralFormat {
    content: string;
}

export interface SyncActionFormat {
    function: string;
    literals: Array<LiteralFormat>;
}

export interface BehaviorNodeFormat {
};

export interface NewVarNodeFormat extends BehaviorNodeFormat {
    name: string;
    value: string;
};

export interface ActionNodeFormat extends BehaviorNodeFormat {
    function: string;
    args: Array<string>;
}

export interface LoopingNodeFormat extends BehaviorNodeFormat {
    loopingConditional: ExpressionFormat | string;
    children: Array<BehaviorNodeFormat>;
}

export interface LogicBlockFormat extends BehaviorNodeFormat {
    ifElseNodes: Array<IfElseNodeFormat>;
}

export interface IfElseNodeFormat {
    conditional: ExpressionFormat | string;
    children: Array<BehaviorNodeFormat>;
}

export interface ExpressionFormat {
    leftexpr: string | ExpressionFormat;
    operator: string;
    rightexpr: string | ExpressionFormat;
}

export const isNewVarNodeFormat = (f: BehaviorNodeFormat): f is NewVarNodeFormat => (f as NewVarNodeFormat).name !== undefined;

export const isActionNodeFormat = (f: BehaviorNodeFormat): f is ActionNodeFormat => (f as ActionNodeFormat).function !== undefined;

export const isLoopingNodeFormat = (f: BehaviorNodeFormat): f is LoopingNodeFormat => (f as LoopingNodeFormat).loopingConditional !== undefined;

export const isLogicBlockFormat = (f: BehaviorNodeFormat): f is LogicBlockFormat => (f as LogicBlockFormat).ifElseNodes !== undefined;

export const isExpressionFormat = (f: string | ExpressionFormat): f is ExpressionFormat => (f as ExpressionFormat).operator !== undefined;

export function G4DGetValFromType(content: string, type: string): G4DType {
    switch (type) {
    case 'int':
        return Number(content);

    case 'float':
        return Number(content);

    case 'number':
        return Number(content);

    case 'string':
        return content;

    case 'boolean':
        return Boolean(content);
    default:
        return { debug_info: `UNKNOWNTYPE; TYPE:${type}, CONTENT:${content}` } as G4DUNKNOWNTYPE;

    }
}

function dereference_args(args: Array<G4DVar>): Array<LiteralFormat> {
    let literals: Array<LiteralFormat> = [];
    args.forEach(arg => {
        if (isVarRef(arg)) {
            let val = arg.location.getVal(arg.name);
            let t = G4DGetType(val);
            // console.log((`${arg.name}, ${t}, ${val}`))
            literals.push({ content: `${t}:${val}` } as LiteralFormat);
        } else {
            literals.push({ content: `UNKOWNVAR:${arg.eid}` } as LiteralFormat);
        }
    });

    return literals;
}

function parseParams(argstr: string): Array<G4DParam> {
    let args: Array<G4DParam> = [];

    if (argstr !== "") {
        let argstrs = argstr.split(",");

        argstrs.forEach(a => {
            let aa = a.split(":");
            if (aa.length == 2) {
                args.push({ name: aa[0], type: aa[1] } as G4DParam);
            } else {
                console.error(`Argument ${a} malformed: Expected format "name : type"!`)
            }
        });
    }
    return args;
}

function parseReturnTypes(returnstr: string) {
    return returnstr.split(",");
}

export class G4DSyncMemory extends G4DMemory {
    varid: number = 0;
    actid: number = 0;
    locked: boolean = false;
    updateQueue: Array<VariableFormat> = [];
    actionQueue: Array<SyncActionFormat> = [];

    toUpdateVars: boolean = false;
    toQueueActions: boolean = false;
    //TODO: construct!

    constructor(eid: number) {
        super(eid);
    }

    updateVal(key: string, value: G4DType): void {
        // Currently, memory is never locked.
        if (!this.locked) {
            super.updateVal(key, value);
            this.toUpdateVars = true;
            this.updateQueue.push({ name: key, type: G4DGetType(value), content: value } as VariableFormat);
        } else {
            console.warn(`Variable ${key} cannot be updated! Memory is locked!...`);
        }
    }

    pushAction(funct: string, args: Array<G4DVar>): void {
        if (isSideEffect(funct)) {
            this.actionQueue.push({ function: funct, literals: dereference_args(args) } as SyncActionFormat);
            this.toQueueActions = true;
        } else {
            console.warn(`Non-side effect function ${funct} with arguments ${args} was pushed onto the behavior queue!`);
        }
    }

    fetchUpdates(): string {
        if (this.toUpdateVars && this.updateQueue.length > 0) {
            this.varid++;
            let updatestr = JSON.stringify(this.updateQueue);
            this.updateQueue = [];
            return updatestr
        } else {
            return "";
        }
    }

    fetchActions(): string {
        if (this.toQueueActions && this.actionQueue.length > 0) {
            this.actid++;
            let actionstr = JSON.stringify(this.actionQueue);
            this.actionQueue = [];
            return actionstr
        } else {
            return "";
        }
    }

    hasUpdates(): boolean {
        return this.toUpdateVars;
    }

    hasActions(): boolean {
        return this.toQueueActions;
    }

    getVarid() {
        return this.varid;
    }

    getActid() {
        return this.actid;
    }

    pushUpdates(updatestr: string, varid: number): void {
        // console.log("Push me, and then just touch me, till blablabla " + updatestr);
        this.varid = varid;
        const update: Array<VariableFormat> = JSON.parse(updatestr);

        update.forEach(u => {
            // console.log(`${u['name']}, ${u['type']}, ${u['content']}`);
            this.mem.set(u["name"], G4DGetValFromType(u["content"], u["type"]));
        });
    }

    pushBehaviors(actionstr: string, actid: number): void {
        // console.log(actionstr);

        this.actid = actid;
        const actions: Array<SyncActionFormat> = JSON.parse(actionstr);

        let mem: G4DInnerMemory = new G4DInnerMemory(super.eid);

        actions.forEach(a => {
            // console.log(`${a['function']}, ${a['literals']}`);
            let args: Array<G4DVar> = [];
            a['literals'].forEach(l => {
                if (l !== undefined) {
                    // console.log(l.content, l.type);
                    args.push(mem.registerLiteral(l.content));
                } else {
                    // console.log(l);
                }
            })

            let fun = fetchAction(a['function']);
            fun(super.eid, mem, ...args);
        });
    }

}

// Use the PlayerInfo interface to allow the not yet registered ACompinent from player-info.js to be recognized as a interface in typescript.
export interface PlayerInfo extends AComponent {
    isLocalPlayerInfo: boolean | undefined;
    el: AElement;
}

type callEntry = {
    source: string,
    args: Array<string>,
}

export class Game4DSystem {

    // TODO: Preallocate varmap to increase efficiency!
    varMap: Map<number, G4DSyncMemory>;
    behaviorMap: Map<number, G4DBehavior | null>;
    behaviorStr2Num: Map<string, number>;
    behaviorNum2Str: Map<number, string>;
    // Need this for calling objects with name.
    objectMap = new Map<string, ElOrEid>();
    callMap = new Map<string, Array<callEntry>>();
    // updateQueue = new Array<string>();


    behaviorQueue: Array<string> = [];

    global: G4DSyncMemory;

    varid: number;
    behaviorid: number;

    //Use A-frame for this; there is no BitEcs player code **yet**.
    localPlayerEl: PlayerInfo | undefined = undefined;

    constructor(/*Might want to put a global script here later */) {
        // Reserve 0 for global routines; Any global scope variables/routines are called first before searching...
        this.varMap = new Map([[0, new G4DSyncMemory(0)]]);
        this.behaviorMap = new Map([[0, null]]);
        this.behaviorNum2Str = new Map<number, string>();
        this.behaviorStr2Num = new Map<string, number>();

        this.global = this.varMap.get(0)!;

        this.varid = 1;
        this.behaviorid = 1;

        // const playerInfos = window.APP.componentRegistry["player-info"];
        // if (playerInfos) {
        //     for (let i = 0; i < playerInfos.length; i++) {
        //         const playerInfo = playerInfos[i];
        //         if ((playerInfo as PlayerInfo).isLocalPlayerInfo) {
        //             this.localPlayerEl = (playerInfo as PlayerInfo);
        //         }
        //     }
        // }

        // if (this.localPlayerEl === undefined) {
        //     console.error("No local player found!")
        // } else {
        //     console.debug(`Local player found: Id ${NAF.clientId}`);
        // }

        console.log("Game4D System up and running...");
    }

    registerVars(eid: number, jsonstr: string): number {
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

    // registerRoutine(jsonstr: string): number {
    //     console.debug("Parsing: " + jsonstr);
    //     const jsonobj: Array<BehaviorFormat> = JSON.parse(jsonstr);
    //     let routine = new G4DBehavior([]/** Parse stuff here... */);

    //     jsonobj.forEach(n => {
    //         routine.AddNode(n["function"], n["args"], n["children"]);
    //     });

    //     let routineid = this.behaviorid++;
    //     this.behaviorMap.set(routineid, routine);
    //     return routineid;
    // }

    registerBehavior(name: string, paramstr: string, returnstr: string, behaviorJson: string): void {
        console.debug(`Creating ${name}(${paramstr}) => (${returnstr}) : ${behaviorJson} ...`);

        if (this.behaviorStr2Num.get(name) == undefined) {
            let params: Array<G4DParam> = parseParams(paramstr);
            let returnTypes = parseReturnTypes(returnstr);

            try {
                const jsonobj: Array<BehaviorNodeFormat> = JSON.parse(behaviorJson);
                let behavior = new G4DBehavior(name, params, returnTypes, jsonobj);

                this.behaviorid++;
                this.behaviorStr2Num.set(name, this.behaviorid);
                this.behaviorNum2Str.set(this.behaviorid, name);

                this.behaviorMap.set(this.behaviorid, behavior);

            } catch (error) {
                console.error(error);
                console.error("Ignoring behavior...");
            }

        } else {
            console.warn(`Behavior with duplicate name ${name}! Ignoring...`);
        }
    }

    // callRoutine(gid: number, oid: number) {
    //     console.debug(`Routine called: ${gid}, ${oid}`);
    //     let routine = this.behaviorMap.get(gid);
    //     if(routine) {
    //         routine.call(oid);
    //     } else {
    //         console.error("Routine with " + gid + " not found!");
    //     }
    //     // return undefined;
    // }

    callBehavior(name: string, eid: number, interactionArgs: Array<string>, argstr: string, retstr: string) {
        console.debug(`Entity ${eid} calling behavior: ${name}, with arguments: ${argstr}`);
        let bid: number | undefined = this.behaviorStr2Num.get(name);
        if (bid !== undefined) {
            console.log(argstr, retstr);
            let args: Array<string> = [];
            if (argstr !== "") {
                args = interactionArgs.concat(argstr.split(","));
            } else {
                args = interactionArgs;
            }
            let rets: Array<string> = retstr.split(",");
            let behavior: G4DBehavior = this.behaviorMap.get(bid)!
            let returnVals: Array<G4DType> = behavior.call(eid, args);

            if (returnVals.length === rets.length) {
                for (let i = 0; i < returnVals.length; i++) {
                    let orig = this.varMap.get(eid)!.getVal(rets[i]);
                    console.log(orig, returnVals[i]);
                    if (typeof orig === typeof returnVals[i]) {
                        this.varMap.get(eid)!.updateVal(rets[i], returnVals[i]);
                    } else {
                        return;
                    }
                }
            } else {
                console.log("NO MAN HAHAHAHA!", rets.length, returnVals.length)
            }

        } else {
            console.error("Behavior " + name + " not found!");
        }
    }

    getVal(eid: number, name: string): G4DType {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            if (m.getVal(name) !== undefined) {
                return m.getVal(name)!;
            }
        } else if (this.global.getVal(name) !== undefined) {
            return this.global.getVal(name)!;
        }
        console.error("Error, no variable found for eid: " + eid + ", name: " + name);
        return { debug_info: `GETVAR NULLRET; GID:${eid} NAME:${name}` } as G4DUNKNOWNTYPE;
    }

    fetchUpdates(eid: number): number | undefined {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            let updates = m.fetchUpdates();
            if (updates !== undefined) {
                return APP.getSid(updates);
            }
        }

        return APP.getSid("");
    }

    fetchActions(eid: number): number | undefined {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            let actions = m.fetchActions();
            if (actions !== undefined) {
                return APP.getSid(actions);
            }
        }

        return APP.getSid("");
    }

    pushAction(eid: number, funct: string, ...args: Array<G4DVar>): void {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            m.pushAction(funct, args);
        }
    }


    hasUpdates(eid: number): boolean {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.hasUpdates();
        }

        return false;
    }

    hasActions(eid: number): boolean {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.hasActions();
        }

        return false;
    }

    getVarid(eid: number): number | undefined {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.getVarid();
        }

        return undefined;
    }

    getActid(eid: number): number | undefined {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);

        if (m !== undefined) {
            return m.getActid();
        }

        return undefined;
    }

    findRef(eid: number, name: string): G4DVar {
        let m: G4DSyncMemory | undefined = this.varMap.get(eid);
        // console.warn(name, eid, m!.get(name));

        if (m && m.getVal(name) !== undefined) {
            return { name: name, location: m } as G4DVarRef;
        } else if (this.global.getVal(name) !== undefined) {
            return { name: name, location: this.global } as G4DVarRef;
        } else {
            return { name: name, eid: eid } as G4DNOREF;
        }

    }

    synchronizeVars(eid: number, uid: number, varid: number): void {
        let mem: G4DSyncMemory | undefined = this.varMap.get(eid);
        let update: string = APP.getString(uid)!;

        if (mem !== undefined) {
            mem.pushUpdates(update, varid);
        } else {
            console.warn(`Warning, no memory found for ${eid}!`);
        }
    }

    synchronizeActs(eid: number, aid: number, actid: number): void {
        let mem: G4DSyncMemory | undefined = this.varMap.get(eid);
        let actions: string = APP.getString(aid)!;

        if (mem !== undefined) {
            mem.pushBehaviors(actions, actid);
        } else {
            console.warn(`Warning, no memory found for ${eid}!`);
        }
    }

    hasCalls(name: string): boolean {
        return this.callMap.has(name) && this.callMap.get(name)!.length > 0;
    }

    /** @todo implement */
    getCall(name: string, limitSources: boolean, acceptedSources: string): Array<string> | undefined {
        if (this.callMap.has(name) && this.callMap.get(name)!.length > 0) {
            const callEntries: Array<callEntry> = this.callMap.get(name)!;
            const callEntriesCp = callEntries.slice();

            if (limitSources) {

                console.log(acceptedSources);

                const sources: Array<string> = acceptedSources.split(",");

                for (let i = 0; i < sources.length; i++) {
                    sources[i] = sources[i].trim();
                }

                for (let i = 0; i < callEntries.length; i++) {
                    const e = callEntries[i];

                    if (sources.indexOf(e.source) !== -1) {
                        callEntriesCp.shift();
                        this.callMap.set(name, callEntriesCp);
                        return e.args;
                    } else {
                        callEntriesCp.shift();
                    }
                }

                this.callMap.set(name, callEntriesCp);
            } else {
                return callEntries.shift()!.args;
            }
        }

        return undefined;
    }

    pushCall(source: string, target: string, messages: Array<string>) {
        if (this.callMap.has(target)) {
            this.callMap.get(target)!.push({ source: source, args: messages } as callEntry);
        } else {
            this.callMap.set(target, [{ source: source, args: messages } as callEntry]);
        }
    }

    dbg_listVars(eid: number): void {
        let mem: G4DMemory | undefined = this.varMap.get(eid);
        if (mem !== undefined) {
            mem.debugList();
        } else {
            console.log("No vars here!");
        }
    }

}