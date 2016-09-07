/* eslint-disable */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /**
                                                                                                                                                                                                                   * @file validate-manage.js
                                                                                                                                                                                                                   * @description vue表单验证管理插件；依赖vue.js和vue-validator.js
                                                                                                                                                                                                                   * @author tangciwei(tangciwei@baidu.com)
                                                                                                                                                                                                                   */


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
        params: ['v-model'],
        bind: function bind() {
            // 表单提交的name值；
            var name = this.expression;

            // name对应的v-model绑定的值；
            var vModel = this.params.vModel;
            var vm = this.vm;
            var $root = vm.$root;

            // 初始化_fieldsData
            $root._fieldsData = $root._fieldsData || {};

            if (vModel) {
                $root._fieldsData[name] = vm[vModel];

                vm.$watch(vModel, function (newVal, oldVal) {
                    $root._fieldsData[name] = newVal;
                });
            }

            /**
             * getFieldsData:获得需要提交的表单数据,
             * 每个表单field的数据都去掉前后空格了的。
             * @return {string} 返回值提交结果
             */

            $root.getFieldsData = function () {
                var data = $root._fieldsData;
                var result = '';

                Object.keys(data).forEach(function (key) {
                    result += key + '=' + data[key].trim() + '&';
                });

                return result.slice(0, -1);
            };
        }
    });

    Vue.directive('fieldset', {
        bind: function bind() {
            var key = this.expression;
            var vm = this.vm;
            // 所有的验证结果都放到这个对象上面的；
            if (!vm.validation) {
                vm.$set('validation', {
                    valid: false,
                    invalid: true,
                    touched: false,
                    untouched: true,
                    modified: false,
                    dirty: false,
                    pristine: true
                });
            }
            // 验证结果集合
            vm.collection = {
                valid: {},
                touched: {},
                dirty: {},
                modified: {}
            };
            // 找到v-fieldset指令对应的那个实例对象；
            function findCurrentVm() {
                var directives = vm._directives;
                var result = void 0;

                directives.forEach(function (item) {
                    if (item.name === 'fieldset' && item.expression === key) {
                        // 指令对应的实例那个实例对象
                        result = item.el.__vue__;
                        return false;
                    }
                });

                return result || false;
            }

            var currentVm = findCurrentVm();

            // 这样才能得到$validation和_directives

            Vue.nextTick(function () {
                // 获取$validation名字
                var validatorName = findValidatorName(currentVm._directives);

                changeValidation(vm, key, currentVm[validatorName]);

                if (currentVm) {
                    currentVm.$watch(validatorName, function (newVal, oldVal) {
                        changeValidation(vm, key, newVal);
                    }, {
                        deep: true
                    });
                }
            });

            // vm元素派发事件,只执行一次
            if (!vm.dispatchValidationOnce) {
                dispatchEvent(vm, 'validation.valid', [FORM_VALID, FORM_INVALID]);
                dispatchEvent(vm, 'validation.touched', [FORM_TOUCHED, FORM_UNTOUCHED]);
                dispatchEvent(vm, 'validation.dirty', [FORM_DIRTY, FORM_PRISTINE]);
                dispatchEvent(vm, 'validation.modified', [FORM_MODIFIED]);
                vm.dispatchValidationOnce = true;
            }
        }
    });

    /**
     * $validation发生变化时执行，更新所有验证结果；
     * @param {Object} $validation 被监听vm.$validation
     */

    function changeValidation(vm, key, $validation) {

        // 关于验证结果结构见vue-validator官网：http://vuejs.github.io/vue-validator/zh-cn/structure.html
        // v-fieldset指令对应值的结果；
        var valid = $validation.valid;
        var invalid = $validation.invalid;
        var touched = $validation.touched;
        var untouched = $validation.untouched;
        var modified = $validation.modified;
        var dirty = $validation.dirty;
        var pristine = $validation.pristine;
        var errors = $validation.errors;


        var value = { valid: valid, invalid: invalid, touched: touched, untouched: untouched, modified: modified, dirty: dirty, pristine: pristine, errors: errors };

        vm.validation = assign({}, vm.validation, _defineProperty({}, key, value));

        // 更新验证结果；
        vm.collection.valid[key] = $validation.valid;
        vm.collection.touched[key] = $validation.touched;
        vm.collection.dirty[key] = $validation.dirty;
        vm.collection.modified[key] = $validation.modified;

        // 更新全局验证结果
        var validation = vm.validation;
        // 是否有效
        validation.valid = !$validation.valid ? false : !isExistOnff(vm.collection.valid, false);

        validation.invalid = !validation.valid;

        // 是否touched
        validation.touched = $validation.touched ? true : isExistOnff(vm.collection.touched, true);

        validation.untouched = !validation.touched;

        // 是否是dirty
        validation.dirty = $validation.dirty ? true : isExistOnff(vm.collection.dirty, true);

        validation.pristine = !validation.dirty;

        // 是否modified
        validation.modified = $validation.modified ? true : isExistOnff(vm.collection.modified, true);
    }

    /**
     * validations这个对象，是否**存在这样的键值**, 它等于传入的onOff
     * @param {Object} validations 被调用的对象
     * @param {Boolean} onOff 两种用法中的一种
     * @return {Boolean} 返回真假
     */

    function isExistOnff(validations, onOff) {

        return Object.keys(validations).some(function (key) {
            var result = validations[key] === onOff;
            return result;
        });
    }

    /**
     * 获取验证名
     * @param {Array} directives 指令的数据集合
     * @return {String} 返回validatorName,如果没找到返回false
     */

    function findValidatorName(directives) {
        var result = void 0;

        directives.some(function (item) {
            if (item.validatorName) {
                result = item.validatorName;
                return true;
            }
        });

        return result || false;
    }

    /**
     * 派发事件
     * @param {Object} vm 监听的vue实例
     * @param {String} key 被监听的key值
     * @param {Array} eventNames 时间集合
     */

    function dispatchEvent(vm, key, eventNames) {
        vm.$watch(key, function (newVal, oldVal) {
            if (newVal) {
                this.$dispatch(eventNames[0]);
            } else {
                eventNames[1] && this.$dispatch(eventNames[1]);
            }
        });
    }
};

if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(ValidateManage);
}
exports.default = ValidateManage;