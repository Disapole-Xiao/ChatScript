export class ParseError {
  line: number;
  message: string;
  name: string = 'ParseError';
  constructor(line: number, message: string) {
    this.line = line;
    this.message = message;
  }
  toString(): string {
    return `${this.name}: line ${this.line}: ${this.message}`;
  }
  toJSON() {
    return {
      name: this.name,
      line: this.line,
      message: this.message,
    }
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
  toString(): string {
    return `${this.name}: line ${this.line}: ${this.message}`;
  }
}
