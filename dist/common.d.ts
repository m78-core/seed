import { Auth, CreateKitConfig, Share, Subscribe, Validators, ValidMeta } from './types';
/**
 * 传入验证key、验证器列表、依赖数据、额外数据。对该key进行验证后返回验证Promise形式的结果(void 或 ValidMeta)
 * */
export declare const validItem: (key: string, validators: Validators<any>, deps: any, extra: any) => Promise<void | ValidMeta>;
/**
 * 实现auth() api
 * */
export declare function authImpl<D, V extends Validators<D>>(share: Share<D, V>): Auth<D, V>['auth'];
/**
 * 生成和实现subscribe() api
 * - 通知功能在setDeps内部
 * */
export declare function subscribeImpl(share: Share<any, any>): Subscribe;
/**
 * 实现中间件功能
 * */
export declare function middlewareImpl(conf: CreateKitConfig<any, any>): readonly [CreateKitConfig<any, any>] | readonly [CreateKitConfig<any, any>, (apis: Auth<any, any>) => void];
//# sourceMappingURL=common.d.ts.map