import React, { Component, ReactNode } from "react";
import { LogViewer } from "@equinor/videx-wellog";
import {
    InterpolatedScaleHandler,
    ScaleInterpolator,
} from "@equinor/videx-wellog";

import {
    Track,
    GraphTrack /*, ScaleTrack, DualScaleTrack*/,
} from "@equinor/videx-wellog";

import { ScaleTrackOptions } from "../../../../../node_modules/@equinor/videx-wellog/dist/tracks/scale/interfaces";
import { GraphTrackOptions } from "../../../../../node_modules/@equinor/videx-wellog/dist/tracks/graph/interfaces";
import {
    OverlayClickEvent,
    OverlayMouseMoveEvent,
    OverlayMouseExitEvent,
    OverlayRescaleEvent,
} from "../../../../../node_modules/@equinor/videx-wellog/dist/ui/interfaces";

import "./styles.scss";

import { select } from "d3";

import { WellLog } from "./WellLogTypes";
import { Template } from "./WellLogTemplateTypes";

import createTracks from "../utils/tracks";
import { getScaleTrackNum, isScaleTrack } from "../utils/tracks";
import { AxesInfo } from "../utils/tracks";
import { ExtPlotOptions } from "../utils/tracks";

import { removeOverlay } from "../utils/log-viewer";

import ReactDOM from "react-dom";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

interface SimpleMenuProps {
    anchorEl: HTMLElement;
    track: Track;
    welllog: WellLog;
    type: string;
}
interface SimpleMenuState {
    anchorEl: HTMLElement | null;
}

class SimpleMenu extends Component<SimpleMenuProps, SimpleMenuState> {
    constructor(props: SimpleMenuProps) {
        super(props);
        this.state = { anchorEl: this.props.anchorEl };
    }
    componentDidUpdate(prevProps: SimpleMenuProps) {
        if (this.props.anchorEl !== prevProps.anchorEl) {
            this.setState({ anchorEl: this.props.anchorEl });
        }
        /*if (
            this.props.welllog !== prevProps.welllog ||
            this.props.track !== prevProps.track
        ) {
        }*/
    }

    closeMenu() {
        this.setState({ anchorEl: null });
    }

    handleContextMenu(ev: React.MouseEvent<HTMLElement>) {
        ev.preventDefault();
        this.closeMenu();
    }
    handleCloseMenu(ev: React.MouseEvent<HTMLElement>) {
        ev;
        this.closeMenu();
    }
    handleClickItem(ev: React.MouseEvent<HTMLElement>) {
        ev;
        this.closeMenu();
    }

    createMenuItem(item: string): ReactNode {
        //onClick = { this.handleClickItem.bind(this) }
        return (
            <MenuItem onClick={this.handleClickItem.bind(this)}>
                &nbsp;&nbsp;&nbsp;&nbsp;{item}
            </MenuItem>
        );
    }
    menuItems(): ReactNode[] {
        const nodes: ReactNode[] = [];
        const track = this.props.track;
        const plots = (track as GraphTrack).plots;
        const abbr = track.options.abbr;

        const welllog = this.props.welllog;
        if (welllog && welllog[0]) {
            const curves = welllog[0].curves;
            let iCurve = 0;
            for (const curve of curves) {
                let bUsed = false;
                if (plots) {
                    // GraphTrack
                    for (const plot of plots)
                        if (plot.id == iCurve) {
                            bUsed = true;
                            break;
                        }
                } else if (abbr === curve.name) {
                    bUsed = true;
                }
                if (!bUsed) nodes.push(this.createMenuItem(curve.name));
                iCurve++;
            }
        }

        return nodes;
    }

