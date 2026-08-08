import { loadCostume as importLoadCostume } from "../import/load-costume";
import { loadSound as importLoadSound } from "../import/load-sound";
import ScratchStorage from "@open-ccw/scratch-storage";
import VirtualMachine from "..";
import Runtime from "../engine/runtime";
import { RenderWebGL as ScratchRender } from "@open-ccw/scratch-render";
import AudioEngine from "scratch-audio";
import { decrypt } from "./decrypt";

// import ScratchSVGRenderer from '@turbowarp/scratch-svg-renderer';

// Track loading time with timestamps and if possible the performance api.
if (window.performance) {
  // Mark with the performance API when benchmark.js and its dependecies start
  // evaluation. This can tell us once measured how long the code spends time
  // turning into execution code for the first time. Skipping evaluation of
  // some of the code can help us make it faster.
  performance.mark("Scratch.EvalStart");
}

type Original = { call: (arg0: any, ...arg1: any) => any };

class LoadingMiddleware {
  middleware: any[];
  host: any;
  original: Original | null;
  constructor() {
    this.middleware = [];
    this.host = null;
    this.original = null;
  }

  install(host: any, original: Original) {
    this.host = host;
    this.original = original;
    const { middleware } = this;
    return function (...args: any) {
      let i = 0;
      const next = function (_args: any[]) {
        if (i >= middleware.length) {
          return original.call(host, ..._args);
        }
        return middleware[i++](_args, next);
      };
      return next(args);
    };
  }

  push(middleware: any) {
    this.middleware.push(middleware);
  }
}

const costumeMiddleware = new LoadingMiddleware();
(importLoadCostume as any).loadCostume = costumeMiddleware.install(
  importLoadCostume,
  importLoadCostume,
);

const soundMiddleware = new LoadingMiddleware();
(importLoadSound as any).loadSound = soundMiddleware.install(
  importLoadSound,
  importLoadSound,
);

const Scratch = (window.Scratch = window.Scratch || {});

const ASSET_SERVER = "https://m.ccw.site/";
const PROJECT_SERVER = "https://cdn.projects.scratch.mit.edu/";

const SLOW = 0.1;

const projectInput = document.querySelector("#project-id") as HTMLInputElement;
if (location.hash) {
  projectInput.value = location.hash.substring(1);
}

const enableCompiler =
  new URLSearchParams(location.search).get("compiler") === "true";
const compilerInput = document.querySelector(
  "#enable-compiler",
) as HTMLInputElement;
compilerInput.checked = enableCompiler;

document.querySelector(".run")?.addEventListener(
  "click",
  () => {
    const params = new URLSearchParams(location.search);
    params.set("compiler", String(compilerInput.checked));
    location.href = `${location.pathname}?${params}#${projectInput.value}`;
  },
  false,
);

const setShareLink = function (json: {
  fixture: { projectId: string; warmUpTime: any; recordingTime: any };
  frames: any[];
  opcodes: {};
}) {
  (document.querySelector(".share") as HTMLAnchorElement | null)?.setAttribute(
    "href",
    `#view/${btoa(JSON.stringify(json))}`,
  );
  (
    document.querySelectorAll(".share")[1] as HTMLAnchorElement | null
  )?.setAttribute("href", "suite.html");
};

