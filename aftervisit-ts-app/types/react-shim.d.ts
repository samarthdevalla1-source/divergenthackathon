declare module "react" {
  export type ReactNode = unknown;
  export type FC<P = object> = (props: P) => JSX.Element | null;

  export type SetStateAction<S> = S | ((prevState: S) => S);

  export type Dispatch<A> = (value: A) => void;

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}