    render(): ReactNode {
        if (this.props.type == "title") {
            return (
                <div>
                    <Menu
                        id="simple-menu"
                        anchorEl={this.state.anchorEl}
                        open={Boolean(this.state.anchorEl)}
                        onClose={this.handleCloseMenu.bind(this)}
                        onContextMenu={this.handleContextMenu.bind(this)}
                    >
                        <MenuItem onClick={this.handleClickItem.bind(this)}>
                            {"Add track"}
                        </MenuItem>
                        <MenuItem onClick={this.handleClickItem.bind(this)}>
                            {"Remove track"}
                        </MenuItem>
                    </Menu>
                </div>
            );
        }

        if (this.props.type == "container") {
            return (
                <div>
                    <Menu
                        id="simple-menu"
                        anchorEl={this.state.anchorEl}
                        keepMounted
                        open={Boolean(this.state.anchorEl)}
                        onClose={this.handleCloseMenu.bind(this)}
                        onContextMenu={this.handleContextMenu.bind(this)}
                    >
                        <MenuItem onClick={this.handleClickItem.bind(this)}>
                            {"Menu item 1"}
                        </MenuItem>
                        <MenuItem onClick={this.handleClickItem.bind(this)}>
                            {"Menu item 2"}
                        </MenuItem>
                    </Menu>
                </div>
            );
        }

        return (
            <div>
                <Menu
                    id="simple-menu"
                    anchorEl={this.state.anchorEl}
                    keepMounted
                    open={Boolean(this.state.anchorEl)}
                    onClose={this.handleCloseMenu.bind(this)}
                    onContextMenu={this.handleContextMenu.bind(this)}
                >
                    <MenuItem onClick={this.handleClickItem.bind(this)}>
                        {"Add"}
                    </MenuItem>
                    {this.menuItems()}
                </Menu>
            </div>
        );
    }
}
function localMenuTitle(parent: HTMLElement, track: Track, welllog: WellLog) {
    //if (track) return; // not ready
    const el: HTMLElement = document.createElement("div");
    el.style.width = "10px";
    el.style.height = "13px";
    parent.appendChild(el);
    ReactDOM.render(
        <SimpleMenu
            type="title"
            anchorEl={el}
            track={track}
            welllog={welllog}
        />,
        el
    );
}
function localMenuLegend(parent: HTMLElement, track: Track, welllog: WellLog) {
    //if (track) return; // not ready
    const el: HTMLElement = document.createElement("div");
    el.style.width = "10px";
    el.style.height = "3px";
    parent.appendChild(el);
    ReactDOM.render(
        <SimpleMenu
            type="legend"
            anchorEl={el}
            track={track}
            welllog={welllog}
        />,
        el
    );
}
function localMenuContainer(
    parent: HTMLElement,
    track: Track,
    welllog: WellLog
) {
    //if (track) return; // not ready
    const el: HTMLElement = document.createElement("div");
    el.style.width = "10px";
    el.style.height = "3px";
    parent.appendChild(el);
    ReactDOM.render(
        <SimpleMenu
            type="container"
            anchorEl={el}
            track={track}
            welllog={welllog}
        />,
        el
    );
}

function addRubberbandOverlay(instance: LogViewer, parent: WellLogView) {
    const rubberBandSize = 9;
    const offset = (rubberBandSize - 1) / 2;
    const rbelm = instance.overlay.create("rubber-band", {
        onMouseMove: (event: OverlayMouseMoveEvent) => {
            if (event.target) {
                if (parent.props.horizontal)
                    event.target.style.left = `${event.x - (offset + 0.5)}px`;
                else event.target.style.top = `${event.y - (offset + 0.5)}px`;
                event.target.style.visibility = "visible";
            }
        },
        onMouseExit: (event: OverlayMouseExitEvent) => {
            if (event.target) {
                event.target.style.visibility = "hidden";
                /* not exists ?
                if (instance.options.rubberbandExit) {
                    instance.options.rubberbandExit({
                        source: instance,
                    });
                }
                */
            }
        },
    });

    const rb = select(rbelm)
        .classed("rubber-band", true)
        .style(
            parent.props.horizontal ? "width" : "height",
            `${rubberBandSize}px`
        )
        .style(parent.props.horizontal ? "height" : "width", `${100}%`)
        .style("background-color", "rgba(255,0,0,0.1)")
        .style("visibility", "hidden");

    rb.append("div")
        .style(parent.props.horizontal ? "width" : "height", "1px")
        .style(parent.props.horizontal ? "left" : "top", `${offset}px`)
        .style("background-color", "rgba(255,0,0,0.7)")
        .style("position", "relative");
}