const getProjectMetadata = async (projectOid: string) => {
  const response = await fetch(
    "https://community-web.ccw.site/creation/detail",
    {
      method: "post",
      body: JSON.stringify({
        oid: projectOid,
        accessKey: "",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  if (response.status === 404) {
    throw new Error("The project is unshared or does not exist");
  }
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} fetching project metadata`);
  }
  const json = await response.json();
  console.log(json);
  if (json.code !== "200") {
    console.error(json.message);
    throw new Error(json.message);
  }
  return json;
};

const getProjectData = async (projectOid: string) => {
  const metadata = await getProjectMetadata(projectOid);
  const { latestProjectLink } = metadata.body;
  const response = await fetch(latestProjectLink+`?t=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} fetching project data`);
  }
  const data = await response.arrayBuffer();
  const url = new URL(latestProjectLink)
  return await decrypt(data, url.pathname.split('/').at(-1)!);
};

const loadProject = function () {
  let id = location.hash.substring(1).split(",")[0];
  if (id.length < 1 || !Number.isFinite(Number(id))) {
    id = projectInput.value;
  }
  getProjectData(id).then((data) => Scratch.vm.loadProject(data));
  return id;
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project file.
 */
const getProjectUrl = function (asset: { assetId: string }) {
  const assetIdParts = asset.assetId.split(".");
  const assetUrlParts = [
    PROJECT_SERVER,
    "internalapi/project/",
    assetIdParts[0],
    "/get/",
  ];
  if (assetIdParts[1]) {
    assetUrlParts.push(assetIdParts[1]);
  }
  return assetUrlParts.join("");
};

/**
 * @param {Asset} asset - calculate a URL for this asset.
 * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
 */
const getAssetUrl = function (asset: { assetId: any; dataFormat: any }) {
  const assetUrlParts = [
    ASSET_SERVER,
    "user_projects_assets/",
    asset.assetId,
    ".",
    asset.dataFormat,
  ];
  return assetUrlParts.join("");
};

class LoadingProgress {
  dataLoaded: number;
  contentTotal: number;
  contentComplete: number;
  hydrateTotal: number;
  hydrateComplete: number;
  memoryCurrent: number;
  memoryPeak: number;
  callback: any;
  constructor(callback: (progress: any) => void) {
    this.dataLoaded = 0;
    this.contentTotal = 0;
    this.contentComplete = 0;
    this.hydrateTotal = 0;
    this.hydrateComplete = 0;
    this.memoryCurrent = 0;
    this.memoryPeak = 0;
    this.callback = callback;
  }

  sampleMemory() {
    const memory = (window.performance as any)?.memory;
    if (memory) {
      this.memoryCurrent = memory.usedJSHeapSize;
      this.memoryPeak = Math.max(this.memoryCurrent, this.memoryPeak);
    }
  }

  attachHydrateMiddleware(
    middleware: LoadingMiddleware | ((args: any, next: any) => Promise<any>)[],
  ) {
    const _this = this;
    middleware.push((args: any, next: (arg0: any) => any) => {
      _this.hydrateTotal += 1;
      _this.sampleMemory();
      _this.callback(_this);
      return Promise.resolve(next(args)).then((value) => {
        _this.hydrateComplete += 1;
        _this.sampleMemory();
        _this.callback(_this);
        return value;
      });
    });
  }

  on(storage: ScratchStorage, vm: VirtualMachine) {
    const _this = this;

    this.attachHydrateMiddleware(costumeMiddleware);
    this.attachHydrateMiddleware(soundMiddleware);

    const _load = storage.webHelper.load;
    storage.webHelper.load = function (...args: any[]) {
      // Cast to any so the spread of dynamic args is accepted.
      const loadFn: any = _load;
      if (_this.dataLoaded === 0 && window.performance) {
        // Mark in browser inspectors how long it takes to load the
        // projects initial data file.
        performance.mark("Scratch.LoadDataStart");
      }

      const result = loadFn.call(this, ...args);

      if (_this.dataLoaded) {
        if (_this.contentTotal === 0 && window.performance) {
          performance.mark("Scratch.DownloadStart");
        }

        _this.contentTotal += 1;
      }
      _this.sampleMemory();
      _this.callback(_this);

      result.then(() => {
        if (_this.dataLoaded === 0) {
          if (window.performance) {
            // How long did loading the data file take?
            performance.mark("Scratch.LoadDataEnd");
            performance.measure(
              "Scratch.LoadData",
              "Scratch.LoadDataStart",
              "Scratch.LoadDataEnd",
            );
          }

          _this.dataLoaded = 1;

          window.ScratchVMLoadDataEnd = Date.now();
        } else {
          _this.contentComplete += 1;
        }

        if (
          _this.contentComplete &&
          _this.contentComplete === _this.contentTotal
        ) {
          if (window.performance) {
            // How long did it take to download the html, js, and
            // all the project assets?
            performance.mark("Scratch.DownloadEnd");
            performance.measure(
              "Scratch.Download",
              "Scratch.DownloadStart",
              "Scratch.DownloadEnd",
            );
          }

          window.ScratchVMDownloadEnd = Date.now();
        }

        _this.sampleMemory();
        _this.callback(_this);
      });
      return result;
    };
    vm.runtime.on(Runtime.PROJECT_LOADED, () => {
      // Currently LoadingProgress tracks when the data has been loaded
      // and not when the data has been decoded. It may be difficult to
      // track that but it isn't hard to track when its all been decoded.
      if (window.performance) {
        // How long did it take to load and hydrate the html, js, and
        // all the project assets?
        performance.mark("Scratch.LoadEnd");
        performance.measure(
          "Scratch.Load",
          "Scratch.LoadStart",
          "Scratch.LoadEnd",
        );
      }

      // Record when hydration completes using bracket notation to avoid
      // polluting the global Window type declaration.
      window["ScratchVMLoadEnd"] = Date.now();

      // With this event lets update LoadingProgress a final time so its
      // displayed loading time is accurate.
      _this.sampleMemory();
      _this.callback(_this);
    });
  }
}

class StatTable {
  table: any;
  constructor(options: { table: any; [key: string]: any }) {
    this.table = options.table;
  }

  // Subclasses override these to supply the rows/columns of the table.
  keys(): any[] {
    return [];
  }
  viewOf(_key: any): any {
    return null;
  }
  isSlow(_key: any, _frame?: any): boolean {
    return false;
  }

  render() {
    const table = this.table;
    Array.from(table.children).forEach((node) => table.removeChild(node));
    const keys = this.keys();
    for (const key of keys) {
      this.viewOf(key).render({
        table,
        isSlow: (frame: any) => this.isSlow(key, frame),
      });
    }
  }
}

class StatView {
  name: any;
  executions: number;
  selfTime: number;
  totalTime: number;
  constructor(name?: string) {
    this.name = name;
    this.executions = 0;
    this.selfTime = 0;
    this.totalTime = 0;
  }

  update(selfTime: number, totalTime: number, count: number) {
    this.executions += count;
    this.selfTime += selfTime;
    this.totalTime += totalTime;
  }

  render({ table, isSlow }) {
    const row = document.createElement("tr");
    let cell = document.createElement("td");
    cell.innerText = this.name;
    row.appendChild(cell);

    if (isSlow(this)) {
      row.setAttribute("class", "slow");
    }

    cell = document.createElement("td");
    cell.style.textAlign = "right";
    cell.innerText = "---";
    // Truncate selfTime. Value past the microsecond are floating point
    // noise.
    this.selfTime = Math.floor(this.selfTime * 1000) / 1000;
    if (this.selfTime > 0) {
      cell.innerText = (this.selfTime / 1000).toFixed(3);
    }
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.style.textAlign = "right";
    cell.innerText = "---";
    // Truncate totalTime. Value past the microsecond are floating point
    // noise.
    this.totalTime = Math.floor(this.totalTime * 1000) / 1000;
    if (this.totalTime > 0) {
      cell.innerText = (this.totalTime / 1000).toFixed(3);
    }
    row.appendChild(cell);

    cell = document.createElement("td");
    cell.style.textAlign = "right";
    cell.innerText = String(this.executions);
    row.appendChild(cell);

    table.appendChild(row);
  }
}

class RunningStats {
  stepThreadsInnerId: any;
  blockFunctionId: any;
  stpeThreadsId: any;
  recordedTime: number;
  executed: { steps: number; blocks: number };
  constructor(profiler: { idByName: (arg0: string) => any }) {
    this.stepThreadsInnerId = profiler.idByName("Sequencer.stepThreads#inner");
    this.blockFunctionId = profiler.idByName("blockFunction");
    this.stpeThreadsId = profiler.idByName("Sequencer.stepThreads");

    this.recordedTime = 0;
    this.executed = {
      steps: 0,
      blocks: 0,
    };
  }

  update(id: any, arg: any, selfTime: any, totalTime: number, count: number) {
    if (id === this.stpeThreadsId) {
      this.recordedTime += totalTime;
    } else if (id === this.stepThreadsInnerId) {
      this.executed.steps += count;
    } else if (id === this.blockFunctionId) {
      this.executed.blocks += count;
    }
  }
}

const WORK_TIME = 0.75;

class RunningStatsView {
  recordedTimeDom: any;
  stepsLoopedDom: any;
  blocksExecutedDom: any;
  maxRecordedTime: any;
  maxWorkedTime: number;
  runningStats: any;
  constructor({ runningStats, maxRecordedTime, dom }) {
    this.recordedTimeDom = dom.getElementsByClassName(
      "profile-count-amount-recorded",
    )[0];
    this.stepsLoopedDom = dom.getElementsByClassName(
      "profile-count-steps-looped",
    )[0];
    this.blocksExecutedDom = dom.getElementsByClassName(
      "profile-count-blocks-executed",
    )[0];

    this.maxRecordedTime = maxRecordedTime;
    this.maxWorkedTime = maxRecordedTime * WORK_TIME;
    this.runningStats = runningStats;
  }

  render() {
    const { runningStats, recordedTimeDom, stepsLoopedDom, blocksExecutedDom } =
      this;
    const { executed } = runningStats;
    const fractionWorked = runningStats.recordedTime / this.maxWorkedTime;
    recordedTimeDom.innerText = `${(fractionWorked * 100).toFixed(1)} %`;
    stepsLoopedDom.innerText = executed.steps;
    blocksExecutedDom.innerText = executed.blocks;
  }
}

class Frames {
  profiler: any;
  frames: StatView[];
  constructor(profiler: any) {
    this.profiler = profiler;

    this.frames = [];
  }

  update(id: number, arg: any, selfTime: any, totalTime: any, count: any) {
    if (id < 0) return;
    if (!this.frames[id]) {
      this.frames[id] = new StatView(this.profiler.nameById(id));
    }
    this.frames[id].update(selfTime, totalTime, count);
  }
}

const frameOrder = [
  "blockFunction",
  "execute",
  "Sequencer.stepThread",
  "Sequencer.stepThreads#inner",
  "Sequencer.stepThreads",
  "RenderWebGL.draw",
  "Runtime._step",
];

class FramesTable extends StatTable {
  profiler: any;
  frames: any;
  constructor(options: {
    table: any;
    profiler?: any;
    frames?: any;
    keys?: any;
    viewOf?: any;
    isSlow?: any;
  }) {
    super(options);

    this.profiler = options.profiler;
    this.frames = options.frames;
  }

  keys() {
    const keys = Object.keys(this.frames.frames).map((id) =>
      this.profiler.nameById(Number(id)),
    );
    keys.sort((a, b) => frameOrder.indexOf(a) - frameOrder.indexOf(b));
    return keys;
  }

  viewOf(key: any) {
    return this.frames.frames[this.profiler.idByName(key)];
  }

  isSlow() {
    return false;
  }
}

class Opcodes {
  blockFunctionId: any;
  opcodes: Record<string, StatView>;
  constructor(profiler: { idByName: (arg0: string) => any }) {
    this.blockFunctionId = profiler.idByName("blockFunction");

    this.opcodes = {};
  }

  update(
    id: any,
    arg: string | number,
    selfTime: any,
    totalTime: any,
    count: any,
  ) {
    if (id === this.blockFunctionId) {
      const key = String(arg);
      if (!this.opcodes[key]) {
        this.opcodes[key] = new StatView(key);
      }
      this.opcodes[key].update(selfTime, totalTime, count);
    }
  }
}

class OpcodeTable extends StatTable {
  profiler: any;
  opcodes: any;
  frames: any;
  constructor(options: {
    table: any;
    profiler?: any;
    opcodes?: any;
    frames?: any;
    keys?: any;
    viewOf?: any;
    isSlow?: any;
  }) {
    super(options);

    this.profiler = options.profiler;
    this.opcodes = options.opcodes;
    this.frames = options.frames;
  }

  keys() {
    const keys = Object.keys(this.opcodes.opcodes);
    keys.sort();
    return keys;
  }

  viewOf(key: string | number) {
    return this.opcodes.opcodes[key];
  }

  isSlow(key: string | number) {
    const blockFunctionTotalTime =
      this.frames.frames[this.profiler.idByName("blockFunction")].totalTime;
    const rowTotalTime = this.opcodes.opcodes[key].totalTime;
    const percentOfRun = rowTotalTime / blockFunctionTotalTime;
    return percentOfRun > SLOW;
  }
}

class ProfilerRun {
  vm: any;
  maxRecordedTime: any;
  warmUpTime: any;
  profiler: any;
  runningStats: RunningStats;
  runningStatsView: RunningStatsView;
  frames: Frames;
  frameTable: FramesTable;
  opcodes: Opcodes;
  opcodeTable: OpcodeTable;
  projectId: string = "";
  constructor({
    vm,
    maxRecordedTime,
    warmUpTime,
  }: {
    vm: VirtualMachine;
    maxRecordedTime?: number;
    warmUpTime?: number;
  }) {
    this.vm = vm;
    this.maxRecordedTime = maxRecordedTime;
    this.warmUpTime = warmUpTime;

    vm.runtime.enableProfiling();
    const profiler = (this.profiler = vm.runtime.profiler)!;
    vm.runtime.profiler = null;

    const runningStats = (this.runningStats = new RunningStats(profiler));
    const runningStatsView = (this.runningStatsView = new RunningStatsView({
      dom: document.getElementsByClassName("profile-count-group")[0],

      runningStats,
      maxRecordedTime,
    }));

    const frames = (this.frames = new Frames(profiler));
    this.frameTable = new FramesTable({
      table: document
        .getElementsByClassName("profile-count-frame-table")[0]
        .getElementsByTagName("tbody")[0],

      profiler,
      frames,
    });

    const opcodes = (this.opcodes = new Opcodes(profiler));
    this.opcodeTable = new OpcodeTable({
      table: document
        .getElementsByClassName("profile-count-opcode-table")[0]
        .getElementsByTagName("tbody")[0],

      profiler,
      opcodes,
      frames,
    });

    const stepId = profiler.idByName("Runtime._step");
    profiler.onFrame = ({ id, arg, selfTime, totalTime, count }) => {
      if (id === stepId) {
        runningStatsView.render();
      }

      runningStats.update(id, arg, selfTime, totalTime, count);
      opcodes.update(id, arg, selfTime, totalTime, count);
      frames.update(id, arg, selfTime, totalTime, count);
    };
  }

  run() {
    this.projectId = loadProject();

    window.parent.postMessage(
      {
        type: "BENCH_MESSAGE_LOADING",
      },
      "*",
    );

    this.vm.on("workspaceUpdate", () => {
      setTimeout(() => {
        window.parent.postMessage(
          {
            type: "BENCH_MESSAGE_WARMING_UP",
          },
          "*",
        );
        this.vm.greenFlag();
      }, 100);
      setTimeout(() => {
        window.parent.postMessage(
          {
            type: "BENCH_MESSAGE_ACTIVE",
          },
          "*",
        );
        this.vm.runtime.profiler = this.profiler;
      }, 100 + this.warmUpTime);
      setTimeout(
        () => {
          this.vm.stopAll();
          clearTimeout(this.vm.runtime._steppingInterval);
          this.vm.runtime.profiler = null;

          this.frameTable.render();
          this.opcodeTable.render();

          window.parent.postMessage(
            {
              type: "BENCH_MESSAGE_COMPLETE",
              frames: this.frames.frames,
              opcodes: this.opcodes.opcodes,
            },
            "*",
          );

          setShareLink({
            fixture: {
              projectId: this.projectId,
              warmUpTime: this.warmUpTime,
              recordingTime: this.maxRecordedTime,
            },
            frames: this.frames.frames,
            opcodes: this.opcodes.opcodes,
          });
        },
        100 + this.warmUpTime + this.maxRecordedTime,
      );
    });
  }

  render(json: { frames?: any; opcodes?: any; fixture?: any }) {
    const { fixture } = json;
    (document.querySelector("[type=text]") as HTMLInputElement).value = [
      fixture.projectId,
      fixture.warmUpTime,
      fixture.recordingTime,
    ].join(",");

    this.frames.frames = json.frames.map((frame: { name: any }) =>
      Object.assign(new StatView(), frame, {
        name: this.profiler.nameById(this.profiler.idByName(frame.name)),
      }),
    );

    this.opcodes.opcodes = {};
    Object.entries(json.opcodes).forEach(([opcode, data]) => {
      this.opcodes.opcodes[opcode] = Object.assign(new StatView(), data);
    });

    this.frameTable.render();
    this.opcodeTable.render();
  }
}

/**
 * Run the benchmark with given parameters in the location's hash field or
 * using defaults.
 */
const runBenchmark = function () {
  // Lots of global variables to make debugging easier
  // Instantiate the VM.
  const vm = new VirtualMachine();
  Scratch.vm = vm;

  vm.setCompilerOptions({
    enabled: enableCompiler,
  });
  vm.setTurboMode(true);

  const storage = new ScratchStorage();
  const AssetType = storage.AssetType;
  storage.addWebSource([AssetType.Project], getProjectUrl);
  storage.addWebSource(
    [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
    getAssetUrl,
  );
  vm.attachStorage(storage);

  new LoadingProgress(
    (progress: {
      dataLoaded: any;
      contentTotal: any;
      contentComplete: any;
      hydrateTotal: any;
      hydrateComplete: any;
      memoryPeak: number;
      memoryCurrent: number;
    }) => {
      const setElement = (name: string, value: string | number) => {
        const el = document.getElementsByClassName(name)[0] as HTMLElement;
        if (el) {
          el.innerText = String(value);
        }
      };
      const sinceLoadStart = (key: string) =>
        `(${(window[key] || Date.now()) - window.ScratchVMLoadStart}ms)`;

      setElement("loading-total", 1);
      setElement("loading-complete", progress.dataLoaded);
      setElement("loading-time", sinceLoadStart("ScratchVMLoadDataEnd"));

      setElement("loading-content-total", progress.contentTotal);
      setElement("loading-content-complete", progress.contentComplete);
      setElement(
        "loading-content-time",
        sinceLoadStart("ScratchVMDownloadEnd"),
      );

      setElement("loading-hydrate-total", progress.hydrateTotal);
      setElement("loading-hydrate-complete", progress.hydrateComplete);
      setElement("loading-hydrate-time", sinceLoadStart("ScratchVMLoadEnd"));

      if (progress.memoryPeak) {
        setElement(
          "loading-memory-current",
          `${(progress.memoryCurrent / 1000000).toFixed(0)}MB`,
        );
        setElement(
          "loading-memory-peak",
          `${(progress.memoryPeak / 1000000).toFixed(0)}MB`,
        );
      }
    },
  ).on(storage, vm);

  let warmUpTime = 4000;
  let maxRecordedTime = 100000;

  new ProfilerRun({
    vm,
    warmUpTime,
    maxRecordedTime,
  }).run();

  // Instantiate the renderer and connect it to the VM.
  const canvas = document.getElementById("scratch-stage") as HTMLCanvasElement;
  const renderer = new ScratchRender(canvas);
  Scratch.renderer = renderer;
  vm.attachRenderer(renderer);
  const audioEngine = new AudioEngine();
  vm.attachAudioEngine(audioEngine);
  // vm.attachV2BitmapAdapter(new ScratchSVGRenderer.BitmapAdapter());

  // Feed mouse events as VM I/O events.
  document.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const coordinates = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };
    Scratch.vm.postIOData("mouse", coordinates);
  });
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };
    Scratch.vm.postIOData("mouse", data);
    e.preventDefault();
  });
  canvas.addEventListener("mouseup", (e) => {
    const rect = canvas.getBoundingClientRect();
    const data = {
      isDown: false,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };
    Scratch.vm.postIOData("mouse", data);
    e.preventDefault();
  });

  // Feed keyboard events as VM I/O events.
  document.addEventListener("keydown", (e) => {
    // Don't capture keys intended for Blockly inputs.
    if (e.target !== document && e.target !== document.body) {
      return;
    }
    Scratch.vm.postIOData("keyboard", {
      keyCode: e.keyCode,
      isDown: true,
    });
    e.preventDefault();
  });
  document.addEventListener("keyup", (e) => {
    // Always capture up events,
    // even those that have switched to other targets.
    Scratch.vm.postIOData("keyboard", {
      keyCode: e.keyCode,
      isDown: false,
    });
    // E.g., prevent scroll.
    if (e.target !== document && e.target !== document.body) {
      e.preventDefault();
    }
  });

  // Run threads
  vm.start();
};

/**
 * Render previously run benchmark data.
 * @param {object} json data from a previous benchmark run.
 */
const renderBenchmarkData = function (json: any) {
  const vm = new VirtualMachine();
  new ProfilerRun({ vm }).render(json);
  setShareLink(json);
};

const onload = function () {
  if (location.hash.substring(1).startsWith("view")) {
    document.body.className = "render";
    const data = location.hash.substring(6);
    const frozen = atob(data);
    const json = JSON.parse(frozen);
    renderBenchmarkData(json);
  } else {
    runBenchmark();
  }
};

window.onhashchange = function () {
  location.reload();
};

if (window.performance) {
  performance.mark("Scratch.EvalEnd");
  performance.measure("Scratch.Eval", "Scratch.EvalStart", "Scratch.EvalEnd");
}

window.ScratchVMEvalEnd = Date.now();

onload();
