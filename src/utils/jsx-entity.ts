import { addComponent, addEntity, Component, hasComponent } from "bitecs";
import { preloadFont } from "troika-three-text";
import {
  $isStringType,
  CameraTool,
  ObjectMenu,
  LinkHoverMenu,
  LinkHoverMenuItem,
  PDFMenu,
  CursorRaycastable,
  DestroyAtExtremeDistance,
  FloatyObject,
  HandCollisionTarget,
  Holdable,
  HoldableButton,
  HoverButton,
  MakeKinematicOnRelease,
  AnimationMixer,
  Networked,
  NetworkedTransform,
  Object3DTag,
  OffersHandConstraint,
  OffersRemoteConstraint,
  RemoteHoverTarget,
  SingleActionButton,
  TextButton,
  NetworkedVideo,
  VideoMenu,
  VideoMenuItem,
  NotRemoteHoverTarget,
  Deletable,
  SceneLoader,
  NavMesh,
  SceneRoot,
  NetworkDebug,
  WaypointPreview,
  NetworkedFloatyObject,
  Billboard,
  MaterialTag,
  VideoTextureSource,
  Mirror
} from "../bit-components";
import { inflateMediaLoader } from "../inflators/media-loader";
import { inflateMediaFrame } from "../inflators/media-frame";
import { GrabbableParams, inflateGrabbable } from "../inflators/grabbable";
import { inflateImage } from "../inflators/image";
import { inflateVideo } from "../inflators/video";
import { inflateModel, ModelParams } from "../inflators/model";
import { inflatePDFLoader, PDFLoaderParams } from "../inflators/pdf-loader";
import { inflateVideoLoader, VideoLoaderParams } from "../inflators/video-loader";
import { inflateImageLoader, ImageLoaderParams } from "../inflators/image-loader";
import { inflateModelLoader, ModelLoaderParams } from "../inflators/model-loader";
import { inflateLink, LinkParams } from "../inflators/link";
import { inflateSlice9 } from "../inflators/slice9";
import { TextParams, inflateText } from "../inflators/text";
import {
  BackgroundParams,
  EnvironmentSettingsParams,
  FogParams,
  inflateBackground,
  inflateEnvironmentSettings,
  inflateFog
} from "../inflators/environment-settings";
import { inflateSpawnpoint, inflateWaypoint, WaypointParams } from "../inflators/waypoint";
import { inflateReflectionProbe, ReflectionProbeParams } from "../inflators/reflection-probe";
import { HubsWorld } from "../app";
import { Group, Material, Object3D, Texture, VideoTexture } from "three";
import { AlphaMode } from "./create-image-mesh";
import { MediaLoaderParams } from "../inflators/media-loader";
import { preload } from "./preload";
import { DirectionalLightParams, inflateDirectionalLight } from "../inflators/directional-light";
import { AmbientLightParams, inflateAmbientLight } from "../inflators/ambient-light";
import { HemisphereLightParams, inflateHemisphereLight } from "../inflators/hemisphere-light";
import { PointLightParams, inflatePointLight } from "../inflators/point-light";
import { SpotLightParams, inflateSpotLight } from "../inflators/spot-light";
import { ProjectionMode } from "./projection-mode";
import { inflateSkybox, SkyboxParams } from "../inflators/skybox";
import { inflateSpawner, SpawnerParams } from "../inflators/spawner";
import { inflateVideoTextureTarget, VideoTextureTargetParams } from "../inflators/video-texture-target";
import { inflateUVScroll, UVScrollParams } from "../inflators/uv-scroll";
import { SimpleWaterParams, inflateSimpleWater } from "../inflators/simple-water";
import { inflatePDF, PDFParams } from "../inflators/pdf";
import { MirrorParams, inflateMirror } from "../inflators/mirror";
import { inflateParticleEmitter, ParticleEmitterParams } from "../inflators/particle-emitter";
import { AudioZoneParams, inflateAudioZone } from "../inflators/audio-zone";
import { AudioSettings, SceneAudioSettings } from "../components/audio-params";
import { inflateAudioParams } from "../inflators/audio-params";
import { AudioSourceParams, inflateAudioSource } from "../inflators/audio-source";
import { AudioTargetParams, inflateAudioTarget } from "../inflators/audio-target";
import { PhysicsShapeParams, inflatePhysicsShape } from "../inflators/physics-shape";
import { inflateRigidBody, RigiBodyParams } from "../inflators/rigid-body";
import { AmmoShapeParams, inflateAmmoShape } from "../inflators/ammo-shape";
import { BoxColliderParams, inflateBoxCollider } from "../inflators/box-collider";
import { inflateTrimesh } from "../inflators/trimesh";
import { HeightFieldParams, inflateHeightField } from "../inflators/heightfield";
import { inflateAudioSettings } from "../inflators/audio-settings";
import { DoorParams, inflateDoor } from "../inflators/door";
import { inflateQuestion, QuestionParams } from "../inflators/question";

