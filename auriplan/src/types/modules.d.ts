// Type declarations for modules without types

declare module '*.glb' {
  const content: string;
  export default content;
}

declare module '*.gltf' {
  const content: string;
  export default content;
}

declare module '*.obj' {
  const content: string;
  export default content;
}

declare module '*.fbx' {
  const content: string;
  export default content;
}

declare module '*.dae' {
  const content: string;
  export default content;
}

declare module 'vitest' {
  export const vi: any;
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const beforeEach: any;
  export const afterEach: any;
}
