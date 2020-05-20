const css = require('css');

const EOF = Symbol("EOF"); // EOF: End of File
const regSpace = /^[\t\n\f ]$/;
const regAZ = /^[a-zA-Z]$/;
let currentToken = null;
let currentAttribute = null;
let currentTextNdoe = null;
let stack = [{
    type: 'document',
    children: []
}]


let rules = [];

// 添加css rules
function addCssRules(text) {
    var ast = css.parse(text);
    // console.log('ast: ', JSON.stringify(ast, null, '    '));
    rules.push(...ast.stylesheet.rules);
}

// compute css
function computeCss(element) {
    // console.log(rules);
    // console.log('computed css for Element', element);
    // stack存放了所有的父元素
    var elements = stack.slice().reverse();
    if (!element.computedStyle) {
        element.computedStyle = [];

        for (const rule of rules) {
            var selectorParts = rule.selectors[0].split(" ").reverse();
            if (!match(element, selectorParts[0])) {
                // current element donot match seletor
                continue;
            }
            let matched = false;
            var j = 1;
            for (var i = 0; i < elements.length; i++) {
                if (match(elements[i], selectorParts[j])) {
                    j++
                }
                if (j >= selectorParts.length) {
                    matched = true;
                }
                if (matched) {
                    // 如果匹配到，我们要加入
                    // console.log(elements);
                    var sp = specificity(rule.selectors[0])
                    var computedStyle = element.computedStyle;

                    for (const declaration of rule.declarations) {
                        if (!computedStyle[declaration.property]) {
                            computedStyle[declaration.property] = {}
                        }
                        // 后面的属性可以覆盖已有的属性，未处理权重的问题
                        // computedStyle[declaration.property].value = declaration.value;
                        // 处理选择器权重，未处理内联和！important
                        if (!computedStyle[declaration.property].specificity) {
                            computedStyle[declaration.property].value = declaration.value;
                            computedStyle[declaration.property].specificity = sp;
                        } else if (compare(computedStyle[declaration.property].specificity, sp) <= 0) {
                            computedStyle[declaration.property].value = declaration.value;
                            computedStyle[declaration.property].specificity = sp;
                        }
                    }
                    // console.log(element.tagName ,element.computedStyle)
                }
            }
        }
    }

    function match(element, seletor) {
        /**
        main>div.a#id[attr=value]
        main>
        div
        .a
        #id
        [attr=value]
         * 
         */
        if (!seletor || !element.attributes) {
            return false;
        }
        let temp = seletor.charAt(0)
        // 匹配id选择器
        if (temp == '#') {
            var attr = element.attributes.filter(attr => attr.name === 'id')[0];
            if (attr && attr.value === seletor.replace('#', '')) {
                return true;
            }
        } else if (temp === '.') {
            // class选择器
            var attr = element.attributes.filter(attr => attr.name === 'class')[0];

            if (attr && attr.value === seletor.replace('.', '')) {
                return true;
            }
        } else {
            // 简单选择器
            if (element.tagName === seletor) {
                return true;
            }
        }
        return false
    }
}

// 确定权重
function specificity(seletor) {
    var p = [0, 0, 0, 0];
    var selectorParts = seletor.split(" ");
    for (const part of selectorParts) {
        if (part.charAt(0) === '#') {
            p[1] += 1;
        } else if (part.charAt(0) === '.') {
            p[2] += 1;
        } else {
            p[3] += 1;
        }
    }
    return p;
}

function compare(sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1];
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2];
    }
    return sp1[3] - sp2[3]
}

