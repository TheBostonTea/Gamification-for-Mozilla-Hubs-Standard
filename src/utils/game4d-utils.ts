import { element, string } from "prop-types";
import { G4DGetValFromType, BehaviorNodeFormat, isActionNodeFormat, isLoopingNodeFormat, ExpressionFormat, isLogicBlockFormat, IfElseNodeFormat, isExpressionFormat, isNewVarNodeFormat } from "../game4d";
import { G4DOperator, G4DFunct, fetchAction, fetchOperator } from "./game4d-api";

const MAX_LOOP = 10000;

export type G4DType = number | boolean | string | G4DUNKNOWNTYPE;

export type G4DUNKNOWNTYPE = {
    debug_info: string,
    content: string
};

export type G4DNode = G4DNewVarNode | G4DActionNode | G4DLogicBlock | G4DLoopingNode;

export type G4DNewVarNode = {
    name: string;
    value: string;
    next: G4DNode | undefined;
}

export type G4DActionNode = {
    action: G4DFunct,
    args: Array<string>,
    next: G4DNode | undefined;
};

export type G4DLoopingNode = {
    loopingConditional: G4DExpressionNode | string,
    child: G4DNode | undefined,
    next: G4DNode | undefined;
};

export type G4DLogicBlock = {
    ifstmt: G4DIfElseNode | undefined,
    next: G4DNode | undefined;
};

export type G4DIfElseNode = {
    conditional: G4DExpressionNode | string,
    child: G4DNode | undefined,
    else: G4DIfElseNode | undefined;
};

export type G4DExpressionNode = {
    leftexpr: string | G4DExpressionNode,
    rightexpr: string | G4DExpressionNode;
    operator: G4DOperator,
}

export type G4DParam = {
    name: string,
    type: string,
};

export type G4DVar = G4DVarRef | G4DNOREF;

export type G4DVarRef = {
    name: string,
    location: G4DMemory
};

export type G4DNOREF = {
    name: string,
    eid: number;
};

export const isVarRef = (v: G4DVar): v is G4DVarRef => (v as G4DVarRef).location !== undefined;

export const isUnknownType = (t: G4DType): t is G4DUNKNOWNTYPE => (t as G4DUNKNOWNTYPE).debug_info !== undefined;

export const isNewVarNode = (n: G4DNode): n is G4DNewVarNode => (n as G4DNewVarNode).name !== undefined;

export const isActionNode = (n: G4DNode): n is G4DActionNode => (n as G4DActionNode).action !== undefined;

export const isLogicBlock = (n: G4DNode): n is G4DLogicBlock => (n as G4DLogicBlock).ifstmt !== undefined;

export const isLoopingNode = (n: G4DNode): n is G4DLoopingNode => (n as G4DLoopingNode).loopingConditional !== undefined;

export const isExpressionNode = (n: string | G4DExpressionNode): n is G4DExpressionNode => (n as G4DExpressionNode).operator !== undefined;

export function G4DGetType(t: G4DType | undefined): string {
    if (t === undefined) {
        return "undefined";
    } else if (isUnknownType(t)) {
        return "UNKOWNVAR";
    } else {
        return typeof t;
    }
}

export class G4DMemory {
    mem: Map<string, G4DType>;
    eid: number;

    constructor(eid: number) {
        this.mem = new Map<string, G4DType>();
        this.eid = eid;
    }

    getRef(key: string): G4DVar {
        let val = this.mem.get(key);

        if (val !== undefined) {
            return { name: key, location: this } as G4DVarRef;
        } else {
            return { name: key, eid: this.eid } as G4DNOREF;
        }
    }

    getVal(key: string): G4DType | undefined {
        return this.mem.get(key);
    }

    initVal(key: string, value: G4DType): void {
        if (this.mem.get(key) === undefined) {
            this.mem.set(key, value);
        } else {
            console.warn(`Warning: ${key} is already set in memory! Ignoring...`);
        }
    }

