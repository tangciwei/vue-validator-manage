'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _vue = require('vue');

var _vue2 = _interopRequireDefault(_vue);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _utf = require('utf8');

var _utf2 = _interopRequireDefault(_utf);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @file validate-manage.js
                                                                                                                                                                                                                   * @description vue表单验证管理插件；依赖vue.js和vue-validator.js
                                                                                                                                                                                                                   * @author tangciwei(tangciwei@qq.com)
                                                                                                                                                                                                                   */

// base64加密


// 事件名
var FORM_VALID = 'form-valid';
var FORM_INVALID = 'form-invalid';
var FORM_TOUCHED = 'form-touched';
var FORM_UNTOUCHED = 'form-untouched';
var FORM_DIRTY = 'form-dirty';
var FORM_PRISTINE = 'form-pristine';
var FORM_MODIFIED = 'form-modified';

var assign = Object.assign ? Object.assign : _underscore2.default.extend;

var ValidateManage = {};

ValidateManage.install = function (Vue, options) {
    // 收集需要提交的数据的指令
    Vue.directive('fieldname', {
        params: ['v-model', 'v-text', 'base64'],
        update: function update(value) {
            // 表单提交的name值；
            var name = value;

            if (_underscore2.default.isUndefined(value)) {
                name = this.expression;
            }

            if (name === '') {
                return false;
            }

            var vm = this.vm;
            var $root = vm.$root;

            /**
             * fieldsData 自主扩展
             *
             */
            // 初始化_fieldsData
            if (!$root.fieldsData) {
                $root.$set('fieldsData', {});
            }
            /**
             * name对应的v-model绑定的值
             * v-Model不存在的话，取v-text绑定的值
             */
            var _params = this.params,
                vModel = _params.vModel,
                vText = _params.vText;

            var hasBase64 = this.params.base64 ? true : false;
            vModel = vModel ? vModel : vText;

            if (vModel) {
                var nameVal = hasBase64 ? encodeURIComponent(_base2.default.encode(_utf2.default.encode(vm[vModel]))) : vm[vModel];

                $root.fieldsData = assign({}, $root.fieldsData, _defineProperty({}, name, nameVal));

                vm.$watch(vModel, function (newVal, oldVal) {

                    $root.fieldsData[name] = hasBase64 ? encodeURIComponent(_base2.default.encode(_utf2.default.encode(newVal))) : newVal;
                });
            }

            /**
             * getFieldsData:获得需要提交的表单数据,
             * 每个表单field的数据都去掉前后空格了的。
             * collectEmpty: 是否收集字段值为空的信息
             * @return {string} 返回值提交结果
             */
            $root.getFieldsData = function () {
                var collectEmpty = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                var data = $root.fieldsData;
                var result = {};

                // TODO: 得到所有表单域数据
                Object.keys(data).forEach(function (key) {
                    var val = data[key];

                    if (data[key] && typeof data[key] === 'string') {
                        val = data[key].trim();
                    }
                    if (key) {
                        if (typeof val === 'string' && val || collectEmpty) {
                            result[key] = val;
                        }
                    }
                });

                return JSON.parse(JSON.stringify(result));
            };
        }
    });

    Vue.directive('fieldset', {
        params: ['vfor'],
        update: function update(value) {
            var key = value;

            if (value === undefined) {
                key = this.expression;
            }

            if (key === '') {
                return false;
            }

            var vm = this.vm;
            var $root = vm.$root;
            // 修复for循环bug
            var vfor = this.params.vfor ? true : false;

            // 所有的验证结果都放到这个对象上面的；
            if (!$root.validation) {
                $root.$set('validation', {
                    valid: false,
                    invalid: true,
                    touched: false,
                    untouched: true,
                    modified: false,
                    dirty: false,
                    pristine: true,
                    // 异步结果
                    asyncDetail: {},
                    // 异步总结果:'true'/'false'/'init'/'loading'
                    asyncResult: 'true'
                });
            }

            // 验证结果集合
            $root.collection = {
                valid: {},
                touched: {},
                dirty: {},
                modified: {}
            };

            /**
             * validations这个对象，是否**存在这样的键值**, 它等于传入的onOff
             * @param {Object} validations 被调用的对象
             * @param {Boolean} onOff 两种用法中的一种
             * @return {Boolean} 返回真假
             */

            var isExistOnff = function isExistOnff(validations, onOff) {
                return Object.keys(validations).some(function (key) {
                    return validations[key] === onOff;
                });
            };

            /**
             * 获取验证名
             * @param {Object} vm vue实例
             * @return {string} 返回validatorName,如果没找到返回false
             */

            var findValidatorName = function findValidatorName(vm) {
                var result = '';
                var directives = vm._directives;

                directives.some(function (item) {
                    if (item.validatorName) {
                        result = item.validatorName;
                        return true;
                    }
                });
                // 如果上述方法不生效。（因为有时候指令数组并不能获到）
                if (!result) {
                    var keys = Object.keys(vm._validatorMaps);

                    if (keys.length) {
                        return keys[0];
                    } else {
                        return '';
                    }
                }

                return result;
            };

            /**
             * 派发事件
             * @param {Object} vm 监听的vue实例
             * @param {string} key 被监听的key值
             * @param {Array} eventNames 时间集合
             */

            var dispatchEvent = function dispatchEvent(vm, key, eventNames) {
                vm.$watch(key, function (newVal, oldVal) {
                    if (newVal) {
                        this.$emit(eventNames[0]);
                    } else {
                        eventNames[1] && this.$emit(eventNames[1]);
                    }
                });
            };
            // TODO: 耗性能，后期优化
            var copyVm = assign({}, vm);

            // 找到v-fieldset指令对应的那个实例对象；
            var findCurrentVm = function findCurrentVm() {
                var directives = vm._directives;
                var result = void 0;

                directives.forEach(function (item) {
                    if (item.name === 'fieldset') {
                        var isOk = false;
                        // 字面量的情况
                        if (!value && item.expression === key) {
                            isOk = true;
                            // 变量情况
                        } else if (value) {

                            if (vfor) {
                                copyVm = value;
                            } else {
                                var arr = item.expression.split('.');

                                arr.forEach(function (val) {
                                    copyVm = copyVm[val];
                                });
                            }

                            if (copyVm === key) {
                                isOk = true;
                            }
                        }

                        if (isOk) {
                            result = item.el.__vue__;
                            return false;
                        }
                    }
                });

                return result || false;
            };

            var currentVm = findCurrentVm();
            // 这样才能得到$validation和_directives
            /**
             * changeValidation:$validation发生变化时执行，更新所有验证结果；
              * @param {Object} $validation 被监听vm.$validation
             */

            var changeValidation = function changeValidation(vm, key, $validation) {

                /**
                 * 关于验证结果结构见vue-validator官网：http://vuejs.github.io/vue-validator/zh-cn/structure.html
                 */

                // v-fieldset指令对应值的结果；
                var valid = $validation.valid,
                    invalid = $validation.invalid,
                    touched = $validation.touched,
                    untouched = $validation.untouched,
                    modified = $validation.modified,
                    dirty = $validation.dirty,
                    pristine = $validation.pristine,
                    errors = $validation.errors;

                var value = {
                    valid: valid, invalid: invalid, touched: touched,
                    untouched: untouched, modified: modified, dirty: dirty,
                    pristine: pristine, errors: errors
                };

                vm.validation = assign({}, vm.validation, _defineProperty({}, key, value));

                // 更新验证结果；
                vm.collection.valid[key] = $validation.valid;
                vm.collection.touched[key] = $validation.touched;
                vm.collection.dirty[key] = $validation.dirty;
                vm.collection.modified[key] = $validation.modified;

                // 更新全局验证结果
                var validation = vm.validation;
                // 是否有效
                validation.valid = $validation.valid ? !isExistOnff(vm.collection.valid, false) : false;

                validation.invalid = !validation.valid;

                // 是否touched
                validation.touched = $validation.touched ? true : isExistOnff(vm.collection.touched, true);

                validation.untouched = !validation.touched;

                // 是否是dirty
                validation.dirty = $validation.dirty ? true : isExistOnff(vm.collection.dirty, true);

                validation.pristine = !validation.dirty;

                // 是否modified
                validation.modified = $validation.modified ? true : isExistOnff(vm.collection.modified, true);
            };
            // 根据某项异步验证状态更新全局异步状态
            var asyncResult = function asyncResult(asyncDetail, value) {
                var result = 'true';
                if (value === 'false') {
                    result = 'false';
                } else {
                    var asyncKeys = Object.keys(asyncDetail);
                    var hasFalse = asyncKeys.some(function (key) {
                        return asyncDetail[key] === 'false';
                    });
                    if (hasFalse) {
                        result = 'false';
                    } else {
                        var allTrue = asyncKeys.every(function (key) {
                            return asyncDetail[key] === 'true';
                        });

                        if (allTrue) {
                            result = 'true';
                        } else {
                            var allLoading = asyncKeys.every(function (key) {
                                return asyncDetail[key] === 'loading';
                            });
                            if (allLoading) {
                                result = 'loading';
                            } else {
                                result = 'init';
                            }
                        }
                    }
                }
                return result;
            };

            // 异步总结果asyncResult:'true'/'false'/'init'/'loading'
            var changeAsync = function changeAsync($root, key, value) {
                $root.validation.asyncDetail[key] = value;
                $root.validation.asyncResult = asyncResult($root.validation.asyncDetail, value);
            };

            Vue.nextTick(function () {
                // 获取$validation名字
                var validatorName = findValidatorName(currentVm);

                changeValidation($root, key, currentVm[validatorName]);

                if (currentVm) {
                    currentVm.$watch(validatorName, function (newVal, oldVal) {
                        changeValidation($root, key, newVal);
                    }, { deep: true });
                    /**
                     * TODO:实验阶段,耦合show.js。解决目前异步验证方案,待优化
                     */
                    if (currentVm.$parent.hasAsync) {
                        $root.validation.asyncDetail = assign({}, $root.validation.asyncDetail, _defineProperty({}, key, 'init'));
                        $root.validation.asyncResult = 'init';

                        currentVm.$parent.$watch('asyncState', function (newVal, oldVal) {
                            changeAsync($root, key, newVal);
                        });
                    }
                }
            });

            // vm元素派发事件,只执行一次
            if (!vm.dispatchValidationOnce) {
                dispatchEvent($root, 'validation.valid', [FORM_VALID, FORM_INVALID]);
                dispatchEvent($root, 'validation.touched', [FORM_TOUCHED, FORM_UNTOUCHED]);
                dispatchEvent($root, 'validation.dirty', [FORM_DIRTY, FORM_PRISTINE]);
                dispatchEvent($root, 'validation.modified', [FORM_MODIFIED]);
                vm.dispatchValidationOnce = true;
            }
        }
    });
};

_vue2.default.use(ValidateManage);

exports.default = ValidateManage;