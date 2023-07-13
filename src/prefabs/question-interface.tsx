/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Label } from "./camera-tool";
import textSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
import { Layers } from "../camera-layers";
const textTexture = textureLoader.load(textSrc);

// eslint-disable-next-line react/prop-types
// export function Label({ text = {}, ...props }, ...children) {
//   const value = children.join("\n");
//   return <entity name="Label" text={{ value, ...text }} layers={1 << Layers.CAMERA_LAYER_UI} {...props} />;
// }

// export interface Text3DParams extends Attrs {
//   text: string;
//   width: number;
//   height: number;
//   texture?: Texture;
//   name?: string;
//   labelRef?: Ref;
// }

// export function TextBox3D({
//   text = {}, ...props},
//   width: number,
//   texture = textTexture,
//   name = "textField",
//   height: number,
//   textRef: Ref,
//   ...children: Array<String>) {
//   const value = children.join("\n");
//   return (
//     <entity
//       name={name}
//       slice9={{ size: [width, height], insets: [64, 66, 64, 66], texture }}
//       layers={1 << Layers.CAMERA_LAYER_UI}
//       ref = {textRef}
//       {...props}
//     >
//       <entity
//         ref={textRef}
//         layers={1 << Layers.CAMERA_LAYER_UI}
//         text={{ value, ...text}}
//         position={[0, 0, 0.01]}
//         name={`${name} Label`}
//       />
//     </entity>
//   );
// }


const UI_Z = 0.001;
const POSITION_TEXT: ArrayVec3 = [0.0, 0.45, UI_Z]
const PAGE_LABEL_COLOR = new Color(0.1, 0.1, 0.1);
export function QuestionInterfacePrefab() {
  const refQuestion = createRef();
  return (
    <entity
      name="Question Interface"
      questionInterface={{
        questionBoxRef: refQuestion
      }}
    >
      <Label name="Question text" text={{ color: PAGE_LABEL_COLOR }} ref={refQuestion} position={POSITION_TEXT} />
    </entity>
  );
}
