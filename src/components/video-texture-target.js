import { disposeTexture } from "../utils/material-utils";
import { createVideoOrAudioEl } from "../utils/media-utils";
import { findNode } from "../utils/three-utils";

/**
 * @component video-texture-source
 * This component is intended to be used on entities with a Camera Object3D as a child.
 * That camera is used to render the scene to a WebGLRenderTarget of the specified resolution
 * at a maximum of the specified frame rate. It will only render a frame if something sets
 * it's textureNeedsUpdate property to true. Currently video-texture-target does this
 * whenever its material is used during the primary camera render (as in, its in view).
 */
AFRAME.registerComponent("video-texture-source", {
  schema: {
    resolution: { type: "vec2", default: [1280, 720] },
    fps: { default: 15 }
  },

  init() {
    this.camera = findNode(this.el.object3D, n => n.isCamera);
    this.camera.aspect = this.data.resolution[0] / this.data.resolution[1];

    // TODO currently if a video-texture-source tries to render itself it will fail with a warning.
    // If we want to support this we will need 2 render targets to swap back and forth.
    this.renderTarget = new THREE.WebGLRenderTarget(this.data.resolution[0], this.data.resolution[1], {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.GammaEncoding,
      depth: false,
      stencil: false
    });

    const texture = this.renderTarget.texture;
    texture.matrixAutoUpdate = false;
    texture.matrix.scale(1, -1);
    texture.matrix.translate(0, 1);

    this.textureNeedsUpdate = false;
  },

  tock(time) {
    if (!this.textureNeedsUpdate) return;

    if (time < this.lastRenderTime + 1000 / this.data.fps) return;

    // TODO handle hiding UI and showing first person head
    // Once thats done also rework camrea-tool to use this to do its actual rendering

    const sceneEl = this.el.sceneEl;
    const renderer = this.renderer || sceneEl.renderer;

    const tmpVRFlag = renderer.vr.enabled;
    const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
    delete sceneEl.object3D.onAfterRender;
    renderer.vr.enabled = false;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(sceneEl.object3D, this.camera);
    renderer.setRenderTarget(null);

    renderer.vr.enabled = tmpVRFlag;
    sceneEl.object3D.onAfterRender = tmpOnAfterRender;

    this.lastRenderTime = time;
    this.textureNeedsUpdate = false;
  }
});

/**
 * @component video-texture-target
 * This component is intended to be used on entities with a mesh/skinned mesh Object3D
 * The component swaps the base color map on the mesh's material with a video texture
 * Currently the video texture can come from a webcam stream or a camera entity with
 * a video-texture-src component on it.
 */
AFRAME.registerComponent("video-texture-target", {
  schema: {
    src: { type: "string" },
    targetBaseColorMap: { type: "boolean", default: true },
    targetEmissiveMap: { type: "boolean", default: false },
    // TODO having both src and target is a bit odd
    target: { type: "selector" }
  },

  getMaterial() {
    return (
      (this.el.object3DMap.skinnedmesh && this.el.object3DMap.skinnedmesh.material) ||
      (this.el.object3DMap.mesh && this.el.object3DMap.mesh.material) ||
      this.el.object3D.material
    );
  },

  init() {
    const material = this.getMaterial();

    if (!material) {
      console.warn("video-texture-target added to an entity without a material");
    }

    this.originalMap = material && material.map;
    this.originalEmissiveMap = material && material.emissiveMap;
  },

  update(prevData) {
    const material = this.getMaterial();

    if (!material) {
      return;
    }

    const src = this.data.src;

    if (src && src.startsWith("hubs://")) {
      if (prevData.src === src) {
        return;
      }

      const streamClientId = src.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now

      NAF.connection.adapter.getMediaStream(streamClientId, "video").then(stream => {
        if (src !== this.data.src) {
          // Prevent creating and loading video texture if the src changed while we were fetching the video stream.
          return;
        }

        const video = createVideoOrAudioEl("video");
        video.srcObject = stream;

        const texture = new THREE.VideoTexture(video);
        texture.flipY = false;
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        this.applyTexture(texture);
      });
    } else {
      if (this.data.target) {
        const videoTextureSource = this.data.target.components["video-texture-source"];
        const texture = videoTextureSource.renderTarget.texture;
        this.applyTexture(texture);

        // Bit of a hack here to only update the renderTarget when the screens are in view
        material.map.isVideoTexture = true;
        material.map.update = () => {
          videoTextureSource.textureNeedsUpdate = true;
        };
      } else {
        if (material.map && material.map !== this.originalMap) {
          disposeTexture(material.map);
        }

        if (material.emissiveMap && material.emissiveMap !== this.originalEmissiveMap) {
          disposeTexture(material.emissiveMap);
        }

        material.map = this.originalMap;
        material.emissiveMap = this.originalEmissiveMap;

        material.needsUpdate = true;
      }
    }
  },

  applyTexture(texture) {
    const material = this.getMaterial();

    // Copy texture settings from the original texture so that things like texture wrap settings are applied
    const originalTexture = this.originalMap || this.originalEmissiveMap;

    if (originalTexture) {
      texture.wrapS = originalTexture.wrapS;
      texture.wrapT = originalTexture.wrapT;
    }

    if (this.data.targetBaseColorMap) {
      material.map = texture;
    }

    if (this.data.targetEmissiveMap) {
      material.emissiveMap = texture;
    }

    material.needsUpdate = true;
  },

  remove() {
    const material = this.getMaterial();

    if (material && material.map && material.map !== this.originalMap) {
      disposeTexture(material.map);
    }

    if (material.emissiveMap && material.emissiveMap !== this.originalEmissiveMap) {
      disposeTexture(material.emissiveMap);
    }
  }
});
