import { AnyObject } from '@lxjx/utils';
import { Auth, CreateKitConfig, Validators } from './types';
export default function create<S extends AnyObject = AnyObject, V extends Validators<S> = Validators<S>>(conf: CreateKitConfig<S, V>): Auth<S, V>;
//# sourceMappingURL=create.d.ts.map