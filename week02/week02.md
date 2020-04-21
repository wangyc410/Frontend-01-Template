本周作业

## 1.写一个正则表达式 匹配所有 Number 直接量

Number有哪些字面量 ？
- 整数
```
/^-?\\d+$/
```
- 浮点数
```
/^(-?\\d+)(\\.\\d+)?$/
```
- 二进制数
```
/^[01]+$/
```
- 八进制数
```
/^[0-7]+$/
```
- 十六进制数
```
/(^0x[a-f0-9]{1,2}$)|(^0X[A-F0-9]{1,2}$)|(^[A-F0-9]{1,2}$)|(^[a-f0-9]{1,2}$)/
```
- Number字面量正则
```
/(^-?\\d+$)|(^(-?\\d+)(\\.\\d+)?$)|(^[01]+$)|(^[0-7]+$)|((^0x[a-f0-9]{1,2}$)|(^0X[A-F0-9]{1,2}$)|(^[A-F0-9]{1,2}$)|(^[a-f0-9]{1,2}$))/
```
## 2.写一个 UTF-8 Encoding 的函数
```
function encodeUtf8(text) {
    const code = encodeURIComponent(text);
    const bytes = [];
    for (var i = 0; i < code.length; i++) {
        const c = code.charAt(i);
        if (c === '%') {
            const hex = code.charAt(i + 1) + code.charAt(i + 2);
            const hexVal = parseInt(hex, 16);
            bytes.push(hexVal);
            i += 2;
        } else bytes.push(c.charCodeAt(0));
    }
    return bytes;
}

```
## 3.写一个正则表达式，匹配所有的字符串直接量，单引号和双引号
```
/[\u0021-\u007E]{6,16}|[\x21-\x7E]{6,16}|(['"])(?:(?!\1).)*?\1/g
```
完成一篇本周的学习总结

本周学习效果感觉很差，云里雾里，学的都含含糊糊。自己恶补了一下基础知识，也不够透彻。