function addReadoutOverlay(instance: LogViewer, parent: WellLogView) {
    //instance.overlay.register(key: string, callbacks: OverlayCallbacks): void;
    const elm = instance.overlay.create("depth", {
        onClick: (event: OverlayClickEvent): void => {
            const { caller, x, y } = event;
            const value = caller.scale.invert(parent.props.horizontal ? x : y);
            if (event.target) {
                event.target.textContent = Number.isFinite(value)
                    ? `Pinned MD: ${value.toFixed(1)}`
                    : "-";
                event.target.style.visibility = "visible";
            }
        },
        onMouseMove: (event: OverlayMouseMoveEvent): void => {
            const { caller, x, y } = event;
            const value = caller.scale.invert(parent.props.horizontal ? x : y);
            if (event.target) {
                event.target.textContent = Number.isFinite(value)
                    ? `MD: ${value.toFixed(1)}`
                    : "-";
                event.target.style.visibility = "visible";
            }

            const x2 = (
                caller.scaleHandler as InterpolatedScaleHandler
            ).interpolator.reverse(value);
            parent.onMouseMove(value, x2);
        },
        onMouseExit: (event: OverlayMouseExitEvent): void => {
            if (event.target) event.target.style.visibility = "hidden";
        },
        onRescale: (event: OverlayRescaleEvent): void => {
            if (event.target && event.transform) {
                parent.onRescale(event.transform.k);

                event.target.style.visibility = "visible";
                event.target.textContent = `Zoom: x${event.transform.k.toFixed(
                    1
                )}`;
            }
        },
    });
    elm.style.visibility = "hidden";
    elm.style.display = "inline-block";
    elm.style.padding = "2px";
    elm.style.borderRadius = "4px";
    elm.style.textAlign = "right";
    elm.style.position = "absolute";
    elm.style.backgroundColor = "rgba(0,0,0,0.5)";
    elm.style.color = "white";
    elm.style.right = "5px";
    elm.style.bottom = "5px";
}

function addPinnedValueOverlay(instance: LogViewer, parent: WellLogView) {
    const rubberBandSize = 9;
    const offset = (rubberBandSize - 1) / 2;
    const rbelm = instance.overlay.create("pinned", {
        onClick: (event: OverlayClickEvent): void => {
            const { x, y } = event;
            if (event.target) {
                if (parent.props.horizontal)
                    event.target.style.left = `${x - (offset + 0.5)}px`;
                else event.target.style.top = `${y - (offset + 0.5)}px`;
                event.target.style.visibility = "visible";
            }
        },
        onMouseExit: (event: OverlayMouseExitEvent): void => {
            if (event.target) event.target.style.visibility = "hidden";
        },
    });

    const rb = select(rbelm)
        .classed("pinned", true)
        .style(
            parent.props.horizontal ? "width" : "height",
            `${rubberBandSize}px`
        )
        .style(parent.props.horizontal ? "height" : "width", `${100}%`)
        .style(parent.props.horizontal ? "top" : "left", `${0}px`)
        .style("background-color", "rgba(0,0,0,0.1)")
        .style("position", "absolute")
        .style("visibility", "hidden");

    rb.append("div")
        .style(parent.props.horizontal ? "width" : "height", "1px")
        .style(parent.props.horizontal ? "height" : "width", `${100}%`)
        .style(parent.props.horizontal ? "left" : "top", `${offset}px`)
        .style("background-color", "rgba(0,255,0,0.7)")
        .style("position", "relative");
}

function createInterpolator(from: Float32Array, to: Float32Array) {
    // 'from' array could be non monotonous (TVD) so could not use binary search

    // Calculate linear interpolation factor between the nodes
    const mul = new Float32Array(from.length);
    const n = from.length;
    for (let i = 0; i < n; i++) {
        if (!i) mul[i] = 0;
        else {
            const d = from[i] - from[i - 1];
            mul[i] = d ? (to[i] - to[i - 1]) / d : 1.0;
        }
    }

    return (x: number, expand: boolean) => {
        for (let i = 0; i < n; i++) {
            if (x < from[i]) {
                if (!i) return expand ? to[0] : Number.NaN; //(null as unknown as number);
                return (x - from[i]) * mul[i] + to[i];
            }
        }
        return expand ? to[n ? n - 1 : 0] : Number.NaN; //(null as unknown as number);
    };
}

function createScaleHandler(
    primaries: Float32Array,
    secondaries: Float32Array
) {
    const primary2secondary = createInterpolator(primaries, secondaries);
    const secondary2primary = createInterpolator(secondaries, primaries);

    const forward = (v: number): number => {
        // SecondaryAxis => PrimaryAxis
        return secondary2primary(v, false);
    };
    const reverse = (v: number): number => {
        // PrimaryAxis => SecondaryAxis
        return primary2secondary(v, false);
    };
    const interpolator: ScaleInterpolator = {
        forward,
        reverse,
        forwardInterpolatedDomain: (domain) =>
            domain.map((v) => /*forward(v)*/ secondary2primary(v, true)),
        reverseInterpolatedDomain: (domain) =>
            domain.map((v) => /*reverse(v)*/ primary2secondary(v, true)),
    };
    return new InterpolatedScaleHandler(interpolator);
}