    updateVal(key: string, value: G4DType): void {
        // Currently, memory is never locked.
        let orig = this.getVal(key);
        if (orig == undefined) {
            console.warn(`Variable ${key} not in memory ${this.eid}`);
        } else if (G4DGetType(value) !== G4DGetType(this.getVal(key))) {
            console.warn(`Updated Variable '${key}' of incorrect type! Expected ${G4DGetType(this.getVal(key))}, got ${G4DGetType(value)}`);
        } else {
            this.mem.set(key, value);
        }
    }

    debugList(): void {
        this.mem.forEach((value: G4DType, key: string) => {
            console.log("key: \"" + key + "\"\n val: " + value);
        });
    }

}

export class G4DInnerMemory extends G4DMemory {
    index: number;
    returnVars: Array<string> = [];

    constructor(eid: number) {
        super(eid);
        this.index = 0;
    }

    registerLiteral(literal: string): G4DVarRef {
        let name = String(this.index++);
        let value = convertLiteral(literal);
        // console.log(`${content}, ${type}`);
        super.initVal(name, value);
        return { name: name, location: this } as G4DVarRef;
    }

    assignParams(args: Array<string>, params: Array<G4DParam>): boolean {

        if (args.length !== params.length) {
            console.error(`Amount of arguments supplied is not equal to the amount of parameters for this behavior: expected ${params.length}, got ${args.length}!`);
            return false;
        }

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (arg.charAt(0) === "@") {
                console.debug("Found reference: " + arg);
                let aname = arg.substring(1);

                let val = G4D.getVal(this.eid, aname);
                if (isUnknownType(val)) {
                    val = G4D.getVal(0, aname);
                    if (isUnknownType(val)) {
                        console.error(`Cannot find reference of argument ${arg} in context of entity ${this.eid}!`);
                        return false;
                    }
                }

                if (typeof val !== params[i].type) {
                    console.error(`Type of argument ${aname} is ${typeof val}, but expected ${params[i].type}`);
                    return false;
                } else {
                    super.initVal(params[i].name, val);
                }
            } else if (arg.charAt(0) === "_") {
                // Only support strings for now!
                super.initVal(params[i].name, arg.substring(1));
            } else {
                console.error("Malformed argument name or content: " + arg);
                return false;
            }
        }
        return true
    }

    pushReturnVar(returnVar: string): void {
        this.returnVars.push(returnVar);
    }

    getReturnVars(): Array<string> {
        return this.returnVars;
    }
}

function parseBehaviorFormats(behaviorFormats: Array<BehaviorNodeFormat>): G4DNode | undefined {
    let head: G4DNode | undefined = undefined;
    let last: G4DNode | undefined = undefined;

    behaviorFormats.forEach(f => {
        let node: G4DNode | undefined = undefined;
        if (isNewVarNodeFormat(f)) {
            console.log(`Found new var node! ${f.name}, ${f.value}`);
            node = { name: f.name, value: f.value } as G4DNewVarNode;
        } else if (isActionNodeFormat(f)) {
            console.log(`Found action node! ${f.function}, ${f.args}, ${last}`);
            node = { action: fetchAction(f.function), args: f.args, next: undefined } as G4DActionNode;
        } else if (isLoopingNodeFormat(f)) {
            console.log(`Found looping node ${f.loopingConditional}, ${last}`);
            node = { loopingConditional: parseExpressionFormat(f.loopingConditional), child: parseBehaviorFormats(f.children), next: undefined } as G4DLoopingNode;
        } else if (isLogicBlockFormat(f)) {
            console.log(`Found If-else block ${f.ifElseNodes}, ${last}`);
            node = { ifstmt: parseIfStmts(f.ifElseNodes), } as G4DLogicBlock;
        } else {
            console.error("Unknown format parsed!");
            return head;
        }

        if (last === undefined) {
            head = node;
        } else {
            last.next = node;
        }

        last = node;
    });


    return head;
}

function parseExpressionFormat(e: ExpressionFormat | string): G4DExpressionNode | string {
    console.log(`Parsing expression ${e}, or ${(e as ExpressionFormat).operator}, ${(e as ExpressionFormat).leftexpr}, ${(e as ExpressionFormat).rightexpr}`);
    if (isExpressionFormat(e)) {
        return { leftexpr: parseExpressionFormat(e.leftexpr), rightexpr: parseExpressionFormat(e.rightexpr), operator: fetchOperator(e.operator) } as G4DExpressionNode;
    } else if (typeof e == "string") {
        if (e.charAt(0) == '@' || e.charAt(0) == '_') {
            return e;
        } else {
            console.error(`Malformed expression: ${e}`);
            return "_boolean:false"
        }
    } else {
        console.error(`Error, expression has unknown type! ${typeof e}, ${e}`);
        // console.error(`e.operator ${e.operator}`)
        return "_boolean:false"
    }
}

