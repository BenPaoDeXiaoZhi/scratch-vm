// // @ts-expect-error - webpack/lib/SingleEntryPlugin has no type declarations
// import SingleEntryPlugin from "webpack/lib/SingleEntryPlugin";

// // Based on https://github.com/webpack-contrib/worker-loader/tree/v2.0.0

// interface WebpackLoaderContext {
//     target: string;
//     cacheable: (flag?: boolean) => void;
//     async: () => (err: Error | null, source?: string) => void;
//     _compilation: any;
//     context: string;
// }

// export default {
//   pitch: function (this: WebpackLoaderContext, request: string) {
//     // Technically this loader does work in other environments, but our use case does not want that.
//     if (this.target !== "web") {
//       return 'throw new Error("Not supported in non-web environment");';
//     }
//     this.cacheable(false);
//     const callback = this.async();
//     const compiler = this._compilation.createChildCompiler(
//       "extension worker",
//       {},
//     );
//     new SingleEntryPlugin(
//       this.context,
//       `!!${request}`,
//       "extension worker",
//     ).apply(compiler);
//     compiler.runAsChild((err: Error | null, entries: any[], compilation: any) => {
//       if (err) return callback(err);
//       const file = entries[0].files[0];
//       const source = `module.exports = `${JSON.stringify(compilation.assets[file].source())}`;`;
//       return callback(null, source);
//     });
//   },
// };