function formatValue(v1: number) {
    if (!Number.isFinite(v1)) return "";
    let v = v1.toPrecision(4);
    if (v.indexOf(".") >= 0) {
        // cut trailing zeroes
        for (;;) {
            let l = v.length;
            if (!l--) break;
            if (v[l] !== "0") break;
            v = v.substring(0, l);
        }
    }
    return v;
}

function getValue(x: number, data: [], type: string) {
    let v = "";
    if (Number.isFinite(x)) {
        const n = data.length;
        for (let i = 0; i < n; i++) {
            const row = data[i];
            if (row[0] == null) continue;
            if (row[1] == null) continue;
            if (x < row[0]) {
                let v1: number;
                if (!i) break;
                else {
                    const rowPrev = data[i - 1];
                    if (rowPrev[0] == null || rowPrev[1] == null) break;
                    if (type === "linestep") {
                        v1 = row[1]; //!! not rPrev[1] !!
                    } else {
                        const d = row[0] - rowPrev[0];
                        const f = x - rowPrev[0];
                        if (type === "dot") {
                            v1 = f < d * 0.5 ? rowPrev[1] : row[1];
                        } else {
                            // "line", "area"
                            const mul = d ? (row[1] - rowPrev[1]) / d : 1.0;
                            v1 = f * mul + rowPrev[1];
                        }
                    }
                }
                v = formatValue(v1);
                break;
            }
        }
    }
    return v;
}

function setTracksToController(
    logController: LogViewer,
    axes: AxesInfo,
    welllog: WellLog, // JSON Log Format
    template: Template // JSON
) {
    const { tracks, minmaxPrimaryAxis, primaries, secondaries } = createTracks(
        welllog,
        axes,
        template.tracks,
        template.styles
    );
    logController.reset();
    const scaleHandler = createScaleHandler(primaries, secondaries);
    logController.scaleHandler = scaleHandler;
    logController.domain = minmaxPrimaryAxis;
    logController.setTracks(tracks);
}

interface TrackEvent {
    track: Track;
    element: HTMLElement;
    ev: MouseEvent;
}

export interface WellLogController {
    scrollUp(): boolean;
    scrollDown(): boolean;
    scrollTo(pos: number): boolean;
    getScrollPos(): number;
    getScrollMax(): number;
}

interface Info {
    name?: string;
    units?: string;
    color: string;
    value: string;
    type: string; // line, linestep, area, ?dot?
}

interface Props {
    welllog: WellLog;
    template: Template;
    horizontal?: boolean;
    primaryAxis: string;
    //setAvailableAxes : (scales: string[]) => void;
    axisTitles: Record<string, string>;
    axisMnemos: Record<string, string[]>;

    setInfo?: (infos: Info[]) => void;
    setController?: (controller: WellLogController) => void;
    setScrollPos?: (pos: number) => void;
    setZoom?: (pos: number) => void;

    zoom?: number;
    scrollPos?: number;
    maxTrackNum?: number;
}

interface State {
    infos: Info[];

    scrollPos: number;
}

class WellLogView extends Component<Props, State> implements WellLogController {
    container?: HTMLElement;
    logController?: LogViewer;

    constructor(props: Props) {
        super(props);
        //alert("props=" + props)

        this.container = undefined;
        this.logController = undefined;

        this.state = {
            infos: [],
            scrollPos: props.scrollPos ? props.scrollPos : 0,
        };

        if (this.props.setController)
            // set callback to component caller
            this.props.setController(this);
    }

    componentDidMount(): void {
        this.createLogViewer();
        this.setTracks();
    }

