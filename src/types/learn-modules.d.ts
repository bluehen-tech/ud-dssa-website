declare module '*.md' {
  const content: string;
  export default content;
}

interface NodeRequire {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): {
    keys(): string[];
    (id: string): unknown;
  };
}
