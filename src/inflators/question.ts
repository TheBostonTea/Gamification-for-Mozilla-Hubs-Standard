import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { Question } from "../bit-components";


export type QuestionParams = {
    question: string;
}

export function inflateQuestion( world: HubsWorld, eid: number, params: QuestionParams) {
    console.log("Inflate question %d", eid);
    addComponent(world, Question, eid);
    Question.question[eid] = APP.getSid(params.question);
}