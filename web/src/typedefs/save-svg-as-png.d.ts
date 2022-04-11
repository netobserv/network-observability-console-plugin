/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'save-svg-as-png' {
  export function download(name: any, uri: any, options: any): any;

  export function prepareSvg(el: any, options: any, done: any): any;

  export function saveSvg(el: any, name: any, options: any): any;

  export function saveSvgAsPng(el: any, name: any, options?: any): any;

  export function svgAsDataUri(el: any, options: any, done: any): any;

  export function svgAsPngUri(el: any, options: any, done: any): any;
}
