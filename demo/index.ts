import { createRandString } from '@lxjx/utils';
import create from '../src';
import cache from '../src/cacheMiddleware';
import devtool from '../src/devtoolMiddleware';

const kit = create({
  middleware: [
    cache('test_cache', {
      expire: 5000,
      testKey: key => ['name'].includes(key),
    }),
    cache('test_cache2', {
      type: 'local',
      expire: 70000,
      testKey: key => ['age'].includes(key),
    }),
    // cache('test_cache_local', {
    //   expire: 5000,
    // }),
    devtool,
  ],
  state: {
    name: 'lxj1',
    age: 17,
  },
  validators: {
    isLxj(deps, extr) {
      console.log(deps.name, extr);
      if (deps.name !== 'lxj') {
        return {
          label: '你不是lxj',
        };
      }
    },
    is18p(deps) {
      if (deps.age < 18) {
        return {
          label: '只能大于18岁用户使用',
        };
      }
    },
  },
});

// console.log(kit.getState());
//
// kit.subscribe(changeKeys => {
//   console.log(changeKeys, kit.getState());
// });
//
// kit.setState({
//   name: createRandString(),
// });
//
// kit.auth(
//   ['isLxj', 'isLxj2', 'is18p'],
//   {
//     extra: 'heh',
//     validators: {
//       isLxj2(deps, extr) {
//         console.log(222, deps.name, extr);
//         if (deps.name !== 'lxj') {
//           return {
//             label: '你不是lxj222',
//           };
//         }
//       },
//     },
//   },
//   rejects => {
//     console.log(rejects);
//
//     kit.setState({
//       name: 'lxj',
//     });
//
//     kit.auth(['isLxj', 'is18p'], rejects2 => {
//       console.log(rejects2);
//     });
//   },
// );
