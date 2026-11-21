export interface PiperPhonemizeOptions {
  print: (line: string) => void;
  printErr: (message: string) => void;
  locateFile: (name: string) => string;
}

export interface PiperPhonemizeModule {
  callMain(args: string[]): void;
}

export function createPiperPhonemize(options: PiperPhonemizeOptions): Promise<PiperPhonemizeModule>;
