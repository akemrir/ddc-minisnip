import {
  BaseSource,
  DdcEvent,
  Item
} from "https://deno.land/x/ddc_vim@v2.3.0/types.ts";
import {
  GatherArguments,
  OnEventArguments
} from "https://deno.land/x/ddc_vim@v2.3.0/base/source.ts";
import { fn } from "https://deno.land/x/ddc_vim@v2.3.0/deps.ts";

import { exists, expandGlob } from "https://deno.land/std@0.142.0/fs/mod.ts";
import { parse } from "https://deno.land/std@0.142.0/path/mod.ts";
import dir from "https://deno.land/x/dir@1.4.0/mod.ts";
const homeDirectory = dir("home");

const getSnip = (fileName: string): Promise<Array<string>> => {
  const decoder = new TextDecoder("utf-8");
  const text: string = decoder.decode(Deno.readFileSync(fileName));
  return text.split("\n");
};

const prepareSnip = (path: string) => {
  const parsed = parse(path);
  const contents = getSnip(path);
  return { word: parsed.name, menu: contents[0].replace(/^\? /, '') };
};

type snipCache = {
  mtime: Date | null;
  candidates: Item[];
};

export function isUpper(char: string) {
  return /[A-Z]/.test(char[0]);
}

type Params = {
  dirs: string[];
  home: string;
  smartcase: boolean;
  showMenu: boolean;
};

export class Source extends BaseSource<Params> {
  private cache: { [filename: string]: snipCache } = {};
  private snips: string[] = [];
  events = ["InsertEnter"] as DdcEvent[];

  private getSnips(snipOpt: string): string[] {
    if (snipOpt) {
      return snipOpt.split(",");
    } else {
      return [];
    }
  }

  private makeCache(): void {
    if (!this.snips) {
      return;
    }
    // console.table(this.snips);
    for (const snipFile of this.snips) {
      const mtime = Deno.statSync(snipFile).mtime;
      // console.log({ snipFile, cached: snipFile in this.cache, m: mtime.getTime() });
      if (
        snipFile in this.cache &&
        this.cache[snipFile].mtime?.getTime() == mtime?.getTime()
      ) {
        continue;
      }
      const snip = prepareSnip(snipFile);
      this.cache[snipFile] = {
        mtime: mtime,
        candidates: [snip]
      };
    }
  }

  async onInit(args: GatherArguments<Params>): Promise<void> {
    await this.onEvent(args);
  }

  async onEvent({
    denops,
    sourceParams
  }: OnEventArguments<Params>): Promise<void> {
    const bufnr = await fn.bufnr(denops);
    // console.log({ bufnr });
    this.snips = [];
    this.filetype = await fn.getbufvar(denops, bufnr, "&filetype") as string;
    this.dirs = sourceParams.dirs as string[];

    // console.log('onEvent ' + this.filetype);
    for (const dir of this.dirs) {
      for await (const file of expandGlob(`${dir}/all/*.snip`)) {
        // console.log('all');
        // console.log(file);
        if (this.snips[file.path] == undefined) {
          this.snips.push(file.path);
        }
      }

      if (this.filetype != '') {
        const dirPath = `${dir}/${this.filetype}`;
        const snipGlob = `${dirPath}/*.snip`;
        let isThere = await exists(dirPath);
        // console.log({ isThere, dirPath, snipGlob });

        for await (const file of expandGlob(snipGlob)) {
          // console.log('filetype ' + this.filetype);
          // console.log(file);
          if (this.snips[file.path] == undefined) {
            this.snips.push(file.path);
          }
        }
      }
    };
    // debugger;
    // console.table(this.dirs);
    // console.table(this.snips);

    this.makeCache();
  }

  async gather({
    completeStr,
    sourceParams
  }: GatherArguments<Params>): Promise<Item[]> {
    if (!this.snips) {
      return [];
    }

    const str = completeStr;
    const isFirstUpper = str.length ? isUpper(str[0]) : false;
    const isSecondUpper = str.length > 1 ? isUpper(str[1]) : false;
    return this.snips
      .map((snip) => this.cache[snip].candidates)
      .flatMap((candidates) => candidates)
      .map((candidate) => {
        let word = candidate.word;
        if (sourceParams.smartcase) {
          if (isSecondUpper) return { word: candidate.word.toUpperCase() };
          if (isFirstUpper) {
            word = candidate.word.replace(/^./, (m) => m.toUpperCase());
          }
        }
        return {
          word: word,
          menu: sourceParams.showMenu ? candidate.menu : ""
        };
      });
  }

  params(): Params {
    return {
      dirs: [],
      home: "",
      smartcase: true,
      showMenu: true
    };
  }
}
