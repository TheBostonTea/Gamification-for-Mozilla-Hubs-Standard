import { G4DMemory, G4DType, G4DVar, G4DVarRef, isVarRef } from "./game4d-utils";

export type G4DFunct  = (eid: number, mem: G4DMemory, ...args : Array<G4DVar>) => void;

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
        console.log((strf as G4DVarRef).location.getVal(strf.name), fargs);
        G4D.pushAction(eid, "console", strf, ...args);
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

//TODO: rewrite to map again to reduce code!
export function fetchAction(funct: string): G4DFunct{
    switch (funct) {
        case "console":
            return G4DConsolelog;

        case "increment":
            return G4DIncrement;
            
        default:
            return G4DUNKNOWNACTION;
    }
}

export function isSideEffect(funct: string): Boolean {
    return (funct == "console" /* || ... */);
}