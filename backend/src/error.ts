export class ParseError extends Error {
  line: number;
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.name = 'ParseError';
  }
}

export class RuntimeError extends Error {
  line: number;
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.name = 'RuntimeError';
  }
}
