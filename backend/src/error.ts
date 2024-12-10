export class ParseError {
  line: number;
  message: string;
  name: string = 'ParseError';
  constructor(line: number, message: string) {
    this.line = line;
    this.message = message;
  }
}

export class RuntimeError {
  line: number;
  message: string;
  name: string = 'RuntimeError';
  constructor(line: number, message: string) {
    this.line = line;
    this.message = message;
  }
}
