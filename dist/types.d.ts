import { AnyObject } from '@lxjx/utils';
export declare type Share<D, V> = CreateKitConfig<D, V> & {
    listeners: Array<Listener>;
};
/**
 * 验证失败时提供给用户的一项操作(仅作为约定，可以执行根据需要调整)
 * 可以在这里传递，事件类型(onClick)，渲染类型(link)等，帮助控制具体的显示
 * */
export interface Action {
    /** 操作名称 */
    label: string;
    /** 可以在这里传递，事件类型(onClick)，渲染类型(link)等，帮助控制具体的显示 */
    [key: string]: any;
}
/** 验证器返回的结果 */
export interface ValidMeta {
    /** 该权限名称 */
    label: string;
    /** 该权限的文字描述 */
    desc?: string;
    /** 验证失败时提供给用户的一组操作 */
    actions?: Action[];
}
/** 验证器, 一旦验证器返回了ValidMeta或resolve了ValidMeta则该次验证视为不通过 */
export interface Validator<S> {
    (state: S, extra?: any): ValidMeta | Promise<ValidMeta | void> | void;
}
export interface Validators<S = AnyObject> {
    [key: string]: Validator<S>;
}
export interface SetState<S> {
    (patch: Partial<S>): void;
}
export interface CoverSetState<S> {
    (patch: S): void;
}
export declare type Listener<S extends object = AnyObject> = (changes: Partial<S>) => void;
export declare type Subscribe = (listener: Listener) => () => void;
/** 验证结束的回调 */
export interface Callback {
    (rejects: ValidMeta[] | null): void;
}
/** 验证结束的Promise */
export declare type PromiseBack = ValidMeta[] | null;
/** 用于验证的auth keys */
export declare type AuthKeys<V, C = AnyObject> = Array<keyof (V & C) | Array<keyof (V & C)>>;
export interface AuthConfig<S> {
    /** 传递给验证器的额外参数 */
    extra?: any;
    /** 局部验证器 */
    validators?: Validators<S>;
}
export interface Auth<S, V> {
    /** 更新state */
    setState: SetState<S & {
        [key: string]: any;
    }>;
    /** 以新state覆盖当前state */
    coverSetState: CoverSetState<S & {
        [key: string]: any;
    }>;
    /** 订阅state变更, 返回函数用于取消改订阅, 接收触发变更的state(setState传入的原始值) */
    subscribe: Subscribe;
    /** 获取当前的state */
    getState(): S;
    /**
     * @param authKeys - 所属权限, 如果数组项为数组则表示逻辑`or`
     * @param callback - 验证结束的回调
     *    回调接收:
     *      * pass 是否通过了所有指定的验证
     *      * rejects 未通过的验证器返回的元数据列表
     * @return - resolve callback同样参数对象的Promise，和callback二选一
     * */
    auth(authKeys: AuthKeys<V>, callback?: Callback): Promise<PromiseBack>;
    /**
     * @param authKeys - 所属权限, 如果数组项为数组则表示逻辑`or`
     * @param config - 配置
     * @param config.extra - 传递给验证器的额外参数
     * @param config.validators - 局部验证器
     * @param callback - 验证结束的回调
     *    回调接收:
     *      * pass 是否通过了所有指定的验证
     *      * rejects 未通过的验证器返回的元数据列表
     * @return - resolve callback同样参数对象的Promise，和callback二选一
     * */
    auth(authKeys: AuthKeys<V>, config: AuthConfig<S>, callback?: Callback): Promise<PromiseBack>;
}
export interface CreateKitConfig<S, V> {
    /** 中间件 */
    middleware?: (Middleware | null | undefined)[];
    /** 被所有验证器依赖的值组成的对象 */
    state?: S;
    /** 待注册的验证器 */
    validators?: V;
    /**
     * 如果一个验证未通过，则阻止后续验证
     * * 对于or中的子权限，即使开启了validFirst，依然会对每一项进行验证，但是只会返回第一个
     * * 在执行auth()时将优先级更高的权限key放到前面有助于提高验证反馈的精度, 如 login > vip, 因为vip状态是以登录状态为基础的
     *  */
    validFirst?: boolean;
}
export interface MiddlewareBonusInit {
    /** 是否为初始化阶段 */
    init: true;
    /** 当前创建配置(可能已被其他中间件修改过) */
    config: CreateKitConfig<any, any>;
    /** 在不同中间件中共享的对象，可以通过中间件特有的命名空间在其中存储数据 */
    ctx: AnyObject;
}
export interface MiddlewareBonusPatch {
    /** 是否为初始化阶段 */
    init: false;
    /** 当前的auth api(可能已被其他中间件修改过) */
    apis: Auth<any, any>;
    /** 为api添加增强补丁 */
    monkey: MonkeyHelper;
    /** 在不同中间件中共享的对象，可以通过中间件特有的命名空间在其中存储数据 */
    ctx: AnyObject;
}
export interface MonkeyHelper {
    <Name extends keyof Auth<any, any>>(name: Name, cb: (next: Auth<any, any>[Name]) => Auth<any, any>[Name]): void;
}
/**
 * 中间件函数。用于增强api、修改初始化配置
 * @param bonus - 为中间件提供的各种用于增强api的参数
 * @return 当处于初始化阶段时，返回值会作为新的config传递给下一个api, 非初始化阶段无返回值
 * */
export interface Middleware {
    (bonus: MiddlewareBonusPatch | MiddlewareBonusInit): CreateKitConfig<any, any> | void;
}
//# sourceMappingURL=types.d.ts.map