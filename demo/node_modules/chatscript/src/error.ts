/**
 * 解析错误类，用于表示脚本解析过程中发生的错误
 * @extends Error
 * @group Errors
 */
export class ParseError extends Error {
  /**
   * 错误发生的行号
   */
  line: number;

  /**
   * @param line - 错误发生的行号
   * @param message - 错误信息
   */
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.name = 'ParseError';
  }
}

/**
 * 运行时错误类，用于表示脚本执行过程中发生的错误
 * @extends Error
 * @group Errors
 */
export class RuntimeError extends Error {
  /**
   * 错误发生的行号
   */
  line: number;

  /**
   * @param line - 错误发生的行号
   * @param message - 错误信息
   */
  constructor(line: number, message: string) {
    super(message);
    this.line = line;
    this.name = 'RuntimeError';
  }
}
