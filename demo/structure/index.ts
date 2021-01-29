import create from '@lxjx/auth';
import { AtomState } from './type';
import initState from './initState';
import validators, { isRoot } from './validators';

const atom = create<AtomState, typeof validators>({
  state: initState,
  validators,
});

/* ✅ all type is fine */
atom.auth(['is18plus', 'isRoot'], rej => {
  console.log(rej);
});

atom.setState({
  name: 'jxl',
});

console.log(atom.getState().name);

const pass = isRoot(atom.getState());
