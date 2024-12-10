/**
   * 将一行文本分割为单词块，并忽略行尾注释
   * 
   * `"`和 `/` 包裹的字符串和正则表达式视为一个单词块
   * 
   * @param line 一行
   * @returns 单词块数组
   * @example splitWords('some word "a string#" /a regex #/ # comment')
   * // => ['some', 'word', '"a string#"', '/a regex #/']
   */
function splitWords(line: string): string[] {
    const words: string[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
      let char = line[i];

      // 跳过空格
      if (char === ' ') {
        i++;
        continue;
      }

      // 处理注释 # 到行末
      if (char === '#') {
        break;
      }

      // 处理双引号中的单词
      if (char === '"') {
        let word = '';
        i++; // 跳过开头的双引号
        while (i < len && line[i] !== '"') {
          word += line[i];
          i++;
        }
        if (i >= len || line[i] !== '"') {
          throw new Error('Unmatched double quote');
        }
        words.push(word);
        i++; // 跳过结束的双引号
        continue;
      }

      // 处理正则表达式 / 到下一个 /
      if (char === '/') {
        let word = '';
        i++; // 跳过开头的 /
        while (i < len && line[i] !== '/') {
          word += line[i];
          i++;
        }
        if (i >= len || line[i] !== '/') {
          throw new Error('Unmatched regular expression delimiter');
        }
        words.push('/' + word + '/');
        i++; // 跳过结束的 /
        continue;
      }

      // 处理其他单词（以空格或特殊字符结束的）
      let word = '';
      while (
        i < len &&
        line[i] !== ' ' &&
        line[i] !== '"' &&
        line[i] !== '/' &&
        line[i] !== '#'
      ) {
        word += line[i];
        i++;
      }

      words.push(word);
    }

    return words;
  }

  const res = splitWords('some word "a string#" /a regex #/ # comment');
  console.log(res);
  