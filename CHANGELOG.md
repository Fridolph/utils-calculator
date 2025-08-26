# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### Features

* :sparkles: completed Calculator Class and utils ([bf7587c](https://github.com/Fridolph/utils-calculator/commit/bf7587c42f67c682d0ebc08480e70e9879912c96))
* :sparkles: 完善和添加了一些使用方法，和计算逻辑。添加了单元测试及用例（这个一加整个就复杂起来了） ([8f1c794](https://github.com/Fridolph/utils-calculator/commit/8f1c7949ffb4053096d6978b0f42b81b17bf4104))
* :sparkles: 添加公共方法： subtractMultiple , 用来做减法相关运算 ([e21b1ff](https://github.com/Fridolph/utils-calculator/commit/e21b1fffe8d5d789498134e8e0f48bb865a2d959))
* 一边对修改测试用例，同时修改 计算逻辑 ([a8784f0](https://github.com/Fridolph/utils-calculator/commit/a8784f0a3017ba573cb5a8673bbe95adca036fd4))


### Bug Fixes

* :bug: fix a  syntax error ([481760a](https://github.com/Fridolph/utils-calculator/commit/481760abb0721f3ddce38a0b06473d407ab9eb5e))
* **1:** :bug: 在 generateCacheKey 时，对普通对象按键排序后处理 ([cac8141](https://github.com/Fridolph/utils-calculator/commit/cac814166a65186a7816ef6a7aea49e298c000b3))
* **issue-2:** :card_file_box: 优化内部缓存命名的问题，从而提高性能 ([bc08f4e](https://github.com/Fridolph/utils-calculator/commit/bc08f4e195077233e211f8e797227c5d13150a7e))
* **issue-3:** :bug: 修改 computeRate 方法中的验证逻辑，使其能够正确处理 userRate 为 undefined 的情况 ([190f4d0](https://github.com/Fridolph/utils-calculator/commit/190f4d044dbcd6cf18e27477e84444b818e7c78d))
* **issue-6:** :bug: computeRate() 对无效 userRate 返回原始价格 ([9423509](https://github.com/Fridolph/utils-calculator/commit/94235096243d9efc1912b4cb7777ee54539c7410)), closes [//Users/fri/Desktop/utils-calculator/src/main.ts#L1119-L1165](https://github.com/Fridolph///Users/fri/Desktop/utils-calculator/src/main.ts/issues/L1119-L1165) [//Users/fri/Desktop/utils-calculator/src/main.ts#L1127-L1133](https://github.com/Fridolph///Users/fri/Desktop/utils-calculator/src/main.ts/issues/L1127-L1133)
* **issue-7:** :bug: computeRate() 正确应用 userRateType，避免提前返回 originPrice ([63175aa](https://github.com/Fridolph/utils-calculator/commit/63175aae49f468769a0f10e141a53b0eb7dee8ef)), closes [//Users/fri/Desktop/utils-calculator/src/main.ts#L468-L510](https://github.com/Fridolph///Users/fri/Desktop/utils-calculator/src/main.ts/issues/L468-L510) [//Users/fri/Desktop/utils-calculator/src/main.ts#L474-L480](https://github.com/Fridolph///Users/fri/Desktop/utils-calculator/src/main.ts/issues/L474-L480) [//Users/fri/Desktop/utils-calculator/src/tests/mainEdgeCases.test.ts#L86-L89](https://github.com/Fridolph///Users/fri/Desktop/utils-calculator/src/tests/mainEdgeCases.test.ts/issues/L86-L89)