    componentDidUpdate(prevProps: Props, prevState: State): void {
        // Typical usage (don't forget to compare props):
        let shouldSetTracks = false;
        if (this.props.horizontal !== prevProps.horizontal) {
            this.createLogViewer();
            shouldSetTracks = true;
        }

        if (this.props.welllog !== prevProps.welllog) {
            shouldSetTracks = true;
        } else if (this.props.template !== prevProps.template) {
            shouldSetTracks = true;
        } else if (this.props.primaryAxis !== prevProps.primaryAxis) {
            shouldSetTracks = true;
        } else if (
            this.props.axisTitles !== prevProps.axisTitles ||
            this.props.axisMnemos !== prevProps.axisMnemos
        ) {
            shouldSetTracks = true;
        }

        if (shouldSetTracks) {
            this.setTracks();
        } else if (this.props.scrollPos !== prevProps.scrollPos) {
            this.scrollTo(this.props.scrollPos ? this.props.scrollPos : 0);
        } else if (
            this.state.scrollPos !== prevState.scrollPos ||
            this.props.maxTrackNum !== prevProps.maxTrackNum
        ) {
            this.setScroll();
            this.setInfo();
        }
        if (this.props.zoom !== prevProps.zoom) {
            this.setZoom();
        }

        /*??
        if (this.props.setController !== prevProps.setController) {
            if (this.props.setController) // set callback to component caller
                this.props.setController(this);
        }*/
    }

    createLogViewer(): void {
        if (this.logController) {
            // remove old LogViewer
            this.logController.reset(); // clear UI
            this.logController.onUnmount(); //?
            removeOverlay(this.logController);
            this.logController = undefined;
        }
        if (this.container) {
            // create new LogViewer
            console.log("createLogViewer horizontal=" + this.props.horizontal);
            this.logController = new LogViewer({
                showLegend: true,
                horizontal: this.props.horizontal,
            });

            this.logController.init(this.container);

            addReadoutOverlay(this.logController, this);
            addRubberbandOverlay(this.logController, this);
            addPinnedValueOverlay(this.logController, this);
        }
        this.setInfo();
    }
    setTracks(): void {
        if (this.logController) {
            const axes: AxesInfo = {
                primaryAxis: this.props.primaryAxis,
                secondaryAxis:
                    this.props.template &&
                    this.props.template.scale &&
                    this.props.template.scale.allowSecondary
                        ? this.props.primaryAxis == "md"
                            ? "tvd"
                            : "md"
                        : "",
                titles: this.props.axisTitles,
                mnemos: this.props.axisMnemos,
            };
            setTracksToController(
                this.logController,
                axes,
                this.props.welllog,
                this.props.template
            );
            // not ready! this.addTrackContextMenus();
        }
        this.setScroll();
        this.setInfo(); // Clear old track information
    }
    setZoom(): void {
        if (this.logController) {
            const [b1, b2] = this.logController.scaleHandler.baseDomain();
            const zoom = this.props.zoom ? this.props.zoom : 1;
            const [d1, d2] = this.logController.domain;
            const k = Math.abs(b2 - b1) / Math.abs(d2 - d1);
            console.log("k=" + k);
            console.log("zoom=" + zoom);
            if (k !== zoom) {
                let d = (d2 - d1) * 0.5;
                const c = d1 + d;
                d = (d * k) / zoom;
                this.logController.zoomTo([c - d, c + d]);
            }
        }
    }
    setScroll(): void {
        const iFrom = this._newPos(this.state.scrollPos);
        const iTo = iFrom + this._maxmaxTrackNum();
        let iTrack = 0;
        if (this.logController) {
            for (const track of this.logController.tracks) {
                if (isScaleTrack(track)) {
                    continue;
                } // skip scales
                if (track.elm) {
                    // class track-container
                    const elm = track.elm.parentElement; // class track
                    if (elm) {
                        const visible = iFrom <= iTrack && iTrack < iTo;
                        //was: elm.style.visibility = visible ? "visible" : "collapse";
                        elm.style.display = visible ? "flex" : "none";
                    }
                }
                iTrack++;
            }
            this.logController.updateTracks();
        }

        if (this.props.setScrollPos) this.props.setScrollPos(iFrom);
    }
    setInfo(x: number = Number.NaN, x2: number = Number.NaN): void {
        if (!this.logController) return;
        if (!this.props.setInfo) return;

        const iFrom = this._newPos(this.state.scrollPos);
        const iTo = iFrom + this._maxmaxTrackNum();
        let iTrack = 0;

        const infos: Info[] = [];
        let iPlot = 0;
        let bSeparator = false;
        for (const track of this.logController.tracks) {
            const bScaleTrack = isScaleTrack(track);
            const visible = (iFrom <= iTrack && iTrack < iTo) || bScaleTrack;
            if (visible) {
                const plotConfigs = (track.options as GraphTrackOptions)[
                    "plots"
                ];
                const datas = track.data;

                if (plotConfigs) {
                    if (!bSeparator) {
                        bSeparator = true;
                        infos.push({
                            color: "",
                            value: "",
                            type: "separator",
                        });
                    }

                    const nPlots = plotConfigs.length;
                    for (let p = 0; p < nPlots; p++) {
                        const plotConfig = plotConfigs[p];
                        const v = getValue(x, datas[p], plotConfig.type);
                        const legend = (
                            plotConfig.options as ExtPlotOptions
                        ).legendInfo();
                        infos.push({
                            name: legend.label,
                            units: legend.unit,
                            color: plotConfig.options.color
                                ? plotConfig.options.color
                                : "",
                            value: v,
                            type: plotConfig.type,
                        });
                        iPlot++;
                    }
                } else {
                    const _x = iPlot == 0 ? x : x2;
                    infos.push({
                        name: track.options.abbr,
                        units: (track.options as ScaleTrackOptions)["units"],
                        color: iPlot == 0 ? "black" : "grey",
                        value: formatValue(_x),
                        type: "", //plot.type,
                    });
                    iPlot++;
                }
            }
            if (!bScaleTrack) iTrack++;
        }

        this.props.setInfo(infos);
    }

