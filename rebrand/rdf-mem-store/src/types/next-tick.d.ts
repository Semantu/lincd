declare module 'next-tick' {
  const nextTick: (fn: () => void) => void;
  export default nextTick;
}
