<h1 align="center" style="color: #61dafb;">Seed</h1>
<h1 align="center" style="font-size: 80px;color:#61dafb">🌱</h1>

<br>

<p align="center">core features such as authority, state manage, etc.</p>

<br>

<p align="center">
    <span>en</span> | 
    <a href="./readme.zh-cn.md">中文</a>
</p>

<br>

<!-- TOC -->

- [Install](#install)
- [Introduction](#introduction)
- [usage](#usage)
- [APIs](#apis)
- [middleware](#middleware)
- [built-in middleware](#built-in-middleware)
  - [devtool](#devtool)
  - [cache](#cache)
- [file structure](#file-structure)

<!-- /TOC -->

<br>

<br>

## Install

```shell
yarn add @m78/seed
```



<br>



## Introduction

The `seed` currently contains the following core concepts:

- `state`, also known as `deps`, is a permission dependency, an object that describes all permissions related states
- `validator`, permission validator, receives ``state`` for permission verification, and returns description and operation without permission if it fails
- `seed api`, an object that contains operations such as setting `state`, obtaining `state`, subscribing to `state` changes, performing verification actions, etc.
- `middleware`, middleware system, used to change the initial configuration and enhance the api



<br>



<br>



## usage

```ts
import create from '@m78/seed';
import cache from '@m78/seed/cacheMiddleware';

// 1. create permission api through create and use

const {
    setState, // set state
    getState, // get state
    subscribe, // subscribe to state changes
    auth, // verify permissions
} = create({
    /* optional behavior, persist state to local (browser only) */
    middleware: [cache('my_state', 86400000/* ms */)],
    /* the initial state, which is dependent on all validators */
    state: {
        verify: false,
        usr: {
            name: 'lxj',
            audit: true,
            vip: false,
        },
    },
    /* declaration validator */
    validators: {
        login({ usr }) {
            // when the verification fails, the rejection message is returned, and the corresponding operation can also be returned at the same time
            if (!usr) {
                return {
                    label: 'not log',
                    // With the exception of Label, all are non-contractual and are determined by your own validation requirements
                    desc: 'Please log in first',
                    actions: [
                        {
                            label: 'to login',
                            handler() { console.log('to login') },
                        },
                        {
                            label: 'cancle',
                            handler() { console.log('cancle') },
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

// 2. verify with auth()
auth(['login', 'vip'], rejects => {
    // when rejects is not null, it means that permission verification failed
    // when rejects is null, rejects is an array of results returned by validator
});
```



<br>



## APIs

```ts
/* create() */

const seed = create({
    /** set middleware */
    middleware?: (Middleware | null | undefined)[];
    /** an object composed of values that all validators rely on */
    state?: object,
    /** validator to be registered */
    // * the signature of the validator is `validator(state, extra)` 
    // * receive the Extra passed in for the current state and auth() calls as arguments
    // * the return value indicates that the validator did not validate and will be passed back to auth() as a rejects callback. If you are using TypeScript, the return value will contain some reduced restrictions
    // * you can return a Promise to create an asynchronous validator, and because of that, the validator can also be declared as an async function
    validators: { [string: any]: Validator };
    /**
    * if one verification fails, block subsequent verifications
    * * for sub-permissions in or, even if validFirst is enabled, each item will still be verified, but only the first one will be returned
    * * putting the higher priority permission key in front when executing auth() helps to improve the accuracy of verification feedback, such as login > vip, because the VIP status is based on the login status
    *  */
    validFirst?: boolean;
})

// update the value of state, only the keys contained in the incoming object
auth.setState({ name: 'lj', })

// update the value of state, replace the entire state object
auth.coverSetState({ name: 'lj', })

// get current state
auth.getState();

// subscribe to state changes
const unsub = subscribe((changes) => {
   // ... 
});

// unsubscribe
unsub();

// validation permissions, the array item is the key contained in the validators, if the array item is an array, it means `or`
seed.auth(['key1, key2', ['orKey1', 'orKey2']], reject => {
    // when rejects is not null, it means that permission verification failed
    // when rejects is null, rejects is an array of results returned by validator
});

// with promise
seed.auth(['login', 'vip'])
	.then(rejects => {});

// passing extra parameters or local validators to the Validator (local validators still need to declare a key to take effect after registration)
seed.auth(
    ['key1, key2', ['orKey1', 'orKey2']], 
    { 
        extra: 'someData', 
        validators: {...}
    },
    reject => {}
);
```

<br/>

<br/>


## middleware

the middleware is used to add various patching capabilities to the existing API or to modify the configuration before it actually takes effect.

middleware has two execution cycles：

- the initialization phase is used to modify the default configuration passed in
- the patch phase is used to add various enhanced patches to the built-in API



**signature：**

```ts
interface Middleware {
  (bonus: MiddlewareBonusPatch | MiddlewareBonusInit): CreateKitConfig<any, any> | void;
}

// Initialize phase parameters
export interface MiddlewareBonusInit {
  /** is initialization phase */
  init: true;
  /** current create configuration (may have been modified by other middleware) */
  config: CreateKitConfig<any, any>;
  /** objects that are shared among different middleware */
  ctx: AnyObject;
}

// patch phase parameters
export interface MiddlewareBonusPatch {
  init: false;
  /** current auth api */
  apis: Auth<any, any>;
  /** add enhanced patch to the API */
  monkey: MonkeyHelper;
  /** objects that are shared among different middleware */
  ctx: AnyObject;
}
```

<br/>

**an example of log middleware **	

```ts
import { Middleware } from '@m78/seed';

const cacheMiddleware: Middleware = bonus => {
    
  /* ##### initialization phase ##### */
  if (bonus.init) {
    const conf = bonus.config;
    console.log('init');
      
    // when initialized, the configuration must be returned, and even if it has not been modified, the return value will be used as the new initial state
    return { ...conf, state: { ...conf.state, additionalDep: 'hello😄'  } }; 
  }
  

  /* ##### patch phase ##### */
    
  console.log('api created');
    
  // print the set new state when executing setState
  bonus.monkey('setState', next => patch => {
    console.log('setState', patch);
    next(patch);
  });

  // output the fetch behavior when the state is obtained
  bonus.monkey('getState', next => () => {
    console.log('getState');
    return next();
  });

}
```

<br/>

<br/>

## built-in middleware

### devtool

enable  [redux-devtool](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) support, this middleware should be placed after all middleware

```js
import create from '@m78/seed';
import devtool from '@m78/seed/devtoolMiddleware';

onst seed = create({
  middleware: [devtool],
  // ...
})
```



### cache

cache `state` by `storage api`

```js
import create from '@m78/seed';
import cache from '@m78/seed/cacheMiddleware';

const sessionCacheKeys = ['list1', 'list2', 'list3'];
const localCacheKeys = ['user', 'token'];

onst seed = create({
  middleware: [
    cache('cache_key1', {
      // session level cache (default)
      type: 'session',
      // only cache eligible keys
      testKey: key => sessionCacheKeys.includes(key),
    }),
    // supports multiple uses, provided that the keys processed by the two cache middleware cannot have a union (differentiated by testKey)
    cache('cache_key2', {
      // persistent caching
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
   * expire time (ms) for performance reasons, only check for expiration during initialization
   * */
  expire?: number;
  /**
   * true | whether to flush the expiration time when reading the cache before expiration
   * */
  expireRefresh?: boolean;
  /**
   * session | cache type, the key can be the same
   * */
  type?: 'session' | 'local';
  /**
   * cache all keys by default. Set this to enable caching for a specified key
   * */
  testKey?: (key: string) => boolean;
  /**
   * trigger when the cache expires or invalidated
   * */
  onExpire?: () => void;
}
```

<br/>

<br/>

## file structure

for small applications, it is very convenient to centrally declare states and validators, and complete typescript support can be obtained through type inference, but if there are too many validators and states, they may need to be separated into different files. Pass in a generic declaration to ensure that the type is completely usable.



**general usage :**

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



**complex usage (for reference only):**

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

/* the validator can even be used alone✌ */
const pass = isRoot(seed.getState());
```





























