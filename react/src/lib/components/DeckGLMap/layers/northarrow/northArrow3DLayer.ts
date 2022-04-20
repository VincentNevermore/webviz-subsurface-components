import { Layer } from "@deck.gl/core";
import GL from "@luma.gl/constants";
import { Model, Geometry } from "@luma.gl/core";
import { LayerProps } from "@deck.gl/core/lib/layer";
import fragmentShader from "./axes-fragment.glsl";
import gridVertex from "./grid-vertex.glsl";
import { project } from "deck.gl";
import { DeckGLLayerContext } from "../../components/Map";
import { UpdateStateInfo } from "@deck.gl/core/lib/layer";
import { Vector3 } from "@math.gl/core";

export type NorthArrow3DLayerProps<D> = LayerProps<D>;

export default class NorthArrow3DLayer extends Layer<
    unknown,
    NorthArrow3DLayerProps<unknown>
> {
    initializeState(context: DeckGLLayerContext): void {
        const { gl } = context;
        this.setState(this._getModels(gl));
    }

    shouldUpdateState(): boolean | string | null {
        return true;
    }

    updateState({
        context,
    }: UpdateStateInfo<NorthArrow3DLayerProps<unknown>>): void {
        if (context.gl) {
            this.setState(this._getModels(context.gl));
        }
    }

    // Signature from the base class, eslint doesn't like the any type.
    // eslint-disable-next-line
    draw({ moduleParameters, uniforms, context }: any): void {
        const { gl } = context;
        gl.disable(gl.DEPTH_TEST);
        super.draw({ moduleParameters, uniforms, context });
        gl.enable(gl.DEPTH_TEST);
    }

    //eslint-disable-next-line
    _getModels(gl: any) {
        const model_lines = GetArrowLines();

        const cam_pos = new Vector3(this.context.viewport.getCameraPosition());
        const center = new Vector3(this.unproject([100, 100]));

        const dir = new Vector3([
            center[0] - cam_pos[0],
            center[1] - cam_pos[1],
            center[2] - cam_pos[2],
        ]);
        dir.normalize();
        dir.scale(1000.0);

        // pos: World coordinate for north arrow. Will be fixed realative to camera.
        const pos = new Vector3([
            cam_pos[0] + dir[0],
            cam_pos[1] + dir[1],
            cam_pos[2] + dir[2],
        ]);

        const lines: number[] = [];

        const scale = 10;
        for (let i = 0; i < model_lines.length / 3; i = i + 1) {
            const x = model_lines[i * 3 + 0] * scale + pos[0];
            const y = model_lines[i * 3 + 1] * scale + pos[1];
            const z = model_lines[i * 3 + 2] * scale + pos[2];
            lines.push(x, y, z);
        }

        const grids = new Model(gl, {
            id: `${this.props.id}-grids`,
            vs: gridVertex,
            fs: fragmentShader,
            geometry: new Geometry({
                drawMode: GL.LINES,
                attributes: {
                    positions: new Float32Array(lines),
                },
                vertexCount: lines.length / 3,
            }),

            modules: [project],
            isInstanced: false, // This only works when set to false.
        });

        return {
            model: grids,
            models: [grids].filter(Boolean),
            modelsByName: { grids },
        };
    }
}

//-- Local functions. --------------------------------------

function GetArrowLines(): number[] {
    const lines: number[][] = [];

    let z = 0.5;
    lines.push([-1, -2, z]);
    lines.push([-1, 2, z]);

    lines.push([-1, 2, z]);
    lines.push([-1.5, 2, z]);

    lines.push([-1.5, 2, z]);
    lines.push([0, 4, z]);

    lines.push([0, 4, z]);
    lines.push([1.5, 2, z]);

    lines.push([1.5, 2, z]);
    lines.push([1, 2, z]);

    lines.push([1, 2, z]);
    lines.push([1, -2, z]);

    lines.push([1, -2, z]);
    lines.push([-1, -2, z]);

    z = -0.5;
    lines.push([-1, -2, z]);
    lines.push([-1, 2, z]);

    lines.push([-1, 2, z]);
    lines.push([-1.5, 2, z]);

    lines.push([-1.5, 2, z]);
    lines.push([0, 4, z]);

    lines.push([0, 4, z]);
    lines.push([1.5, 2, z]);

    lines.push([1.5, 2, z]);
    lines.push([1, 2, z]);

    lines.push([1, 2, z]);
    lines.push([1, -2, z]);

    lines.push([1, -2, z]);
    lines.push([-1, -2, z]);

    // stolper
    lines.push([-1, -2, -0.5]);
    lines.push([-1, -2, 0.5]);

    lines.push([-1, 2, -0.5]);
    lines.push([-1, 2, 0.5]);

    lines.push([-1.5, 2, -0.5]);
    lines.push([-1.5, 2, 0.5]);

    lines.push([0, 4, -0.5]);
    lines.push([0, 4, 0.5]);

    lines.push([1.5, 2, -0.5]);
    lines.push([1.5, 2, 0.5]);

    lines.push([1, 2, -0.5]);
    lines.push([1, 2, 0.5]);

    lines.push([1, -2, -0.5]);
    lines.push([1, -2, 0.5]);

    return lines.flat();
}