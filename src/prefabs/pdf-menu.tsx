/** @jsx createElementEntity */
import { Color } from "three";
import { ArrayVec3, Attrs, createElementEntity, createRef, Ref } from "../utils/jsx-entity";
import { Button3D, BUTTON_TYPES } from "./button3D";
import { Label } from "./camera-tool";
import textSrc from "../assets/hud/nametag.9.png";
import { textureLoader } from "../utils/media-utils";
import { Texture } from "three";
import { Layers } from "../camera-layers";
const textTexture = textureLoader.load(textSrc);

const BUTTON_HEIGHT = 0.2;
const BUTTON_SCALE: ArrayVec3 = [0.4, 0.4, 0.4];
const BUTTON_WIDTH = 0.3;

interface PDFPageButtonProps extends Attrs {
  text: string;
}

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


function PDFPageButton(props: PDFPageButtonProps) {
  return (
    <Button3D
      name={props.name}
      scale={BUTTON_SCALE}
      width={BUTTON_WIDTH}
      height={BUTTON_HEIGHT}
      type={BUTTON_TYPES.ACTION}
      {...props}
    />
  );
}

const UI_Z = 0.001;
const POSITION_PREV: ArrayVec3 = [-0.45, 0.0, UI_Z];
const POSITION_NEXT: ArrayVec3 = [0.45, 0.0, UI_Z];
const POSITION_LABEL: ArrayVec3 = [0.0, -0.45, UI_Z];
const POSITION_TEXT: ArrayVec3 = [0.0, 0.45, UI_Z]
const PAGE_LABEL_COLOR = new Color(0.1, 0.1, 0.1);
export function PDFMenuPrefab() {
  const refPrev = createRef();
  const refNext = createRef();
  const refLabel = createRef();
  const refText = createRef();
  return (
    <entity
      name="PDF Menu"
      pdfMenu={{
        prevButtonRef: refPrev,
        nextButtonRef: refNext,
        pageLabelRef: refLabel,
        textBoxRef: refText
      }}
    >
      <PDFPageButton name="Previous Page Button" text="<" ref={refPrev} position={POSITION_PREV} />
      <PDFPageButton name="Next Page Button" text=">" ref={refNext} position={POSITION_NEXT} />
      <Label ref={refLabel} position={POSITION_LABEL} text={{ color: PAGE_LABEL_COLOR }} />
      <Label name="Test Text" text={{ color: PAGE_LABEL_COLOR }} ref={refText} position={POSITION_TEXT} />
    </entity>
  );
}