preload(
  new Promise(resolve => {
    preloadFont(
      { characters: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_<()>[]|0123456789" },
      resolve as () => void
    );
  })
);

const reservedAttrs = ["position", "rotation", "scale", "visible", "name", "layers"];

export class Ref {
  current: number | null;
  constructor(value: number | null) {
    this.current = value;
  }
}
export function createRef(value: number | null = null) {
  return new Ref(value);
}

export function resolveRef(world: HubsWorld, ref: Ref) {
  if (ref.current === null) {
    ref.current = addEntity(world);
  }
  return ref.current;
}

export type ArrayVec3 = [x: number, y: number, z: number];
export type Attrs = {
  position?: ArrayVec3;
  rotation?: ArrayVec3;
  scale?: ArrayVec3;
  visible?: boolean;
  name?: string;
  layers?: number;
  ref?: Ref;
};

export type EntityDef = {
  components: JSXComponentData;
  attrs: Attrs;
  children: EntityDef[];
  ref?: Ref;
};

function isReservedAttr(attr: string): attr is keyof Attrs {
  return reservedAttrs.includes(attr);
}

type ComponentFn = string | ((attrs: Attrs & JSXComponentData, children?: EntityDef[]) => EntityDef);
export function createElementEntity(
  tag: "entity" | ComponentFn,
  attrs: Attrs & JSXComponentData,
  ...children: EntityDef[]
): EntityDef {
  attrs = attrs || {};
  if (typeof tag === "function") {
    return tag(attrs, children);
  } else if (tag === "entity") {
    const outputAttrs: Attrs = {};
    const components: JSXComponentData & Attrs = {};
    let ref = undefined;

    for (const attr in attrs) {
      if (isReservedAttr(attr)) {
        outputAttrs[attr] = attrs[attr] as any;
      } else if (attr === "ref") {
        ref = attrs[attr];
      } else {
        // if jsx transformed the attr into attr: true, change it to attr: {}.
        const c = attr as keyof JSXComponentData;
        components[c] = attrs[c] === true ? {} : attrs[c];
      }
    }

    return {
      attrs: outputAttrs,
      components,
      children: children.flat(),
      ref
    };
  } else {
    throw new Error(`invalid tag "${tag}"`);
  }
}

export function addObject3DComponent(world: HubsWorld, eid: number, obj: Object3D) {
  if (hasComponent(world, Object3DTag, eid)) {
    throw new Error("Tried to add an object3D tag to an entity that already has one");
  }
  addComponent(world, Object3DTag, eid);
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  return eid;
}

export function swapObject3DComponent(world: HubsWorld, eid: number, obj: Object3D) {
  if (!hasComponent(world, Object3DTag, eid)) {
    throw new Error("Tried to swap Object3D aon an entity that does not have the object3D tag");
  }
  const oldObj = world.eid2obj.get(eid)!;
  oldObj.eid = 0;
  world.eid2obj.set(eid, obj);
  obj.eid = eid;
  return eid;
}

export function addMaterialComponent(world: HubsWorld, eid: number, mat: Material) {
  if (hasComponent(world, MaterialTag, eid)) {
    throw new Error("Tried to add an Material tag to an entity that already has one");
  }
  addComponent(world, MaterialTag, eid);
  world.eid2mat.set(eid, mat);
  mat.eid = eid;
  return eid;
}

const createDefaultInflator = (C: Component, defaults = {}): InflatorFn => {
  return (world, eid, componentProps) => {
    componentProps = Object.assign({}, defaults, componentProps);
    addComponent(world, C, eid, true);
    Object.keys(componentProps).forEach(propName => {
      const prop = C[propName as keyof Component] as any;
      if (!prop) {
        console.error(`${propName} is not a valid property of`, C);
        return;
      }
      const value = componentProps[propName];
      if (prop[$isStringType]) {
        if (value && typeof value !== "string") {
          throw new TypeError(`Expected ${propName} to be a string, got an ${typeof value} (${value})`);
        }
        prop[eid] = APP.getSid(value);
      } else {
        prop[eid] = value;
      }
    });
  };
};

interface InflatorFn {
  (world: HubsWorld, eid: number, componentProps: any): void;
}

// @TODO these properties should import types from their inflators
export interface ComponentData {
  ambientLight?: AmbientLightParams;
  directionalLight?: DirectionalLightParams;
  hemisphereLight?: HemisphereLightParams;
  pointLight?: PointLightParams;
  spotLight?: SpotLightParams;
  grabbable?: GrabbableParams;
  billboard?: { onlyY: boolean };
  link?: LinkParams;
  mirror?: MirrorParams;
  audioZone?: AudioZoneParams;
  audioParams?: AudioSettings;
}

type OptionalParams<T> = Partial<T> | true;

export interface JSXComponentData extends ComponentData {
  slice9?: {
    size: [width: number, height: number];
    insets: [top: number, buttom: number, left: number, right: number];
    texture: Texture;
  };
  image?: {
    texture: Texture;
    ratio: number;
    projection: ProjectionMode;
    alphaMode: typeof AlphaMode.Blend | typeof AlphaMode.Mask | typeof AlphaMode.Opaque;
    cacheKey: string;
  };
  video?: {
    texture: VideoTexture;
    ratio: number;
    projection: ProjectionMode;
    autoPlay: boolean;
  };
  networkedVideo?: true;
  videoMenu?: {
    timeLabelRef: Ref;
    trackRef: Ref;
    headRef: Ref;
    playIndicatorRef: Ref;
    pauseIndicatorRef: Ref;
  };
  videoMenuItem?: true;
  cursorRaycastable?: true;
  remoteHoverTarget?: true;
  isNotRemoteHoverTarget?: true;
  handCollisionTarget?: true;
  offersRemoteConstraint?: true;
  offersHandConstraint?: true;
  singleActionButton?: true;
  holdableButton?: true;
  holdable?: true;
  deletable?: true;
  makeKinematicOnRelease?: true;
  destroyAtExtremeDistance?: true;

  // @TODO Define all the anys
  networked?: any;
  textButton?: any;
  hoverButton?: any;
  rigidbody?: OptionalParams<RigiBodyParams>;
  physicsShape?: OptionalParams<PhysicsShapeParams>;
  floatyObject?: any;
  networkedFloatyObject?: any;
  networkedTransform?: any;
  objectMenu?: {
    pinButtonRef: Ref;
    unpinButtonRef: Ref;
    cameraFocusButtonRef: Ref;
    cameraTrackButtonRef: Ref;
    removeButtonRef: Ref;
    dropButtonRef: Ref;
    inspectButtonRef: Ref;
    deserializeDrawingButtonRef: Ref;
    openLinkButtonRef: Ref;
    refreshButtonRef: Ref;
    cloneButtonRef: Ref;
    rotateButtonRef: Ref;
    mirrorButtonRef: Ref;
    scaleButtonRef: Ref;
  };
  linkHoverMenu?: {
    linkButtonRef: Ref;
  };
  linkHoverMenuItem?: boolean;
  pdfMenu?: {
    prevButtonRef: Ref;
    nextButtonRef: Ref;
    pageLabelRef: Ref;
    //TODO: Remove!
    textBoxRef: Ref;
  };
  cameraTool?: {
    snapMenuRef: Ref;
    nextButtonRef: Ref;
    prevButtonRef: Ref;
    snapRef: Ref;
    cancelRef: Ref;
    recVideoRef: Ref;
    screenRef: Ref;
    selfieScreenRef: Ref;
    cameraRef: Ref;
    countdownLblRef: Ref;
    captureDurLblRef: Ref;
    sndToggleRef: Ref;
  };
  animationMixer?: any;
  mediaLoader?: MediaLoaderParams;
  sceneRoot?: boolean;
  sceneLoader?: { src: string };
  mediaFrame?: any;
  object3D?: any;
  text?: TextParams;
  model?: ModelParams;
  networkDebug?: boolean;
  waypointPreview?: boolean;
  pdf?: PDFParams;
}

export interface GLTFComponentData extends ComponentData {
  pdf?: PDFLoaderParams;
  audio?: VideoLoaderParams;
  video?: VideoLoaderParams;
  image?: ImageLoaderParams;
  model?: ModelLoaderParams;
  environmentSettings?: EnvironmentSettingsParams;
  reflectionProbe?: ReflectionProbeParams;
  navMesh?: true;
  waypoint?: WaypointParams;
  spawner: SpawnerParams;
  uvScroll: UVScrollParams;
  videoTextureTarget: VideoTextureTargetParams;
  videoTextureSource: { fps: number; resolution: [x: number, y: number] };
  zoneAudioSource: AudioSourceParams;
  audioTarget: AudioTargetParams;
  audioSettings: SceneAudioSettings;

  // deprecated
  spawnPoint?: true;
  skybox: SkyboxParams;
  fog: FogParams;
  background: BackgroundParams;
  simpleWater?: SimpleWaterParams;
  particleEmitter?: ParticleEmitterParams;
  ammoShape?: AmmoShapeParams;
  boxCollider?: BoxColliderParams;
  trimesh?: true;
  heightfield?: HeightFieldParams;
  // Needs to be the same name as the (door).ts and the (door) component.
  // Says there might be a component that will contain (door), of the signature
  // DoorParams from door.ts
  door?: DoorParams;
  question?: QuestionParams;
}

declare global {
  namespace createElementEntity.JSX {
    interface IntrinsicElements {
      entity: JSXComponentData &
        Attrs & {
          children?: IntrinsicElements[];
        };
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

export const commonInflators: Required<{ [K in keyof ComponentData]: InflatorFn }> = {
  grabbable: inflateGrabbable,
  billboard: createDefaultInflator(Billboard),
  link: inflateLink,

  // inflators that create Object3Ds
  ambientLight: inflateAmbientLight,
  directionalLight: inflateDirectionalLight,
  hemisphereLight: inflateHemisphereLight,
  pointLight: inflatePointLight,
  spotLight: inflateSpotLight,
  mirror: inflateMirror,
  audioZone: inflateAudioZone,
  audioParams: inflateAudioParams
};

const jsxInflators: Required<{ [K in keyof JSXComponentData]: InflatorFn }> = {
  ...commonInflators,
  cursorRaycastable: createDefaultInflator(CursorRaycastable),
  remoteHoverTarget: createDefaultInflator(RemoteHoverTarget),
  isNotRemoteHoverTarget: createDefaultInflator(NotRemoteHoverTarget),
  handCollisionTarget: createDefaultInflator(HandCollisionTarget),
  offersRemoteConstraint: createDefaultInflator(OffersRemoteConstraint),
  offersHandConstraint: createDefaultInflator(OffersHandConstraint),
  singleActionButton: createDefaultInflator(SingleActionButton),
  holdableButton: createDefaultInflator(HoldableButton),
  textButton: createDefaultInflator(TextButton),
  hoverButton: createDefaultInflator(HoverButton),
  holdable: createDefaultInflator(Holdable),
  deletable: createDefaultInflator(Deletable),
  rigidbody: inflateRigidBody,
  physicsShape: inflatePhysicsShape,
  floatyObject: createDefaultInflator(FloatyObject),
  networkedFloatyObject: createDefaultInflator(NetworkedFloatyObject),
  makeKinematicOnRelease: createDefaultInflator(MakeKinematicOnRelease),
  destroyAtExtremeDistance: createDefaultInflator(DestroyAtExtremeDistance),
  networkedTransform: createDefaultInflator(NetworkedTransform),
  networked: createDefaultInflator(Networked),
  objectMenu: createDefaultInflator(ObjectMenu),
  linkHoverMenu: createDefaultInflator(LinkHoverMenu),
  linkHoverMenuItem: createDefaultInflator(LinkHoverMenuItem),
  pdfMenu: createDefaultInflator(PDFMenu),
  cameraTool: createDefaultInflator(CameraTool, { captureDurIdx: 1 }),
  animationMixer: createDefaultInflator(AnimationMixer),
  networkedVideo: createDefaultInflator(NetworkedVideo),
  videoMenu: createDefaultInflator(VideoMenu),
  videoMenuItem: createDefaultInflator(VideoMenuItem),
  sceneRoot: createDefaultInflator(SceneRoot),
  sceneLoader: createDefaultInflator(SceneLoader),
  networkDebug: createDefaultInflator(NetworkDebug),
  waypointPreview: createDefaultInflator(WaypointPreview),
  pdf: inflatePDF,
  mediaLoader: inflateMediaLoader,


  // inflators that create Object3Ds
  mediaFrame: inflateMediaFrame,
  object3D: addObject3DComponent,
  slice9: inflateSlice9,
  text: inflateText,
  model: inflateModel,
  image: inflateImage,
  video: inflateVideo
};

export const gltfInflators: Required<{ [K in keyof GLTFComponentData]: InflatorFn }> = {
  ...commonInflators,
  pdf: inflatePDFLoader,
  // Temporarily reuse video loader for audio because of
  // their processings are similar.
  // TODO: Write separated audio loader properly because
  //       their processings are not perfectly indentical.
  audio: inflateVideoLoader,
  video: inflateVideoLoader,
  image: inflateImageLoader,
  model: inflateModelLoader,
  reflectionProbe: inflateReflectionProbe,
  navMesh: createDefaultInflator(NavMesh),
  waypoint: inflateWaypoint,
  environmentSettings: inflateEnvironmentSettings,
  fog: inflateFog,
  background: inflateBackground,
  spawnPoint: inflateSpawnpoint,
  skybox: inflateSkybox,
  spawner: inflateSpawner,
  videoTextureTarget: inflateVideoTextureTarget,
  videoTextureSource: createDefaultInflator(VideoTextureSource),
  uvScroll: inflateUVScroll,
  simpleWater: inflateSimpleWater,
  particleEmitter: inflateParticleEmitter,
  zoneAudioSource: inflateAudioSource,
  audioTarget: inflateAudioTarget,
  ammoShape: inflateAmmoShape,
  boxCollider: inflateBoxCollider,
  trimesh: inflateTrimesh,
  heightfield: inflateHeightField,
  audioSettings: inflateAudioSettings,
  // Same name as the (door).ts and the custom component (door).
  // Ties "door" to its inflator
  door: inflateDoor,
  question: inflateQuestion
};

function jsxInflatorExists(name: string): name is keyof JSXComponentData {
  return Object.prototype.hasOwnProperty.call(jsxInflators, name);
}

export function gltfInflatorExists(name: string): name is keyof GLTFComponentData {
  return Object.prototype.hasOwnProperty.call(gltfInflators, name);
}

export function renderAsEntity(world: HubsWorld, entityDef: EntityDef) {
  const eid = entityDef.ref ? resolveRef(world, entityDef.ref) : addEntity(world);
  Object.keys(entityDef.components).forEach(name => {
    if (!jsxInflatorExists(name)) {
      throw new Error(`Failed to inflate unknown component called ${name}`);
    }
    const props = entityDef.components[name];
    for (const propName in props) {
      const value = props[propName];
      if (value instanceof Ref) {
        props[propName] = resolveRef(world, value);
      }
    }
    jsxInflators[name](world, eid, entityDef.components[name]);
  });

  let obj = world.eid2obj.get(eid);
  if (!obj) {
    obj = new Group();
    addObject3DComponent(world, eid, obj);
  }

  if (entityDef.attrs.position) {
    obj.position.fromArray(entityDef.attrs.position);
  }
  if (entityDef.attrs.rotation) {
    obj.rotation.fromArray(entityDef.attrs.rotation);
  }
  if (entityDef.attrs.scale) {
    obj.scale.fromArray(entityDef.attrs.scale);
  }
  if (entityDef.attrs.name) {
    obj.name = entityDef.attrs.name;
  }
  if (entityDef.attrs.layers !== undefined) {
    obj.layers.mask = entityDef.attrs.layers;
  }
  if (entityDef.attrs.visible !== undefined) {
    obj.visible = entityDef.attrs.visible;
  }
  entityDef.children.forEach(child => {
    const childEid = renderAsEntity(world, child);
    obj!.add(world.eid2obj.get(childEid)!);
  });
  return eid;
}