function parseIfStmts(stmts: Array<IfElseNodeFormat>): G4DIfElseNode | undefined {
    console.log(`Parsing If else block.`);
    let head: G4DIfElseNode | undefined = undefined;
    let last: G4DIfElseNode | undefined = undefined;

    stmts.forEach(stmt => {
        console.log(`Parsing: ${stmt.conditional}, ${stmt.children}`);
        let node: G4DIfElseNode = { conditional: parseExpressionFormat(stmt.conditional), child: parseBehaviorFormats(stmt.children), else: undefined };

        if (last === undefined) {
            head = node;
        } else {
            last.else = node;
        }

        last = node;
    });

    return head;
}

function parseExpression(eid: number, mem: G4DInnerMemory, expr: G4DExpressionNode | string): boolean {
    if (isExpressionNode(expr)) {
        let left: G4DType;
        let right: G4DType;

        if (isExpressionNode(expr.leftexpr)) {
            left = parseExpression(eid, mem, expr.leftexpr);
        } else {
            let leftref = resolveArgument(eid, mem, expr.leftexpr);
            let leftval = mem.getVal(leftref.name);
            (leftval !== undefined) ? left = leftval : left = false;
        }

        if (isExpressionNode(expr.rightexpr)) {
            right = parseExpression(eid, mem, expr.rightexpr);
        } else {
            let rightref = resolveArgument(eid, mem, expr.rightexpr);
            let rightval = mem.getVal(rightref.name);
            (rightval !== undefined) ? right = rightval : right = false;
        }

        return expr.operator(left, right);
    } else {
        let arg: G4DVar = resolveArgument(eid, mem, expr)!;
        if (isVarRef(arg)) {
            let val = arg.location.getVal(arg.name)
            if (typeof val === "boolean") {
                return val;
            } else {
                console.warn("Non boolean check!");
                return false;
            }
        } else {
            console.error("Unknown variable!");
            return false;
        }
    }

}

function resolveArguments(eid: number, mem: G4DInnerMemory, args: Array<string>): Array<G4DVar> {
    let arr: Array<G4DVar> = [];

    args.forEach(arg => {
        arr.push(resolveArgument(eid, mem, arg))
    });

    return arr;
}

function resolveArgument(eid: number, mem: G4DInnerMemory, arg: string): G4DVar {
    if (arg.charAt(0) === "@") {
        console.debug("Found reference: " + arg);
        let name = arg.substring(1);

        let ref = mem.getRef(name);

        if (!isVarRef(ref)) {
            console.error(`Cannot find reference of argument ${arg} in context of entity ${eid}!`);
        }

        return ref;

    } else if (arg.charAt(0) === "_") {
        return mem.registerLiteral(arg.substring(1));
    } else {
        console.error("Malformed argument name or content: " + arg);
        return { name: arg, eid: eid } as G4DNOREF;
    }
}

function resolveNewVar(eid: number, mem: G4DInnerMemory, n: G4DNewVarNode): void {
    if (typeof n.value == "string") {
        let arg = resolveArgument(eid, mem, n.value);
        if (isVarRef(arg)) {
            mem.initVal(n.name, arg.location.getVal(arg.name)!);
        } else {
            console.log("Unknown new var!");
            mem.initVal(n.name, { debug_info: "Unknown referenced type!", content: n.value } as G4DUNKNOWNTYPE);
        }
    }
}

function convertLiteral(literal: string): G4DType {
    const literalStrs: Array<string> = literal.split(':');
    if (literalStrs.length == 2) {

        switch (literalStrs[0]) {
        case "number":
            return Number(literalStrs[1]);

        case "boolean":
            return Boolean(literalStrs[1]);

        case "string":
            return literalStrs[1];

        default:
            return { debug_info: "Malformed Literal: incorrect type!", content: literal } as G4DUNKNOWNTYPE
        }
    } else {
        return { debug_info: "Malformed Literal: incorrect amount of \':\' ", content: literal } as G4DUNKNOWNTYPE
    }
}



