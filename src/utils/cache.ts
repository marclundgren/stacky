import fs from "fs";
import path from "path";
import crypto from "crypto";

export class Cache {
  private cachePath: string;

  constructor(filename: string = "ai-responses.json") {
    this.cachePath = path.join(process.cwd(), ".cache", filename);
    this.ensureCacheExists();
  }

  private ensureCacheExists(): void {
    const dir = path.dirname(this.cachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.cachePath)) {
      fs.writeFileSync(this.cachePath, "{}");
    }
  }

  private generateKey(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash("md5").update(str).digest("hex");
  }

  get(key: any): any | null {
    const hash = this.generateKey(key);
    const cache = JSON.parse(fs.readFileSync(this.cachePath, "utf8"));
    return cache[hash] || null;
  }

  set(key: any, value: any): void {
    const hash = this.generateKey(key);
    const cache = JSON.parse(fs.readFileSync(this.cachePath, "utf8"));
    cache[hash] = value;
    fs.writeFileSync(this.cachePath, JSON.stringify(cache, null, 2));
  }
}
