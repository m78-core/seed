import { AnyObject, isArray, isFunction } from '@lxjx/utils';
import {
  Auth,
  AuthConfig,
  AuthKeys,
  Callback,
  CreateKitConfig,
  Listener,
  MiddlewareBonusInit,
  MiddlewareBonusPatch,
  Share,
  Subscribe,
  Validators,
  ValidMeta,
} from './types';

/**
 * 传入验证key、验证器列表、依赖数据、额外数据。对该key进行验证后返回验证Promise形式的结果(void 或 ValidMeta)
 * */
export const validItem = async (
  key: string,
  validators: Validators<any>,
  deps: any,
  extra: any,
) => {
  const validator = validators[key];
  // 不存在此验证器
  if (!validator) return;

  const result = validator(deps, extra);

  if (!result) return;

  // 支持任何promise like
  if ('then' in result && 'catch' in result) {
    // eslint-disable-next-line no-return-await
    return await result;
  }

  return result;
};

/**
 * 实现auth() api
 * */
export function authImpl<D, V extends Validators<D>>(share: Share<D, V>): Auth<D, V>['auth'] {
  return async (authKeys: AuthKeys<V>, configOrCb: any, cb?: Callback) => {
    const { validators, state: deps, validFirst } = share;
    const confIsFn = isFunction(configOrCb);
    const { extra, validators: localValidators }: AuthConfig<D> = confIsFn ? {} : configOrCb || {};
    const callback: Callback = confIsFn ? configOrCb : cb;

    /** 所有验证失败结果 */
    const rejects: ValidMeta[] = [];
    /** 是否通过 */
    let pass = true;

    /**
     * 传入单个权限key或key数组进行验证, 并将验证结果写入pass和rejects
     * 单个验证时: 验证该项并返回验证meta信息，验证正确时无返回
     * key数组时: 作为条件`or`进行验证，只要其中任意一项通过了验证则通过验证
     * */
    const test = async (key: any, isOr?: boolean) => {
      if (isArray(key)) {
        const tempRejects: ValidMeta[] = [];
        let flag = false;

        for (const authItem of key) {
          // if (pass) {
          const meta = await test(authItem, true);

          if (meta) {
            tempRejects.push(meta);
          }
          // 成功任意一项即视为成功
          if (!meta) {
            flag = true;
            break;
          }
          // }
        }
        if (!flag) {
          pass = false;
          validFirst ? rejects.push(tempRejects[0]) : rejects.push(...tempRejects);
        }
      } else {
        const meta = await validItem(key, { ...localValidators, ...validators }, deps, extra);

        if (!meta) return;

        if (!isOr) {
          pass = false;
          rejects.push(meta);
        }

        return meta;
      }
    };

    if (validFirst) {
      for (const authItem of authKeys) {
        if (pass) {
          await test(authItem);
        }
      }
    } else {
      await Promise.all(authKeys.map(ak => test(ak)));
    }

    const rjs = rejects.length ? rejects : null;

    callback?.(rjs);

    return rjs;
  };
}

/**
 * 生成和实现subscribe() api
 * - 通知功能在setDeps内部
 * */
export function subscribeImpl(share: Share<any, any>): Subscribe {
  return (listener: Listener) => {
    share.listeners.push(listener);

    return () => {
      const ind = share.listeners.indexOf(listener);
      if (ind === -1) return;
      share.listeners.splice(ind, 1);
    };
  };
}

/**
 * 实现中间件功能
 * */
export function middlewareImpl(conf: CreateKitConfig<any, any>) {
  const { middleware } = conf;

  if (!middleware?.length) return [conf] as const;

  const allMid = [...middleware];

  const ctx: AnyObject = {};

  const initBonus: MiddlewareBonusInit = {
    ctx,
    config: conf,
    init: true,
  };

  allMid.forEach(mid => {
    if (mid) {
      const nextConf = mid(initBonus);
      if (nextConf === undefined)
        throw Error(
          'kit: do you forget to return to the config during the middleware initialization phase?',
        );
      initBonus.config = nextConf;
    }
  });

  const patchHandler = (apis: Auth<any, any>) => {
    const patchBonus: MiddlewareBonusPatch = {
      init: false,
      apis,
      ctx,
      monkey: (name, cb) => {
        const next = apis[name];
        if (!next) return;
        apis[name] = cb(next);
      },
    };

    allMid.reverse(); /* patch函数是由内到外执行的，需要反转顺序 */

    allMid.forEach(mid => mid && mid(patchBonus));
  };

  return [initBonus.config, patchHandler] as const;
}
