import fs from "fs";
import path from "path";
import { log } from "./log.js";

export class FrameworkDocs {
  private static readonly DOCS_PATH = path.join("src", "docs", "frameworks");

  static async getFrameworkDocs(framework: string): Promise<string | null> {
    try {
      const readmePath = path.join(this.DOCS_PATH, framework, "README.md");
      log("verbose", `Reading docs from: ${readmePath}`);

      const content = await fs.promises.readFile(readmePath, "utf-8");
      log("verbose", `Successfully read framework docs for ${framework}`);
      return content;
    } catch (error) {
      log("verbose", `Error reading framework docs: ${error}`);
      return null;
    }
  }

  static getAvailableFrameworks(): string[] {
    try {
      return fs
        .readdirSync(this.DOCS_PATH)
        .filter((dir) =>
          fs.statSync(path.join(this.DOCS_PATH, dir)).isDirectory()
        );
    } catch (error) {
      log("verbose", `Error reading frameworks directory: ${error}`);
      return [];
    }
  }
}
