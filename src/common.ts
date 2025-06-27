const originWarn = (...args: any[]) => console.warn('[ReflectDeep]', ...args);
export const common = {
  warn: originWarn,
  setShowWarn: (value: boolean) => {
    config.showWarn = value;
    common.warn = value ? originWarn : (...args: any[]) => {};
  },
};

export const config = {
  showWarn: true,
};
