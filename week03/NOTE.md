
## week03总结

  - JavaScript | 语句，对象
>根据课上老师的示范，找出 JavaScript 标准里所有的对象，分析有哪些对象是我们无法实现出来的，这些对象都有哪些特性？写一篇文章，放在学习总结里。

- 获取全部JavaScript固有对象
```
var set = new Set();
var objects = [
    eval,
    isFinite,
    isNaN,
    parseFloat,
    parseInt,
    decodeURI,
    decodeURIComponent,
    encodeURI,
    encodeURIComponent,
    Array,
    Date,
    RegExp,
    Promise,
    Proxy,
    Map,
    WeakMap,
    Set,
    WeakSet,
    Function,
    Boolean,
    String,
    Number,
    Symbol,
    Object,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    ArrayBuffer,
    SharedArrayBuffer,
    DataView,
    Float32Array,
    Float64Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray,
    Atomics,
    JSON,
    Math,
    Reflect];
objects.forEach(o => set.add(o));

for(var i = 0; i < objects.length; i++) {
    var o = objects[i]
    for(var p of Object.getOwnPropertyNames(o)) {
        var d = Object.getOwnPropertyDescriptor(o, p)
        if( (d.value !== null && typeof d.value === "object") || (typeof d.value === "function"))
            if(!set.has(d.value))
                set.add(d.value), objects.push(d.value);
        if( d.get )
            if(!set.has(d.get))
                set.add(d.get), objects.push(d.get);
        if( d.set )
            if(!set.has(d.set))
                set.add(d.set), objects.push(d.set);
    }
}
```

- JS 标准里面有哪些对象是我们无法实现的，都有哪些特性
```
Bound Function Exotic Objects
有这些特性[[Call]] [[Construct]]
Array Exotic Objects
有这些特性[[DefineOwnProperty]] ArrayCreate(length[,proto]) ArraySpeciesCreate(originalArray,length) ArraySetLength(A,Desc)
String Exotic Objects
有这些特性[[GetOwnProperty]] [[DefineOwnProperty]] [[OwnPropertyKeys]] StringCreate(value,prototype) StringGetOwnProperty(S,P)
Arguments Exotic Objects
有这些特性[[GetOwnProperty]] [[DefineOwnProperty]] [[Get]] [[Set]] [[Delete]] CreateUnmappedArgumentsObject(argumentsList) CreateMappedArgumentsObject(func,formals,argumentsList,env)
Integer-Indexed Exotic Objects
有这些特性[[GetOwnProperty]] [[HasProperty]] [[DefineOwnProperty]] [[Get]] [[Set]] [[OwnPropertyKeys]] IntegerIndexedObjectCreate(prototype,internalSlotsList) IntegerIndexedElementGet(O,index) IntegerIndexedElementSet(O,index,value)
Module Namespace Exotic Objects
有这些特性[[SetPrototypeOf]] [[IsExtensible]] [[PreventExtensions]] [[GetOwnProperty]] [[DefineOwnProperty]] [[HasProperty]] [[Get]] [[Set]] [[Delete]] [[OwnPropertyKeys]] ModuleNamespaceCreate(module,exports)
Immutable Prototype Exotic Objects
有这些特性[[SetPrototypeOf]] SetImmutablePrototype
```


- Completion Record
```
[[type]]: normal, break, continue, return or throw
[[value]]: Types
[[target]]: label
作用域
Block BlockStatement
Iteration 作用域在block之外
for in
for of generate
声明 1、有var一定要写在function范围内 2、不要在类似with的block中写var 2、对象
ObjectAPI/Grammar
{}.[] Object.defineProperty
Object.create / Object.setPrototypeOf / Object.getPrototypeOf
new / class / extends
new / function / prototype
Function Object
```

