import { addComponent } from "bitecs";
import { HubsWorld } from "../app";
import { CursorRaycastable, Question, RemoteHoverTarget, SingleActionButton } from "../bit-components";


export type QuestionParams = {
    question: string;
}

export function inflateQuestion( world: HubsWorld, eid: number, params: QuestionParams) {
    console.log("Inflate question %d", eid);
    addComponent(world, Question, eid);
    Question.question[eid] = APP.getSid(params.question);

    addComponent(world, RemoteHoverTarget, eid);
    addComponent(world, CursorRaycastable, eid);
    addComponent(world, SingleActionButton, eid);
}