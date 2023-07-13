import { addComponent, defineQuery, entityExists, hasComponent } from "bitecs";
import { Text } from "troika-three-text";
import type { HubsWorld } from "../app";
import { EntityStateDirty, Interacted, Question, QuestionInterface } from "../bit-components";
import { anyEntityWith, findAncestorWithComponent } from "../utils/bit-utils";
import type { EntityID } from "../utils/networking-types";
// import { takeOwnership } from "../utils/take-ownership";
import { setMatrixWorld } from "../utils/three-utils";
// import { PDFResourcesMap } from "./pdf-system";

// function clicked(world: HubsWorld, eid: EntityID) {
//   return hasComponent(world, Interacted, eid);
// }

function findPDFMenuTarget(world: HubsWorld, ui: EntityID, sceneIsFrozen: boolean) {
  if (QuestionInterface.targetRef[ui] && !entityExists(world, QuestionInterface.targetRef[ui])) {
    // Clear the invalid entity reference. (The pdf entity was removed).
    QuestionInterface.targetRef[ui] = 0;
  }

  if (sceneIsFrozen) {
    QuestionInterface.targetRef[ui] = 0;
    return;
  }

  const clicked = clickedQuery(world);
  const target = clicked.map(eid => findAncestorWithComponent(world, Question, eid))[0] || 0;
  if (target) {
    QuestionInterface.targetRef[ui] = target;
    // QuestionInterface.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  if (clicked.some(eid => findAncestorWithComponent(world, Question, eid))) {
    // QuestionInterface.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  // if (world.time.elapsed > QuestionInterface.clearTargetTimer[menu]) {
  //   QuestionInterface.targetRef[menu] = 0;
  //   return;
  // }
}

function moveToTarget(world: HubsWorld, ui: EntityID) {
  const targetObj = world.eid2obj.get(QuestionInterface.targetRef[ui])!;
  targetObj.updateMatrices();
  const menuObj = world.eid2obj.get(ui)!;
  setMatrixWorld(menuObj, targetObj.matrixWorld);
}

// function handleClicks(world: HubsWorld, menu: EntityID) {
//   if (clicked(world, PDFMenu.nextButtonRef[menu])) {
//     const pdf = PDFMenu.targetRef[menu];
//     setPage(world, pdf, NetworkedPDF.pageNumber[pdf] + 1);
//   } else if (clicked(world, PDFMenu.prevButtonRef[menu])) {
//     const pdf = PDFMenu.targetRef[menu];
//     setPage(world, pdf, NetworkedPDF.pageNumber[pdf] - 1);
//   }
// }

function flushToObject3Ds(world: HubsWorld, ui: EntityID, frozen: boolean) {
  const target = QuestionInterface.targetRef[ui];
  const visible = !!(target && !frozen);

  const obj = world.eid2obj.get(ui)!;
  obj.visible = visible;

  // [PDFMenu.prevButtonRef[menu], PDFMenu.nextButtonRef[menu]].forEach(buttonRef => {
  //   const buttonObj = world.eid2obj.get(buttonRef)!;
  //   // Parent visibility doesn't block raycasting, so we must set each button to be invisible
  //   // TODO: Ensure that children of invisible entities aren't raycastable
  //   buttonObj.visible = visible;
  // });

  if (target) {
    // const numPages = PDFResourcesMap.get(target)!.pdf.numPages;
    // (world.eid2obj.get(PDFMenu.pageLabelRef[menu]) as Text).text = `${NetworkedPDF.pageNumber[target]} / ${numPages}`;
    const questionText = APP.getString(Question.question[target]);
    (world.eid2obj.get(QuestionInterface.questionBoxRef[ui]) as Text).text = `${questionText}`;
  }
}

const clickedQuery = defineQuery([Interacted]);
export function QuestionInterfaceSystem(world: HubsWorld, sceneIsFrozen: boolean) {
  const ui = anyEntityWith(world, QuestionInterface)!;
  findPDFMenuTarget(world, ui, sceneIsFrozen);
  if (QuestionInterface.targetRef[ui]) {
    moveToTarget(world, ui);
    // handleClicks(world, menu);
  }
  flushToObject3Ds(world, ui, sceneIsFrozen);
}
export const dummy = 10;
