const warn = (...args: any[]) => console.warn('[ReflectDeep]', ...args);
export const log = {
  warn,
};

export const config = {
  showWarn: true,
  setShowWarn: (value: boolean) => {
    config.showWarn = value;
    log.warn = value ? warn : (...args: any[]) => {};
  },
  deepSetOpt: {
    mergeStrategy: 'replace',
  } as DeepSetOptions,
};

export type DeepSetOptions = {
  /**
   * When both `old` and `new` are objects, this option determines how to merge them.
   * - `replace` (default): Replaces `old` with `new`.
   * - `nullish`: Only override when the old value is `null` or `undefined`.
   * - `keep-old`: Keep the old value if it exists, otherwise use the new value.
   * - `keep-new`: Keep the new value if it exists, otherwise use the old value.
   */
  mergeStrategy: 'replace' | 'nullish' | 'keep-old' | 'keep-new';
};
