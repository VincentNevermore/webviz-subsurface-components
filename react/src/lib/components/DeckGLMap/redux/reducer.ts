/* eslint-disable @typescript-eslint/no-explicit-any */
import { combineReducers, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DrawMode } from "./types";
import { LayerProps } from "@deck.gl/core/lib/layer";

export const specSlice = createSlice({
    name: "layers",
    initialState: {} as LayerProps<unknown>[],
    reducers: {
        setLayers: (_, action: PayloadAction<LayerProps<unknown>[]>) =>
            action.payload,
        updateVisibleLayers: (
            state,
            action: PayloadAction<[string, boolean]>
        ) => {
            const layer = (state as any[]).find(
                (layer) => layer.id === action.payload[0]
            );
            layer.visible = action.payload[1];
        },
        updateDrawingMode: (
            state,
            action: PayloadAction<[string, DrawMode]>
        ) => {
            const layer = (state as any[]).find(
                (layer) => layer.id === action.payload[0]
            );
            if (layer["@@type"] === "DrawingLayer")
                layer.mode = action.payload[1];
        },
        updateLayerProp: (
            state,
            action: PayloadAction<[string, string, boolean | string | number]>
        ) => {
            const layer = (state as any[]).find(
                (layer) => layer.id === action.payload[0]
            );
            layer[action.payload[1]] = action.payload[2];
        },
    },
});
export const rootReducer = combineReducers({
    layers: specSlice.reducer,
});