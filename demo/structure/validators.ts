import { Validator } from '@lxjx/auth';
import { AtomState } from './type';

export const isRoot: Validator<AtomState> = state => {
  if (state.name !== 'lxj') {
    return {
      label: 'sorry! ur not root',
    };
  }
};

export const is18plus: Validator<AtomState> = state => {
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
