import { AnyObject } from '@lxjx/utils';
import { Auth, CreateKitConfig, SetState, Validators, Share, CoverSetState } from './types';
import { authImpl, middlewareImpl, subscribeImpl } from './common';

export default function create<
  S extends AnyObject = AnyObject,
  V extends Validators<S> = Validators<S>
>(conf: CreateKitConfig<S, V>): Auth<S, V> {
  const [config, patchHandle] = middlewareImpl(conf);

  const { state, validators, validFirst = true } = config;

  const share: Share<S, V> = {
    state: { ...state! },
    validators,
    validFirst,
    listeners: [],
  };

  const setState: SetState<S> = patch => {
    share.state = { ...share.state!, ...patch };
    /** 触发listener */
    share.listeners.forEach(listener => listener(patch));
  };

  const coverSetState: CoverSetState<S> = patch => {
    share.state = { ...patch };
    /** 触发listener */
    share.listeners.forEach(listener => listener(patch));
  };

  const auth = authImpl(share);

  const subscribe = subscribeImpl(share);

  const apis = {
    subscribe,
    auth,
    setState,
    coverSetState,
    getState: () => share.state!,
  };

  patchHandle && patchHandle(apis);

  return apis;
}