// 输出token
function emit(token) {
    // token.type !== 'text' && console.log(token);
    // return;
    // if (token.type === 'text') {
    //   return;
    //   // console.log(token);
    // }
    let top = stack[stack.length - 1];

    if (token.type === 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: []
        }
        element.tagName = token.tagName;
        for (const p in token) {
            if (p !== 'type' && p !== 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p]
                })
            }
        }

        // 调用css
        computeCss(element);

        top.children.push(element);
        element.parent = top;
        if (!token.isSelfClosing) {
            stack.push(element);
        }
        currentToken = null;
        currentTextNdoe = null;
    } else if (token.type === 'endTag') {
        // console.log( top.tagName, currentTextNdoe.content);
        if (top.tagName !== token.tagName) {
            throw new Error('tag start end do not match !');
        } else {
            // 遇到style标签，收集css规则
            if (top.tagName === 'style') {
                // console.log(top.children[0])
                addCssRules(top.children[0].content);
            }
            stack.pop();
        }
        currentToken = null;
        currentTextNdoe = null;
    } else if (token.type === 'text') {
        if (currentTextNdoe == null) {
            currentTextNdoe = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNdoe);
        }
        // console.log(currentTextNdoe.content, token.content);
        currentTextNdoe.content += token.content;
    }
    // if (token.type !== 'text') {
    //   console.log(token);
    // }
}

function data(c) {
    if (c === '<') {
        return tagOpen;
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        })
        return;
    } else {
        emit({
            type: 'text',
            content: c
        })
        return data;
    }
}

// 进入标签
function tagOpen(c) {
    if (c === '/') {
        return endTagOpen;
    } else if (c.match(regAZ)) {
        // 遇到a-z说明，捕获到标签名了
        currentToken = {
            type: 'startTag',
            tagName: ''
        }
        return tagName(c);
    } else {
        return;
    }
}
// 标签结束
function endTagOpen(c) {
    if (c.match(regAZ)) {
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c);
    } else if (c === ">") {
        return data;
    } else if (c === EOF) {

    } else {

    }
}

// 进入标签名
function tagName(c) {
    if (c.match(regSpace)) {
        // 遇到空格等，准备获取属性名
        return beforeAttributeName;
    } else if (c === '/') {
        // 遇到/，说明自封闭标签
        return selfClosingStartTag;
    } else if (c.match(regAZ)) {
        // 持续捕获，获取完整的标签名
        currentToken.tagName += c //.toLowerCase()
        return tagName;
    } else if (c === '>') {
        // 一个标签结束，回到data继续解析
        emit(currentToken);
        return data;
    } else {
        return tagName;
    }
}

// 准备获取属性名
function beforeAttributeName(c) {
    if (c.match(regSpace)) {
        // 持续吃掉空格
        return beforeAttributeName;
    } else if (c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else if (c === '=') {
        // throw new error
        // return beforeAttributeName;
    } else {
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributename(c);
    }
}

function attributename(c) {
    if (c.match(regSpace) || c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (c === '\u0000') {

    } else if (c === "\"" || c === "'" || c === "<") {

    } else {
        currentAttribute.name += c;
        return attributename;
    }
}

function afterAttributeName(c) {
    if (c.match(regSpace)) {
        return afterAttributeName(c);
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (c === '>') {
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {
        currentAttribute = {
            name: '',
            value: ''
        }
        return attributename(c);
    }
}

function beforeAttributeValue(c) {
    if (c.match(regSpace) || c === '/' || c === '>' || c === EOF) {
        return beforeAttributeValue;
    } else if (c === "\"") {
        return doubleQuotedAttributeValue;
    } else if (c === "\'") {
        return singleQuotedAttributeValue;
    } else if (c === ">") {

    } else {
        return UnquotedAttributeValue(c);
    }
}

function doubleQuotedAttributeValue(c) {
    if (c === "\"") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function singleQuotedAttributeValue(c) {
    if (c === "\'") {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuotedAttributeValue;
    } else if (c === "\u0000") {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue;
    }
}

function afterQuotedAttributeValue(c) {
    if (c.match(regSpace)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return doubleQuotedAttributeValue; // 没有考虑单引号的问题!!!!!
    }
}
// 
function UnquotedAttributeValue(c) {
    if (c.match(regSpace)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '\u0000') {

    } else if (c === "\"" || c === "\'" || c === "<" || c === "=" || c === "`") {

    } else if (c === EOF) {

    } else {
        currentAttribute.value += c;
        return UnquotedAttributeValue;
    }
}

function selfClosingStartTag(c) {
    if (c === ">") {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === 'EOF') {

    } else {
        // This is an unexpected-solidus-in-tag parse error. Reconsume in the before attribute name state.
        // return beforeAttributeName(c)
    }
}


module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for (const c of html) {
        state = state(c);
    }
    state = state(EOF);

    return stack[0];
}