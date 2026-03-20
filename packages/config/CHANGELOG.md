## 0.1.0 (2026-03-20)

### Features

- **types:** ✨ add DeepReadonly and UnionToIntersection types ([79439ad](https://github.com/mikecoj/nestx-advanced-packages/commit/79439ad))
- **config:** ✨ enhance config interfaces with type imports and new types ([da88926](https://github.com/mikecoj/nestx-advanced-packages/commit/da88926))
- **config:** ✨ add lint, format, and check commands to targets ([1c5bddd](https://github.com/mikecoj/nestx-advanced-packages/commit/1c5bddd))
- **config:** ✨ add index file for advanced configuration exports ([ec74c01](https://github.com/mikecoj/nestx-advanced-packages/commit/ec74c01))
- **advanced-config:** ✨ add integration tests for configuration loading ([0ee45c7](https://github.com/mikecoj/nestx-advanced-packages/commit/0ee45c7))
- **advanced-config:** ✨ implement AdvancedConfigModule with core methods ([f56c140](https://github.com/mikecoj/nestx-advanced-packages/commit/f56c140))
- **config:** ✨ implement ConfigService with core methods ([26c7359](https://github.com/mikecoj/nestx-advanced-packages/commit/26c7359))
- **advanced-config:** ✨ implement defineConfig function with validation ([7a6246b](https://github.com/mikecoj/nestx-advanced-packages/commit/7a6246b))
- **config:** ✨ implement ConfigStore with registration and retrieval methods ([4f2b61c](https://github.com/mikecoj/nestx-advanced-packages/commit/4f2b61c))
- **constants:** ✨ add ADVANCED_CONFIG_OPTIONS and CONFIG_STORE symbols ([8907c8c](https://github.com/mikecoj/nestx-advanced-packages/commit/8907c8c))
- **advanced-config:** ✨ implement EnvSource class with environment variable utilities ([f9dcdfb](https://github.com/mikecoj/nestx-advanced-packages/commit/f9dcdfb))
- **advanced-config:** ✨ add deepFreeze and maskSecrets utilities with tests ([d107b88](https://github.com/mikecoj/nestx-advanced-packages/commit/d107b88))
- **advanced-config:** ✨ add recursive type utilities for path access ([7f8d9fb](https://github.com/mikecoj/nestx-advanced-packages/commit/7f8d9fb))
- **config:** ✨ add interfaces for advanced configuration options ([a2f9dde](https://github.com/mikecoj/nestx-advanced-packages/commit/a2f9dde))
- **advanced-config:** ✨ add initial implementation of advanced-config package ([#1](https://github.com/mikecoj/nestx-advanced-packages/issues/1))

### Bug Fixes

- **advanced-config:** 🐛 improve error messages for non-numeric and non-boolean values ([f30fd82](https://github.com/mikecoj/nestx-advanced-packages/commit/f30fd82))
- **advanced-config:** switch to @nx/js:swc executor, add @swc/cli dep ([a1d91f9](https://github.com/mikecoj/nestx-advanced-packages/commit/a1d91f9))
- **config:** align tsconfig.lib.json outDir/rootDir with @nx/js:tsc executor output ([373a5fc](https://github.com/mikecoj/nestx-advanced-packages/commit/373a5fc))
- **env-source:** 🐛 simplify error message formatting for number validation ([200fb88](https://github.com/mikecoj/nestx-advanced-packages/commit/200fb88))

### Code Refactoring

- **advanced-config:** ♻️ enhance configuration and build settings ([9bd9aaa](https://github.com/mikecoj/nestx-advanced-packages/commit/9bd9aaa))
- **advanced-config:** ♻️ improve config handling and error reporting ([5740996](https://github.com/mikecoj/nestx-advanced-packages/commit/5740996))
- **advanced-config:** ♻️ remove unused getByPath export from utils ([d59c98b](https://github.com/mikecoj/nestx-advanced-packages/commit/d59c98b))
- **advanced-config:** ♻️ remove unused strict and cache options ([68ff92b](https://github.com/mikecoj/nestx-advanced-packages/commit/68ff92b))

### Documentation

- **README:** 📝 improve table formatting for better readability ([be9fda6](https://github.com/mikecoj/nestx-advanced-packages/commit/be9fda6))

### ❤️ Thank You

- Mihail Cojocari @mihail-cojocari
- mikecoj