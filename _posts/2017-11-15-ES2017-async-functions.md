---
layout: post
title:  "ES2017 async functions"
date:   2017-11-15 18:34:49 +0800
categories: js
---
之前技术分享会上有人分享了 js 中的异步执行的相关内容，其中提到了 async 函数，这个 ES2017 刚加入到 js 中的语法，
现在已经在 node 8 lts 中可以使用了。因此考虑了一下，能不能在现有代码的情况下，引入这个特性，它能不能给我们带来
一些好处，以及相应的代价是不是相对于好处来说足够小。

对于原本用 Promise 写的代码：
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
看起来很美好，然而我们实际中，很可能原本并不是用 promise 来写，比如说，是使用 Async 库来实现的代码。

async 中，使用比较多的是 auto，所以下面举例子均以 auto 作为例子，但是想法是可以应用在其他的 api 上。
```js
async.auto({
  a: () => {
  },
  b: () => {
  }
}, (err, results) => {
});
```
对于上面这个代码，并不适合改写成 async 形式，改写成 async 形式会丧失比较明显的性能优势，比如说原本 a 和 b 是两个
数据库异步请求，auto 原本的实现可以让他们基本同时请求，而改写成 async 形式将使得 a、b 按顺序请求。

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
这样子看起来 async 真的没有什么好处，不过在改写的时候，我还发现了一些内容：
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
代码上没有太大区别，主要是引入了一个 uti.promisify，用来将我们原本不是返回 promise 的函数换成返回 promise 的函数，另一个就是抛出错误不再传递
原本的错误，而只是根据我们自己的判断原则抛出了一个新的错误。这个其实不算 async 本身的好处，而是因为 async 使得我们可以使用 try-catch 这套异常
处理逻辑，在 try-catch 中，我们只要不捕获错误，这个错误就会继续传递给上层，不同于使用 callback 方案时需要手动传递错误。
