export class ParseError extends Error {
  line: number;
  message: string;
  name: string = 'ParseError';
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.message = message;
  }
  toString(): string {
    return `${this.name}: ${this.message} at line ${this.line}`;
  }
  toJSON() {
    return {
      name: this.name,
      line: this.line,
      message: this.message,
    }
  }
}

export class RuntimeError extends Error {
  line: number;
  message: string;
  name: string = 'RuntimeError';
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.message = message;
  }
  toString(): string {
    return `${this.name}: ${this.message} at line ${this.line}`;
  }
}
