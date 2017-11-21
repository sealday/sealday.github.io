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