export class G4DBehavior {
    name: string;
    head: G4DNode | undefined;

    params: Array<G4DParam>;
    returnTypes: Array<string>;

    constructor(name: string, params: Array<G4DParam>, returnTypes: Array<string>, behaviorNodes: Array<BehaviorNodeFormat>) {
        this.name = name;
        this.params = params;
        this.returnTypes = returnTypes;
        this.head = parseBehaviorFormats(behaviorNodes);
    }

    call(eid: number, args: Array<string>): Array<G4DType> {

        let curr: G4DNode | undefined = this.head;

        if (!this.head) {
            console.warn(`Empty behavior ${this.name} from Entity ${eid} called! This might indicate a malformed behavior tree! No values may be returned by this behavior!`);
            return [];
        }

        let mem = new G4DInnerMemory(eid);


        if (!mem.assignParams(args, this.params)) {
            return [];
        }

        let depth: number = 0;
        let stack: Array<G4DNode> = [];
        let loopingNumber = 0;

        while (curr !== undefined || depth > 0) {

            if (curr == undefined) {
                if (depth > 0) {
                    curr = stack.pop();
                    depth--;
                    if (curr == undefined) {
                        console.error("Undefined popped from the stack! quitting...");
                        break;
                    }
                    if (isLogicBlock(curr)) {
                        curr = curr.next;
                    }

                } else {
                    // This should not happen, but just in case...
                    console.error("Error, parser in impossible state, quitting...");
                    break;
                }
            } else {
                if (isNewVarNode(curr)) {
                    mem.initVal(curr.name, convertLiteral(curr.value))
                    curr = curr.next;
                } else if (isActionNode(curr)) {
                    let innerArgs: Array<G4DVar> = resolveArguments(eid, mem, curr.args);
                    curr.action(eid, mem, ...innerArgs);
                    curr = curr.next;
                } else if (isLoopingNode(curr)) {
                    if (loopingNumber < MAX_LOOP && parseExpression(eid, mem, curr.loopingConditional)) {
                        depth++;
                        loopingNumber++;
                        stack.push(curr);
                        curr = curr.child;
                    } else {
                        if (loopingNumber >= MAX_LOOP) {
                            console.warn("Maximum loops for one behavior call reached, skipping loop...");
                        }
                        curr = curr.next;
                    }
                } else if (isLogicBlock(curr)) {
                    let stmt: G4DIfElseNode | undefined = curr.ifstmt;
                    while (stmt !== undefined) {
                        if (parseExpression(eid, mem, stmt.conditional)) {
                            stack.push(curr);
                            depth++;
                            curr = stmt.child;
                            break;
                        } else {
                            stmt = stmt.else;
                        }
                    }
                } else {
                    console.error("Unknown behavior node encountered!");
                }
            }
        }

        let returnVars: Array<string> = mem.getReturnVars();

        if (this.returnTypes.length !== returnVars.length) {
            console.error(`Amount of returned values in behavior ${this.name} does not match promised return variables: Expected ${this.returnTypes.length}, got ${returnVars.length}`);
        }

        let returnVals: Array<G4DType> = [];

        for (let i = 0; i < returnVars.length; i++) {
            let val = mem.getVal(returnVars[i]);
            console.log("Return ", i, returnVars[i], val)

            if (val !== undefined) {
                if (typeof val === this.returnTypes[i]) {
                    returnVals.push(val);
                } else {
                    console.error(`Return variable ${returnVars[i]} in behavior ${this.name} has incorrect type; Expected ${this.returnTypes[i]}, got ${typeof val}`);
                    return [];
                }
            } else {
                console.error(`Variable ${returnVars[i]} not allocated in behavior ${this.name}, but is still returned!`);
                // Do not write anything for safety sake!
                return [];
            }

        }

        returnVals.forEach(val => {
            console.log(val);
        });
        return returnVals;
    }

}



