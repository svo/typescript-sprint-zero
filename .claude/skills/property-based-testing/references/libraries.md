# PBT Libraries by Language

This project's primary PBT library is **`fast-check`** (TypeScript/JavaScript). Other ecosystems are listed for context when discussing portability or alternative implementations.

## Recommended for This Project

| Library            | Use                                                             |
| ------------------ | --------------------------------------------------------------- |
| `fast-check`       | Core PBT library — generators, runners, shrinking               |
| `@fast-check/jest` | Jest integration providing `test.prop` and Jest-aware shrinking |

```bash
npm install --save-dev fast-check
npm install --save-dev @fast-check/jest   # optional
```

Detect existing usage in the codebase:

```bash
rg --type ts "from ['\"]fast-check['\"]"
rg --type ts "from ['\"]@fast-check/jest['\"]"
```

## Cross-Language Reference

| Language                | Library    | Setup                                            |
| ----------------------- | ---------- | ------------------------------------------------ |
| TypeScript / JavaScript | fast-check | `import fc from 'fast-check'`                    |
| Python                  | Hypothesis | `from hypothesis import given, strategies as st` |
| Rust                    | proptest   | `use proptest::prelude::*`                       |
| Rust                    | quickcheck | simpler API, per-type shrinking                  |
| Go                      | rapid      | `import "pgregory.net/rapid"`                    |
| Go                      | gopter     | ScalaCheck-style                                 |
| Java                    | jqwik      | `@Property` annotations                          |
| Scala                   | ScalaCheck | `import org.scalacheck._`                        |
| C#                      | FsCheck    | `using FsCheck`                                  |
| Elixir                  | StreamData | `use ExUnitProperties`                           |
| Haskell                 | QuickCheck | `import Test.QuickCheck`                         |
| Haskell                 | Hedgehog   | integrated shrinking, no type classes            |
| Clojure                 | test.check | `[clojure.test.check :as tc]`                    |
| Ruby                    | PropCheck  | `require 'prop_check'`                           |
| Kotlin                  | Kotest     | `io.kotest.property.*`                           |
| C++                     | RapidCheck | `#include <rapidcheck.h>`                        |

## Why fast-check for This Project

- Native TypeScript types — first-class typing for arbitraries
- Excellent shrinking — failing inputs reduce to small counterexamples automatically
- Integrates with Jest (the project's test runner) via `@fast-check/jest`
- Active maintenance and large library of built-in arbitraries (`fc.emailAddress()`, `fc.uuid()`, etc.)
- No additional runtime — dev-dependency only

## Smart Contract Testing

Out of scope for this project (no Solidity/EVM code). For reference:

| Tool    | Type   | Description                             |
| ------- | ------ | --------------------------------------- |
| Echidna | Fuzzer | Property-based fuzzer for EVM contracts |
| Medusa  | Fuzzer | Next-gen fuzzer with parallel execution |

## Detecting Existing Usage

```bash
# This project (TypeScript)
rg --type ts "from 'fast-check'" src/ test/

# Other languages (cross-project diagnostic)
rg "from hypothesis import" --type py
rg "use proptest" --type rust
rg "@Property" --type java
```
