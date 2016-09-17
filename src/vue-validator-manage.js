/**
 * @file validate-manage.js
 * @description vue表单验证管理插件；依赖vue.js和vue-validator.js
 * @author tangciwei(tangciwei@qq.com)
 */
import u from 'underscore';

// 事件名
const FORM_VALID = 'form-valid';
const FORM_INVALID = 'form-invalid';
const FORM_TOUCHED = 'form-touched';
const FORM_UNTOUCHED = 'form-untouched';
const FORM_DIRTY = 'form-dirty';
const FORM_PRISTINE = 'form-pristine';
const FORM_MODIFIED = 'form-modified';

let assign = Object.assign ? Object.assign : u.extend;

let ValidateManage = {};

ValidateManage.install = (Vue, options) => {
    // 收集需要提交的数据的指令
    Vue.directive('fieldname', {
        params: ['v-model', 'v-text'],
        update(value) {
            // 表单提交的name值；
            let name = value;
            let vm = this.vm;
            let $root = vm.$root;

            // 初始化_fieldsData
            $root._fieldsData = $root._fieldsData || {};
            // name对应的v-model绑定的值
            // v-Model不存在的话，取v-text绑定的值
            let vModel = this.params.vModel;
            let vText = this.params.vText;
            vModel = vModel ? vModel : vText;
            if (vModel) {
                $root._fieldsData[name] = vm[vModel];

                vm.$watch(vModel, function(newVal, oldVal) {
                    $root._fieldsData[name] = newVal;
                });
            }

            /**
             * getFieldsData:获得需要提交的表单数据,
             * 每个表单field的数据都去掉前后空格了的。
             * @return {string} 返回值提交结果
             */

            $root.getFieldsData = function() {
                let data = $root._fieldsData;
                let result = '';

                Object.keys(data).forEach(key => {
                    let val = data[key];

                    if (data[key] && typeof data[key] === 'string') {
                        val = data[key].trim();
                    }
                    result += `${key}=${val}&`;
                });

                return result.slice(0, -1);
            };
        }
    });

    Vue.directive('fieldset', {
        bind() {
            let key = this.expression;
            let vm = this.vm;
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
                let directives = vm._directives;
                let result;

                directives.forEach(item => {
                    if (item.name === 'fieldset' && item.expression === key) {
                        // 指令对应的实例那个实例对象
                        result = item.el.__vue__;
                        return false;
                    }
                });

                return result || false;
            }

            let currentVm = findCurrentVm();

            // 这样才能得到$validation和_directives

            Vue.nextTick(() => {
                // 获取$validation名字
                let validatorName = findValidatorName(currentVm);

                changeValidation(vm, key, currentVm[validatorName]);

                if (currentVm) {
                    currentVm.$watch(validatorName, function(newVal, oldVal) {
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
        let { valid, invalid, touched, untouched, modified, dirty, pristine, errors } = $validation;

        let value = { valid, invalid, touched, untouched, modified, dirty, pristine, errors };

        vm.validation = assign({}, vm.validation, {
            [key]: value
        });

        // 更新验证结果；
        vm.collection.valid[key] = $validation.valid;
        vm.collection.touched[key] = $validation.touched;
        vm.collection.dirty[key] = $validation.dirty;
        vm.collection.modified[key] = $validation.modified;

        // 更新全局验证结果
        let validation = vm.validation;
        // 是否有效
        validation.valid = !$validation.valid
            ? false
            : !isExistOnff(vm.collection.valid, false);

        validation.invalid = !validation.valid;

        // 是否touched
        validation.touched = $validation.touched
            ? true
            : isExistOnff(vm.collection.touched, true);

        validation.untouched = !validation.touched;

        // 是否是dirty
        validation.dirty = $validation.dirty
            ? true
            : isExistOnff(vm.collection.dirty, true);

        validation.pristine = !validation.dirty;

        // 是否modified
        validation.modified = $validation.modified
            ? true
            : isExistOnff(vm.collection.modified, true);

    }

    /**
     * validations这个对象，是否**存在这样的键值**, 它等于传入的onOff
     * @param {Object} validations 被调用的对象
     * @param {Boolean} onOff 两种用法中的一种
     * @return {Boolean} 返回真假
     */

    function isExistOnff(validations, onOff) {

        return Object.keys(validations).some(

            key => {
                let result = validations[key] === onOff;
                return result;
            }

        );

    }

    /**
     * 获取验证名
     * @param {Object} vm vue实例
     * @return {String} 返回validatorName,如果没找到返回false
     */

    function findValidatorName(vm) {
        let result;
        let directives = vm._directives;
        directives.some(item => {
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
                return false;
            }
        } else {
            return result;
        }
    }

    /**
     * 派发事件
     * @param {Object} vm 监听的vue实例
     * @param {String} key 被监听的key值
     * @param {Array} eventNames 时间集合
     */

    function dispatchEvent(vm, key, eventNames) {
        vm.$watch(key, function(newVal, oldVal) {
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
export default ValidateManage;
