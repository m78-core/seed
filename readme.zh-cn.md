<h1 align="center" style="color: #61dafb;">Seed</h1>
<h1 align="center" style="font-size: 80px;color:#61dafb">🌱</h1>

<br>

<p align="center">提供权限、状态管理等核心且基础的功能</p>

<br>

<p align="center">
    <a href="./readme.md">en</a> | 
    <span>中文</span>
</p>
<br>

<!-- TOC -->

- [安装](#安装)
- [介绍](#介绍)
- [使用](#使用)
- [API速览](#api速览)
- [中间件](#中间件)
- [内置中间件](#内置中间件)
  - [devtool](#devtool)
  - [cache](#cache)
- [文件组织](#文件组织)

<!-- /TOC -->

<br>

<br>

## 安装

```shell
yarn add @m78/seed
```



<br>



## 介绍

`seed` 目前包含以下几个核心概念：

- `state` , 也称为`deps`, 权限依赖，一个描述所有权限相关状态的对象。
- `validator` , 权限验证器，接收``state` `进行权限验证，在未通过时返回无权限的描述和操作等。
- `seed api` , 一个包含设置`state`、获取`state`、订阅`state`变更、执行验证行为等操作的对象。
- `middleware` , 中间件系统，用来更改初始化配置，增强api



<br>



通常，为了更方便的使用，会基于此库开发上层验证库，如果你是react用户，可以直接使用 [**M78/auth**](<http://llixianjie.gitee.io/m78/docs/utils/auth>)，如果是其他框架或纯js使用，也可以参考它的api来实现自己的上层库。



<br>



## 使用

```ts
import create from '@m78/seed';
import cache from '@m78/seed/cacheMiddleware';

// 1. 通过create创建权限api并使用

const {
    setState, // 设置state
    getState, // 获取state
    subscribe, // 订阅state变更
    auth, // 验证权限
} = create({
    /* 可选行为，将state持久化到本地(仅限浏览器) */
    middleware: [cache('my_state', 86400000/* ms */)],
    /* 初始state, 被所有验证器依赖 */
    state: {
        verify: false,
        usr: {
            name: 'lxj',
            audit: true,
            vip: false,
        },
    },
    /* 声明验证器 */
    validators: {
        login({ usr }) {
            // 验证未通过时，返回拒绝信息，还可以同时返回对应的操作
            if (!usr) {
                return {
                    label: 'not log',
                    // 除了label，其他都是非约定的，由自己的验证需求决定
                    desc: 'Please log in first',
                    actions: [
                        {
                            label: '去登陆',
                            handler() { console.log('去登陆') },
                        },
                        {
                            label: '算了',
                            handler() { console.log('算了') },
                        },
                    ],
                };
            }
        },
        vip({ usr }) {
            if (!usr.vip) {
                return {
                    label: 'not vip',
                    desc: 'User is not vip',
                };
            }
        },
    },
});

// 2. 通过auth()进行验证
auth(['login', 'vip'], rejects => {
    // rejects不为null时，说明权限验证未通过
    // 存在值时，rejects为validator返回结果组成的数组
});
```



<br>



## API速览

```ts
/* create() */

const seed = create({
    /** 中间件 */
    middleware?: (Middleware | null | undefined)[];
    /** 被所有验证器依赖的值组成的对象 */
    state?: object,
    /** 待注册的验证器 */
    // * 验证器的签名为 `validator(state, extra)` 
    // * 接收当前state和auth()调用时传入的extra作为参数
    // * 返回值时表示该验证器验证未通过，并会作为rejects的项回传给auth()的回调, 如果你使用typescript，返回值会包含一些约定性的限制
    // * 可以返回Promise来创建异步验证器，正因为如此，验证器也可以声明为async函数
    validators: { [string: any]: Validator };
    /**
    * 如果一个验证未通过，则阻止后续验证
    * * 对于or中的子权限，即使开启了validFirst，依然会对每一项进行验证，但是只会返回第一个
    * * 在执行auth()时将优先级更高的权限key放到前面有助于提高验证反馈的精度, 如 login > vip, 因为vip状态是以登录状态为基础的
    *  */
    validFirst?: boolean;
})

// 更新state的值，只更新传入对象中包含的键
auth.setState({ name: 'lj', })

// 更新state的值，替换整个state对象
auth.coverSetState({ name: 'lj', })

// 获取当前state
auth.getState();

// 订阅state变更
const unsub = subscribe((changes) => {
   // ... 
});

// 取消订阅
unsub();

// 验证权限, 数组项为validators中包含的key, 如果数组项为数组，则表示 `or` 
seed.auth(['key1, key2', ['orKey1', 'orKey2']], reject => {
    // rejects不为null时，说明权限验证未通过
    // 存在值时，rejects为validator返回结果组成的数组
});

// 通过promise使用
seed.auth(['login', 'vip'])
	.then(rejects => {});

// 向validator传递额外参数或局部验证器(局部验证器注册后依然需要声明key才会生效)
seed.auth(
    ['key1, key2', ['orKey1', 'orKey2']], 
    { extra: 'someData', validators },
    reject => {}
);
```

<br/>

<br/>


## 中间件

中间件用于为原有api添加各种补丁功能，也可用于在配置实际生效前对其进行修改。

中间件有两个执行周期：

- 初始化阶段，用于修改传入的默认配置
- 补丁阶段，用于为内置api添加各种增强性补丁



**签名：**

```ts
interface Middleware {
  (bonus: MiddlewareBonusPatch | MiddlewareBonusInit): CreateKitConfig<any, any> | void;
}

// 初始化阶段参数
export interface MiddlewareBonusInit {
  /** 是否为初始化阶段 */
  init: true;
  /** 当前创建配置(可能已被其他中间件修改过) */
  config: CreateKitConfig<any, any>;
  /** 在不同中间件中共享的对象 */
  ctx: AnyObject;
}

// 补丁阶段参数
export interface MiddlewareBonusPatch {
  init: false;
  /** 当前的auth api */
  apis: Auth<any, any>;
  /** 为api添加增强补丁 */
  monkey: MonkeyHelper;
  /** 在不同中间件中共享的对象 */
  ctx: AnyObject;
}
```

<br/>

**一个log中间件的例子**	

```ts
import { Middleware } from '@m78/seed';

const cacheMiddleware: Middleware = bonus => {
    
  /* ##### 初始化阶段 ##### */
  if (bonus.init) {
    const conf = bonus.config;
    console.log('init');
      
    // 初始化时必须返回配置，即使没有对其进行修改， 返回值会作为新的初始deps使用
    return { ...conf, state: { ...conf.state, additionalDep: 'hello😄'  } }; 
  }
  

  /* ##### 补丁阶段 ##### */
    
  console.log('api created');
    
  // 在执行setState时打印设置的新state
  bonus.monkey('setState', next => patch => {
    console.log('setState', patch);
    next(patch);
  });

  // 获取state时输出获取行为
  bonus.monkey('getState', next => () => {
    console.log('getState');
    return next();
  });

}
```

<br/>

<br/>

## 内置中间件

### devtool

开启 [redux-devtool](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) 支持, 此中间件应放在所有中间件之后

```js
import create from '@m78/seed';
import devtool from '@m78/seed/devtoolMiddleware';

onst seed = create({
  middleware: [devtool],
  // ...
})
```



### cache

缓存 `state` 到 `storage api`

```js
import create from '@m78/seed';
import cache from '@m78/seed/cacheMiddleware';

const sessionCacheKeys = ['list1', 'list2', 'list3'];
const localCacheKeys = ['user', 'token'];

onst seed = create({
  middleware: [
    cache('cache_key1', {
      // session级缓存(默认)
      type: 'session',
      // 只缓存符合条件的key
      testKey: key => sessionCacheKeys.includes(key),
    }),
    // 支持多次使用，前提是两个缓存中间件处理的key不能有并集(通过testKey区分)
    cache('cache_key2', {
      // 持久化缓存
      type: 'local',
      expire: 86400000, // one day
      testKey: localCacheKeys.includes(key),
    }),
  ],
  // ...
})
```



config:

```typescript
interface CacheMiddlewareConf {
  /**
   * 过期时间(ms), 出于性能考虑，只在初始化阶段检测是否过期
   * */
  expire?: number;
  /**
   * true | 在过期前读取缓存时，是否刷新过期时间
   * */
  expireRefresh?: boolean;
  /**
   * session | 缓存类型，不共享缓存key
   * */
  type?: 'session' | 'local';
  /**
   * 默认缓存全部key，设置此项来开启指定key的缓存
   * */
  testKey?: (key: string) => boolean; // 验证通过的值进行缓存
  /**
   * 缓存过期或失效时触发
   * */
  onExpire?: () => void;
}
```

<br/>

<br/>

## 文件组织

对于小型应用，将状态和验证器集中声明是非常方便的，而且通过类型推导可以获得完整的typescript支持, 但是如果验证器和状态过多，可能会需要将它们分离到不同的文件，这时候需要传入泛型声明来保证类型完整可用。



**常规使用:**

```typescript
create({
    state: {...},
    validators: {
        login() {...},
        vip() {...},
    },
});

/* ✅ all type is fine */
```



**复杂点的用法(仅供参考):**

type.ts

```typescript
export interface SeedState {
  name: string;
  age: number;
}	
```



initState.ts

```typescript
import { SeedState } from './type';

const initState: SeedState = {
  name: 'lxj',
  age: 18,
};

export default initState;
```



validators.ts

```typescript
import { Validator } from '@m78/seed';
import { SeedState } from './type';

export const isRoot: Validator<SeedState> = state => {
  if (state.name !== 'lxj') {
    return {
      label: 'sorry! ur not root',
    };
  }
};

export const is18plus: Validator<SeedState> = state => {
  if (state.age < 18) {
    return {
      label: 'only 18+',
    };
  }
};

export default {
  isRoot,
  is18plus,
};
```



index.ts

```typescript
import create from '@lxjx/auth';
import { SeedState } from './type';
import initState from './initState';
import validators, { isRoot } from './validators';

const seed = create<SeedState, typeof validators>({
  state: initState,
  validators,
});

/* ✅ all type is fine */
seed.auth(['is18plus', 'isRoot'], rej => {
  console.log(rej);
});

seed.setState({
  name: 'jxl',
});

console.log(seed.getState().name);

/* 验证器甚至可以单独使用✌ */
const pass = isRoot(seed.getState());
```





























