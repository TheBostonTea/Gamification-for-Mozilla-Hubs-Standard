import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { Interacted, Question } from "../bit-components";
import { HubsWorld } from "../app";

function clicked(eid: number) {
    return hasComponent(APP.world, Interacted, eid);
}

const questionQuery = defineQuery([Question]);
//Do I always need these?
const questionEnterQuery = enterQuery(questionQuery);
const questionExitQuery = exitQuery(questionQuery);

export function questionSystem(world: HubsWorld) {

    questionEnterQuery(world).forEach(function (eid) {

    });

    questionExitQuery(world).forEach( function (eid) {

    });

    questionQuery(world).forEach(function (eid) {
        
        // If the question was clicked, Do this!
        if (clicked(eid)){
            console.log("The question %d was clicked!", eid);
            console.log("%s Question?", APP.getString(Question.question[eid]));
        }
    });


}