    onMouseMove(x: number, x2: number): void {
        this.setInfo(x, x2);
    }

    onRescale(k: number): void {
        if (this.props.setZoom) this.props.setZoom(k);
    }

    _addTrackContextMenu(
        className: string,
        func: (ev: TrackEvent) => void
    ): void {
        //track-title
        if (!this.logController || !this.logController.container) return;
        const elements = this.logController.container
            .node()
            .getElementsByClassName(className);
        let iTrack = 0;
        for (const element of elements) {
            const track = this.logController.tracks[iTrack];
            element.addEventListener("contextmenu", (ev: MouseEvent) => {
                func({ track: track, element: element, ev: ev });
                ev.preventDefault();
            });
            iTrack++;
        }
    }

    addTrackContextMenus(): void {
        this._addTrackContextMenu(
            "track-title",
            this.onTrackTitleContextMenu.bind(this)
        );
        this._addTrackContextMenu(
            "track-legend",
            this.onTrackLegendContextMenu.bind(this)
        );
        this._addTrackContextMenu(
            "track-container",
            this.onTrackContainerContextMenu.bind(this)
        );
    }
    onTrackTitleContextMenu(ev: TrackEvent): void {
        localMenuTitle(ev.element, ev.track, this.props.welllog);
    }
    onTrackLegendContextMenu(ev: TrackEvent): void {
        localMenuLegend(ev.element, ev.track, this.props.welllog);
    }
    onTrackContainerContextMenu(ev: TrackEvent): void {
        localMenuContainer(ev.element, ev.track, this.props.welllog);
    }

    _posMax(): number {
        // for scrollbar
        if (!this.logController) return 0;
        const nScaleTracks = getScaleTrackNum(this.logController.tracks);
        const nGraphTracks = this.logController.tracks.length - nScaleTracks;
        let posMax = nGraphTracks - this._maxmaxTrackNum();
        if (posMax < 0) posMax = 0;
        return posMax;
    }
    _newPos(pos: number): number {
        let newPos = pos;
        const newPosMax = this._posMax();
        if (newPos > newPosMax) newPos = newPosMax;
        if (newPos < 0) newPos = 0;
        return newPos;
    }
    _maxmaxTrackNum(): number {
        return this.props.maxTrackNum
            ? this.props.maxTrackNum
            : 7 /*some default value*/;
    }

    scrollUp(): boolean {
        return this.scrollTo(this.state.scrollPos - 1);
    }
    scrollDown(): boolean {
        return this.scrollTo(this.state.scrollPos + 1);
    }
    scrollTo(pos: number): boolean {
        const newPos = this._newPos(pos);
        if (this.state.scrollPos == newPos) return false;
        this.setState({ scrollPos: newPos });
        return true;
    }
    getScrollPos(): number {
        return this.state.scrollPos;
    }
    getScrollMax(): number {
        return this._posMax();
    }

    render(): ReactNode {
        return (
            <div
                className="welllogview"
                ref={(el) => {
                    this.container = el as HTMLElement;
                }}
            />
        );
    }
}

export default WellLogView;