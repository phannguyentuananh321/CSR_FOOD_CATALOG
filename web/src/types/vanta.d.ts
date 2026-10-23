declare module 'vanta/dist/vanta.birds.min' {
  export interface VantaEffect {
    destroy(): void;
    resize(): void;
  }

  export interface VantaBirdsOptions {
    el: HTMLElement;
    THREE: unknown;
    [key: string]: unknown;
  }

  const BIRDS: (options: VantaBirdsOptions) => VantaEffect;
  export default BIRDS;
}
