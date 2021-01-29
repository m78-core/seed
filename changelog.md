## 从auth迁移

代码组织, 验证器如何拆分

devtool
cacheMiddleware
coverSet
subscribe cahngeKey

* 命名变更 auth => kit
* 类型更改

```ts
const kit = create({
  // dependency => state
});

kit.getDeps => kit.getState
kit.setState => kit.setState
```
