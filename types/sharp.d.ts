declare module "sharp" {
  import type { Sharp, SharpOptions } from "sharp/lib";

  function sharp(
    input?: string | Buffer | ArrayBufferView,
    options?: SharpOptions
  ): Sharp;

  export = sharp;
  export default sharp;
}
