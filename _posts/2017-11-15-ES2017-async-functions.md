---
layout: post
title:  "ES2017 async functions"
date:   2017-11-15 18:34:49 +0800
comments: true
categories: js
---
## 背景

之前技术分享会上有人分享了 js 中的异步执行的相关内容，其中提到了 async 函数，这个 ES2017 刚加入到 js 中的语法，
现在已经在 node 8 lts 中可以使用了。因此考虑了一下，能不能在现有代码的情况下，引入这个特性，它能不能给我们带来
一些好处，以及相应的代价是不是相对于好处来说足够小。

## 基本概念

```js
async function name([param[, param[, ... param]]]) {
   statements
}
```

这个形式和我们普通的函数没什么区别，只是在 function 前面加上了 async 关键字。当这样的一个函数被调用的时候，返回的
结果是一个 Promise 对象。在 async 函数里，我们可以使用 await 关键字，用来获取 Promise 的执行结果。

## 对比试验
### 与直接使用 Promise 的对比

对于用 Promise 写的代码：

```js
load()
  .then((result) => {
    return doAWith(result);
  })
  .then((result) => {
    return doBWith(result);
  })
  .then((result) => {
    return doCWith(result);
  })
  .catch((err) => {
    doWith(err);
  })
```

如果使用 async 改写：

```js
try {
  const result = await load();
  const resultA = await doAWith(result);
  const resultB = await doBWith(resultA);
  const resultC = await doCWith(resultB);
} catch (err) {
  doWith(err);
}
```

在改写之后显得简洁明确了很多，特别是对于有 try-catch 经验的人，错误处理的情况也就更明确了。

### 与 [Async][1] 库的对比

看起来很美好，然而我们实际中，很可能原本并不是用 Promise 来写，比如说，是使用 [Async][1]
库来实现的代码。async 中，个人使用比较多的是 auto，所以下面举例子均以 auto 作为例子，但是对于其他 API 也有一致的结论。

```js
async.auto({
  a: () => {
  },
  b: () => {
  }
}, (err, results) => {
});
```

对于上面这个代码，执行的时候 a 与 b 会同时开始，所以我们并不能直接转换成两个连续的 await 调用，相应的，我们需要把它装在
`Promise.all` 中：

```js
const results = await Promise.all([a(), b()]);
```

对于实际代码中，我们 a 和 b 有可能暂时还不能直接改写成 Promise 的形式，所以有可能代码就变成了：

```js
const results = await Promise.all([util.promisify(a)(), util.promisify(b)()]);
```

```js
async.auto({
  a: () => {
  },
  b: ['a', () => {
  }],
  c: ['b', () => {
  }]
}, (err, results) => {
});
```

将前面的形式稍微换一下，就得到了按顺序执行的形式，这种就如同更早看到的 promise 的形式，一个接着一个执行，是可以改写成 async 形式：

```js
try {
  const resultA = await a();
  const resultB = await b(resultA);
  const resultC = await c(resultB);
} catch (e) {
}
```

但是这样子有多少好处么，我在实际改写测试中发现，这种形式的改写也没有太大意义，特别是外层函数并不是 async 函数，导致，改写后的代码还得
包在一个 async 函数中，类似于：

```js
const asyncFn = async () => {
  const resultA = await a();
  const resultB = await b(resultA);
  const resultC = await c(resultB);
};
asyncFn()
  .then((results) => cb(null, results))
  .catch((err) => cb(err));
```

### 结合 [Async][1] 与 async

单纯把 [Async][1] 库替换掉并不是一个很好的演化我们代码的办法，而且 [Async][1] 库是支持使用 async 函数的，因此我们就可以做下面这些改造。

```js
async.auto({
  a: (cb) => {
    findOne((err, doc) => {
      if (err || doc) {
        return cb(err || new Error('doc not found'));
      }
      cb();
    });
  },
  b: () => {
  }
}, (err, results) => {
});
```

这是一个根据返回数据抛出一个我们自定义错误的例子，在这种情况下，原本的代码我们不得不自己传递调用方法有可能抛出的错误，然后还需要根据不报错时
返回的数据情况抛出一个自己的错误。而如果改写成 async 的写法，可以看到：

```js
async.auto({
  a: async (cb) => {
    const doc = await util.promisify(findOne)();
    if (!doc) {
      throw new Error('doc not found'));
    }
  },
  b: () => {
  }
}, (err, results) => {
});
```

代码上没有太大区别，主要是不再传递原本的错误，而只是根据我们自己的判断原则抛出了一个新的错误。

这一点得益于 async 让我们可以使用 try-catch 这个异常处理方案，在 try-catch 这个异常处理方案中，我们只要不捕获错误，
这个错误就会继续传递给上层，不同于使用 callback 方案时需要手动传递错误。

### 测试代码的改写

原代码：

```js
it('do some async thing', (done) => {
  process(params, (err, result) => {
    should.not.exist(err);
    result.should.eql(expectedResult);
    done();
  });
});
```

改写后：

```js
it('do some async thing', async () => {
  const result = await process(params);
  result.should.eql(expectedResult);
});
```

async 函数风格的自动化测试代码是能被 [Mocha][2] 支持的，因此我们可以进行这种改写。

## 结论

在写本文之前，为了能得到较为真实的感受，我对投入生产的代码进行了部分改写，在这个过程中基本上围绕：

- 写法是否简洁
- 迁移是否可行
- 错误是否能更合理得到处理
- 是否有比较明显的性能惩罚

进行思考。对于这四点，以目前的结果来看，主要是在于错误处理相对于之前有比较好的体验提升，而其他几点，都没有明显的差异。

迁移也是可行的，虽然将生产环境的代码进行整体替换是不现实的，可能会引入各种潜在的问题，但是借助 util.promisify 以及 
[Async][1] 的支持，我们可以对新增或者改良的代码进行渐进式的替换。

本文有意避开性能的问题，因为针对性能的话，需要根据实际情况来具体测试代码，但是如果真的很关心大致上的性能，可以参考下面的两个
参考链接，需要注意的是，其中一份的性能测试已经考虑了 util.promisify 在内。


## 参考
1. [MDN web docs: async_function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
1. [Node.js 8.0.0 async pattern benchmark](https://lellansin.wordpress.com/2017/06/09/node-js-8-0-0-async-pattern-benchmark/)
1. [Performance of native ES2015 promises and ES2017 async functions in Node.js v8](https://kyrylkov.com/2017/04/25/native-promises-async-functions-nodejs-8-performance/)

[1]: https://caolan.github.io/async/
[2]: https://mochajs.org/
