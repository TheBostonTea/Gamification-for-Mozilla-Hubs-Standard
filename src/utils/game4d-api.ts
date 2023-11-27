import { Game4dObject } from "../bit-components";
import { G4DInnerMemory, G4DMemory, G4DType, G4DVar, G4DVarRef, isVarRef } from "./game4d-utils";

export type G4DFunct = (eid: number, mem: G4DInnerMemory, ...args: Array<G4DVar>) => void;
export type G4DOperator = (left: G4DType, right: G4DType) => boolean;

function G4DUNKNOWNACTION(eid: number, _: G4DInnerMemory, ...args: Array<G4DVar>) {
    let stringf = `Entity ${eid} has called an unknown action, with the following arguments:`

    args.forEach(arg => {
        stringf += "\n\t" + arg + ",";
    });
    console.warn(stringf);
}

// function G4DAssign(eid: number, mem: G4DInnerMemory, name: G4DVar, value: G4DVar) {

// }

function G4DConsolelog(eid: number, _: G4DInnerMemory, strf: G4DVar, ...args: Array<G4DVar>) {
    let typecheck = isVarRef(strf) && typeof strf.location.getVal(strf.name) === "string";
    let fargs: Array<G4DType> = [];
    args.forEach(arg => {
        typecheck = typecheck && isVarRef(arg);
        if (typecheck) {
            fargs.push((arg as G4DVarRef).location.getVal(arg.name)!);
        }
    });
    if (typecheck) {
        console.log((strf as G4DVarRef).location.getVal(strf.name), fargs);
        G4D.pushAction(eid, "console", strf, ...args);
    }
}

function G4DIncrement(_: number, mem: G4DInnerMemory, a: G4DVar) {
    console.log("Increment!");
    if (isVarRef(a)/* && isVarRef(incr)*/) {
        let val = a.location.getVal(a.name);
        if (typeof val === "number"/* && typeof incr === "number"*/) {
            mem.updateVal(a.name, val + 1);
            console.log(val + 1);
        } else {
            //TODO; neat error handling
            console.error("Variable of incorrect of unknown type in increment!");
        }
    }

}

function G4DReturn(_: number, mem: G4DInnerMemory, ...args: Array<G4DVar>) {
    console.log("Return! " + args)
    args.forEach(arg => {
        if (isVarRef(arg)) {
            mem.pushReturnVar(arg.name);
        } else {
            console.error("Unknown variable reference found.");
            return;
        }
    });
}

function G4DCall(eid: number, _: G4DInnerMemory, target: G4DVar, ...args: Array<G4DVar>) {
    console.log("Call!", target, ...args);
    if (isVarRef(target)) {
        const source = APP.getString(Game4dObject.identifier[eid])!;

        let argstrs: Array<string> = [];

        args.forEach(arg => {
            if (isVarRef(arg)) {
                argstrs.push(`_${typeof arg}:${arg.location.getVal(arg.name)}`);
            }
        });

        G4D.pushCall(source, target.location.getVal(target.name) as string, argstrs);
    } else {
        console.log("No sigar!");
    }
}

function G4Dlt(left: number, right: number): boolean {
    console.debug(`Eval: ${left} < ${right}`);
    return left < right;
}

function G4Dleq(left: number, right: number): boolean {
    console.debug(`Eval: ${left} <= ${right}`);
    return left <= right;
}

function G4Dgt(left: number, right: number): boolean {
    console.debug(`Eval: ${left} > ${right}`);
    return left > right;
}

function G4Dgeq(left: number, right: number): boolean {
    console.debug(`Eval: ${left} >= ${right}`);
    return left >= right;
}

function G4Deq(left: G4DType, right: G4DType): boolean {
    console.debug(`Eval: ${left} == ${right}`);
    return typeof left == typeof right ? (left == right) : false;
}

function G4Dand(left: boolean, right: boolean): boolean {
    console.debug(`Eval: ${left} && ${right}`);
    return left && right;
}

function G4Dor(left: boolean, right: boolean): boolean {
    console.debug(`Eval: ${left} || ${right}`);
    return left || right;
}

function G4DUKNOWNOP(left: G4DType, right: G4DType): boolean {
    console.error("Unknown Operator!");
    console.debug(`Eval ${left} UNKNOWN ${right} (always false)`);
    return false;
}
//TODO: rewrite to map again to reduce code!
export function fetchAction(funct: string): G4DFunct {
    switch (funct) {
    case "console":
        console.log("Found console.log!");
        return G4DConsolelog;

    case "console.log":
        console.log("Found console.log!");
        return G4DConsolelog;

    case "increment":
        console.log("Found increment!");
        return G4DIncrement;

    case "return":
        console.log("Found return!");
        return G4DReturn;

    case "call":
        console.log("Found call!");
        return G4DCall;

    default:
        return G4DUNKNOWNACTION;
    }
}

export function fetchOperator(op: string): G4DOperator {
    switch (op) {
    case ">":
        return G4Dgt;

    case ">=":
        return G4Dgeq;

    case "<":
        return G4Dlt;

    case "<=":
        return G4Dleq;

    case "==":
        return G4Deq;

    case "&&":
        return G4Dand;

    case "||":
        return G4Dor;

    default:
        return G4DUKNOWNOP;
    }

}

export function isSideEffect(funct: string): Boolean {
    return (funct == "console" /* || ... */);
}