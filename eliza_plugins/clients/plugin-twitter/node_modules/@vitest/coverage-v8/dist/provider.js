import { existsSync, promises, writeFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import v8ToIstanbul from 'v8-to-istanbul';
import { mergeProcessCovs } from '@bcoe/v8-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import libCoverage from 'istanbul-lib-coverage';
import libSourceMaps from 'istanbul-lib-source-maps';
import MagicString from 'magic-string';
import { parseModule } from 'magicast';
import remapping from '@ampproject/remapping';
import c from 'picocolors';
import { provider } from 'std-env';
import createDebug from 'debug';
import { builtinModules } from 'node:module';
import { coverageConfigDefaults, defaultExclude, defaultInclude } from 'vitest/config';
import { BaseCoverageProvider } from 'vitest/coverage';
import _TestExclude from 'test-exclude';

function normalizeWindowsPath(input = "") {
  if (!input || !input.includes("\\")) {
    return input;
  }
  return input.replace(/\\/g, "/");
}

const _UNC_REGEX = /^[/\\]{2}/;
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
const normalize = function(path) {
  if (path.length === 0) {
    return ".";
  }
  path = normalizeWindowsPath(path);
  const isUNCPath = path.match(_UNC_REGEX);
  const isPathAbsolute = isAbsolute(path);
  const trailingSeparator = path[path.length - 1] === "/";
  path = normalizeString(path, !isPathAbsolute);
  if (path.length === 0) {
    if (isPathAbsolute) {
      return "/";
    }
    return trailingSeparator ? "./" : ".";
  }
  if (trailingSeparator) {
    path += "/";
  }
  if (_DRIVE_LETTER_RE.test(path)) {
    path += "/";
  }
  if (isUNCPath) {
    if (!isPathAbsolute) {
      return `//./${path}`;
    }
    return `//${path}`;
  }
  return isPathAbsolute && !isAbsolute(path) ? `/${path}` : path;
};
function cwd() {
  if (typeof process !== "undefined") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};

const isWindows = process.platform === "win32";
const drive = isWindows ? process.cwd()[0] : null;
drive ? drive === drive.toUpperCase() ? drive.toLowerCase() : drive.toUpperCase() : null;
const queryRE = /\?.*$/s;
const hashRE = /#.*$/s;
function cleanUrl(url) {
  return url.replace(hashRE, "").replace(queryRE, "");
}
/* @__PURE__ */ new Set([
  ...builtinModules,
  "assert/strict",
  "diagnostics_channel",
  "dns/promises",
  "fs/promises",
  "path/posix",
  "path/win32",
  "readline/promises",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "timers/promises",
  "util/types",
  "wasi"
]);

const WRAPPER_LENGTH = 185;
const VITE_EXPORTS_LINE_PATTERN = /Object\.defineProperty\(__vite_ssr_exports__.*\n/g;
const DEFAULT_PROJECT = Symbol.for("default-project");
const debug = createDebug("vitest:coverage");
let uniqueId = 0;
class V8CoverageProvider extends BaseCoverageProvider {
  name = "v8";
  ctx;
  options;
  testExclude;
  coverageFiles = /* @__PURE__ */ new Map();
  coverageFilesDirectory;
  pendingPromises = [];
  initialize(ctx) {
    const config = ctx.config.coverage;
    this.ctx = ctx;
    this.options = {
      ...coverageConfigDefaults,
      // User's options
      ...config,
      // Resolved fields
      provider: "v8",
      reporter: this.resolveReporters(config.reporter || coverageConfigDefaults.reporter),
      reportsDirectory: resolve(ctx.config.root, config.reportsDirectory || coverageConfigDefaults.reportsDirectory),
      thresholds: config.thresholds && {
        ...config.thresholds,
        lines: config.thresholds["100"] ? 100 : config.thresholds.lines,
        branches: config.thresholds["100"] ? 100 : config.thresholds.branches,
        functions: config.thresholds["100"] ? 100 : config.thresholds.functions,
        statements: config.thresholds["100"] ? 100 : config.thresholds.statements
      }
    };
    this.testExclude = new _TestExclude({
      cwd: ctx.config.root,
      include: typeof this.options.include === "undefined" ? void 0 : [...this.options.include],
      exclude: [...defaultExclude, ...defaultInclude, ...this.options.exclude],
      excludeNodeModules: true,
      extension: this.options.extension,
      relativePath: !this.options.allowExternal
    });
    this.coverageFilesDirectory = resolve(this.options.reportsDirectory, ".tmp");
  }
  resolveOptions() {
    return this.options;
  }
  async clean(clean = true) {
    if (clean && existsSync(this.options.reportsDirectory))
      await promises.rm(this.options.reportsDirectory, { recursive: true, force: true, maxRetries: 10 });
    if (existsSync(this.coverageFilesDirectory))
      await promises.rm(this.coverageFilesDirectory, { recursive: true, force: true, maxRetries: 10 });
    await promises.mkdir(this.coverageFilesDirectory, { recursive: true });
    this.coverageFiles = /* @__PURE__ */ new Map();
    this.pendingPromises = [];
  }
  /*
   * Coverage and meta information passed from Vitest runners.
   * Note that adding new entries here and requiring on those without
   * backwards compatibility is a breaking change.
   */
  onAfterSuiteRun({ coverage, transformMode, projectName }) {
    if (transformMode !== "web" && transformMode !== "ssr")
      throw new Error(`Invalid transform mode: ${transformMode}`);
    let entry = this.coverageFiles.get(projectName || DEFAULT_PROJECT);
    if (!entry) {
      entry = { web: [], ssr: [] };
      this.coverageFiles.set(projectName || DEFAULT_PROJECT, entry);
    }
    const filename = resolve(this.coverageFilesDirectory, `coverage-${uniqueId++}.json`);
    entry[transformMode].push(filename);
    const promise = promises.writeFile(filename, JSON.stringify(coverage), "utf-8");
    this.pendingPromises.push(promise);
  }
  async reportCoverage({ allTestsRun } = {}) {
    if (provider === "stackblitz")
      this.ctx.logger.log(c.blue(" % ") + c.yellow("@vitest/coverage-v8 does not work on Stackblitz. Report will be empty."));
    const coverageMap = libCoverage.createCoverageMap({});
    let index = 0;
    const total = this.pendingPromises.length;
    await Promise.all(this.pendingPromises);
    this.pendingPromises = [];
    for (const [projectName, coveragePerProject] of this.coverageFiles.entries()) {
      for (const [transformMode, filenames] of Object.entries(coveragePerProject)) {
        let merged = { result: [] };
        for (const chunk of toSlices(filenames, this.options.processingConcurrency)) {
          if (debug.enabled) {
            index += chunk.length;
            debug("Covered files %d/%d", index, total);
          }
          await Promise.all(chunk.map(async (filename) => {
            const contents = await promises.readFile(filename, "utf-8");
            const coverage = JSON.parse(contents);
            merged = mergeProcessCovs([merged, coverage]);
          }));
        }
        const converted = await this.convertCoverage(merged, projectName, transformMode);
        const transformedCoverage = await transformCoverage(converted);
        coverageMap.merge(transformedCoverage);
      }
    }
    if (this.options.all && allTestsRun) {
      const coveredFiles = coverageMap.files();
      const untestedCoverage = await this.getUntestedFiles(coveredFiles);
      const converted = await this.convertCoverage(untestedCoverage);
      coverageMap.merge(await transformCoverage(converted));
    }
    const context = libReport.createContext({
      dir: this.options.reportsDirectory,
      coverageMap,
      watermarks: this.options.watermarks
    });
    if (hasTerminalReporter(this.options.reporter))
      this.ctx.logger.log(c.blue(" % ") + c.dim("Coverage report from ") + c.yellow(this.name));
    for (const reporter of this.options.reporter) {
      reports.create(reporter[0], {
        skipFull: this.options.skipFull,
        projectRoot: this.ctx.config.root,
        ...reporter[1]
      }).execute(context);
    }
    if (this.options.thresholds) {
      const resolvedThresholds = this.resolveThresholds({
        coverageMap,
        thresholds: this.options.thresholds,
        createCoverageMap: () => libCoverage.createCoverageMap({})
      });
      this.checkThresholds({
        thresholds: resolvedThresholds,
        perFile: this.options.thresholds.perFile
      });
      if (this.options.thresholds.autoUpdate && allTestsRun) {
        if (!this.ctx.server.config.configFile)
          throw new Error('Missing configurationFile. The "coverage.thresholds.autoUpdate" can only be enabled when configuration file is used.');
        const configFilePath = this.ctx.server.config.configFile;
        const configModule = parseModule(await promises.readFile(configFilePath, "utf8"));
        this.updateThresholds({
          thresholds: resolvedThresholds,
          perFile: this.options.thresholds.perFile,
          configurationFile: {
            write: () => writeFileSync(configFilePath, configModule.generate().code, "utf-8"),
            read: () => configModule.exports.default.$type === "function-call" ? configModule.exports.default.$args[0] : configModule.exports.default
          }
        });
      }
      this.coverageFiles = /* @__PURE__ */ new Map();
      await promises.rm(this.coverageFilesDirectory, { recursive: true });
    }
  }
  async getUntestedFiles(testedFiles) {
    const transformResults = normalizeTransformResults(this.ctx.vitenode.fetchCache);
    const includedFiles = await this.testExclude.glob(this.ctx.config.root);
    const uncoveredFiles = includedFiles.map((file) => pathToFileURL(resolve(this.ctx.config.root, file))).filter((file) => !testedFiles.includes(file.pathname));
    let merged = { result: [] };
    let index = 0;
    for (const chunk of toSlices(uncoveredFiles, this.options.processingConcurrency)) {
      if (debug.enabled) {
        index += chunk.length;
        debug("Uncovered files %d/%d", index, uncoveredFiles.length);
      }
      const coverages = await Promise.all(chunk.map(async (filename) => {
        const { source } = await this.getSources(filename.href, transformResults);
        const coverage = {
          url: filename.href,
          scriptId: "0",
          // Create a made up function to mark whole file as uncovered. Note that this does not exist in source maps.
          functions: [{
            ranges: [{
              startOffset: 0,
              endOffset: source.length,
              count: 0
            }],
            isBlockCoverage: true,
            // This is magical value that indicates an empty report: https://github.com/istanbuljs/v8-to-istanbul/blob/fca5e6a9e6ef38a9cdc3a178d5a6cf9ef82e6cab/lib/v8-to-istanbul.js#LL131C40-L131C40
            functionName: "(empty-report)"
          }]
        };
        return { result: [coverage] };
      }));
      merged = mergeProcessCovs([merged, ...coverages]);
    }
    return merged;
  }
  async getSources(url, transformResults, functions = []) {
    const filePath = normalize(fileURLToPath(url));
    const transformResult = transformResults.get(filePath);
    const map = transformResult?.map;
    const code = transformResult?.code;
    const sourcesContent = map?.sourcesContent?.[0] || await promises.readFile(filePath, "utf-8").catch(() => {
      const length = findLongestFunctionLength(functions);
      return ".".repeat(length);
    });
    if (!map)
      return { source: code || sourcesContent };
    return {
      originalSource: sourcesContent,
      source: code || sourcesContent,
      sourceMap: {
        sourcemap: removeViteHelpersFromSourceMaps(code, {
          ...map,
          version: 3,
          sources: [url],
          sourcesContent: [sourcesContent]
        })
      }
    };
  }
  async convertCoverage(coverage, projectName, transformMode) {
    const viteNode = this.ctx.projects.find((project) => project.getName() === projectName)?.vitenode || this.ctx.vitenode;
    const fetchCache = transformMode ? viteNode.fetchCaches[transformMode] : viteNode.fetchCache;
    const transformResults = normalizeTransformResults(fetchCache);
    const scriptCoverages = coverage.result.filter((result) => this.testExclude.shouldInstrument(fileURLToPath(result.url)));
    const coverageMap = libCoverage.createCoverageMap({});
    let index = 0;
    for (const chunk of toSlices(scriptCoverages, this.options.processingConcurrency)) {
      if (debug.enabled) {
        index += chunk.length;
        debug("Converting %d/%d", index, scriptCoverages.length);
      }
      await Promise.all(chunk.map(async ({ url, functions }) => {
        const sources = await this.getSources(url, transformResults, functions);
        const wrapperLength = sources.sourceMap ? WRAPPER_LENGTH : 0;
        const converter = v8ToIstanbul(url, wrapperLength, sources);
        await converter.load();
        converter.applyCoverage(functions);
        coverageMap.merge(converter.toIstanbul());
      }));
    }
    return coverageMap;
  }
}
async function transformCoverage(coverageMap) {
  const sourceMapStore = libSourceMaps.createSourceMapStore();
  return await sourceMapStore.transformCoverage(coverageMap);
}
function removeViteHelpersFromSourceMaps(source, map) {
  if (!source || !source.match(VITE_EXPORTS_LINE_PATTERN))
    return map;
  const sourceWithoutHelpers = new MagicString(source);
  sourceWithoutHelpers.replaceAll(VITE_EXPORTS_LINE_PATTERN, "\n");
  const mapWithoutHelpers = sourceWithoutHelpers.generateMap({
    hires: "boundary"
  });
  const combinedMap = remapping(
    [{ ...mapWithoutHelpers, version: 3 }, map],
    () => null
  );
  return combinedMap;
}
function findLongestFunctionLength(functions) {
  return functions.reduce((previous, current) => {
    const maxEndOffset = current.ranges.reduce((endOffset, range) => Math.max(endOffset, range.endOffset), 0);
    return Math.max(previous, maxEndOffset);
  }, 0);
}
function normalizeTransformResults(fetchCache) {
  const normalized = /* @__PURE__ */ new Map();
  for (const [key, value] of fetchCache.entries()) {
    const cleanEntry = cleanUrl(key);
    if (!normalized.has(cleanEntry))
      normalized.set(cleanEntry, value.result);
  }
  return normalized;
}
function hasTerminalReporter(reporters) {
  return reporters.some(([reporter]) => reporter === "text" || reporter === "text-summary" || reporter === "text-lcov" || reporter === "teamcity");
}
function toSlices(array, size) {
  return array.reduce((chunks, item) => {
    const index = Math.max(0, chunks.length - 1);
    const lastChunk = chunks[index] || [];
    chunks[index] = lastChunk;
    if (lastChunk.length >= size)
      chunks.push([item]);
    else
      lastChunk.push(item);
    return chunks;
  }, []);
}

export { V8CoverageProvider };
