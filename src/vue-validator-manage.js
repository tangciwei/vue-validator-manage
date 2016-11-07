/**
 * @file validate-manage.js
 * @description vue表单验证管理插件；依赖vue.js和vue-validator.js
 * @author tangciwei(tangciwei@qq.com)
 */

import Vue from 'vue';
import u from 'underscore';
// base64加密
import base64 from 'base-64';
import utf8 from 'utf8';

// 事件名
const FORM_VALID = 'form-valid';
const FORM_INVALID = 'form-invalid';
const FORM_TOUCHED = 'form-touched';
const FORM_UNTOUCHED = 'form-untouched';
const FORM_DIRTY = 'form-dirty';
const FORM_PRISTINE = 'form-pristine';
const FORM_MODIFIED = 'form-modified';

let assign = Object.assign
    ? Object.assign
    : u.extend;

let ValidateManage = {};

ValidateManage.install = (Vue, options) => {
    // 收集需要提交的数据的指令
    Vue.directive('fieldname', {
        params: ['v-model', 'v-text', 'base64'],
        update(value, oldVal) {
            // 表单提交的name值；
            let name = value;
            // 旧值
            let oldName = oldVal;
            let vm = this.vm;
            let $root = vm.$root;

            // 一定要是未定义
            if (u.isUndefined(value)) {
                name = this.expression;
            }

            if (u.isUndefined(oldVal)) {
                oldName = this.expression;
            }

            // 删除旧值
            if (oldName && oldName === name) {
                delete $root._fieldsData[oldName];
            }
            // 初始化，防止调用报错
            $root.getFieldsData = $root.getFieldsData || function () {};
            $root._fieldsData = $root._fieldsData || {};
            $root.fieldsData = $root.fieldsData || {};

            /**
             * name对应的v-model绑定的值
             * v-Model不存在的话，取v-text绑定的值
             */
            let hasBase64 = this.params.base64 ? true : false;
            let { vModel, vText } = this.params;
            vModel = vModel ? vModel : vText;
            if (vModel) {
                let nameVal = hasBase64
                    ? encodeURIComponent(base64.encode(utf8.encode(vm[vModel])))
                    : vm[vModel];

                if (name) {
                    $root._fieldsData[name] = nameVal;
                    $root.fieldsData = assign({}, $root.fieldsData, {
                        [name]: nameVal
                    });
                }

                vm.$watch(vModel, (newVal, oldVal) => {
                    // 旧值删除
                    if (oldName && oldName === name) {
                        delete $root._fieldsData[oldName];
                        $root.fieldsData[oldName] = '';
                    }
                    else if (name !== 'fieldname') {
                        $root._fieldsData[name] = hasBase64
                            ? encodeURIComponent(base64.encode(utf8.encode(newVal)))
                            : newVal;
                        $root.fieldsData[name] = $root._fieldsData[name];
                    }
                });

            }

            /**
             * getFieldsData:获得需要提交的表单数据,
             * 每个表单field的数据都去掉前后空格了的。
             * collectEmpty: 是否收集字段值为空的信息
             * @return {string} 返回值提交结果
             */
            $root.getFieldsData = (collectEmpty = false) => {
                let data = $root._fieldsData;
                let result = {};
                // TODO: 得到所有表单域数据
                Object.keys(data).forEach(key => {
                    let val = data[key];

                    if (data[key] && typeof data[key] === 'string') {
                        val = data[key].trim();
                    }
                    if (key) {
                        if(typeof val === 'string' && val || collectEmpty) {
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
        update(value) {
            let key = value;
            
            if (value === undefined ) {
                key = this.expression;
            }

            if (key === '') {
                return false;
            }

            let vm = this.vm;
            let $root = vm.$root;
            // 修复for循环bug
            let vfor = this.params.vfor ? true : false;

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

            let isExistOnff = (validations, onOff) => {
                return Object.keys(validations)
                    .some(key => validations[key] === onOff);
            };

            /**
             * 获取验证名
             * @param {Object} vm vue实例
             * @return {string} 返回validatorName,如果没找到返回false
             */

            let findValidatorName = vm => {
                let result = '';
                let directives = vm._directives;

                directives.some(item => {
                    if (item.validatorName) {
                        result = item.validatorName;
                        return true;
                    }
                });
                // 如果上述方法不生效。（因为有时候指令数组并不能获到）
                if (!result) {
                    let keys = Object.keys(vm._validatorMaps);

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

            let dispatchEvent = (vm, key, eventNames) => {
                vm.$watch(key, function (newVal, oldVal) {
                    if (newVal) {
                        this.$emit(eventNames[0]);
                    } else {
                        eventNames[1] && this.$emit(eventNames[1]);
                    }
                });
            };
            // TODO: 耗性能，后期优化
            let copyVm = assign({}, vm);

            // 找到v-fieldset指令对应的那个实例对象；
            let findCurrentVm = () => {
                let directives = vm._directives;
                let result;

                directives.forEach(item => {
                    if (item.name === 'fieldset') {
                        let isOk = false;
                        // 字面量的情况
                        if (!value && item.expression === key) {
                            isOk = true;
                        // 变量情况
                        } else if (value) {

                            if (vfor) {
                                copyVm = value;
                            }
                            else {
                                let arr = item.expression.split('.');

                                arr.forEach(val => {
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

            let currentVm = findCurrentVm();
            // 这样才能得到$validation和_directives
            /**
             * changeValidation:$validation发生变化时执行，更新所有验证结果；

             * @param {Object} $validation 被监听vm.$validation
             */

            let changeValidation = (vm, key, $validation) => {

                /**
                 * 关于验证结果结构见vue-validator官网：http://vuejs.github.io/vue-validator/zh-cn/structure.html
                 */

                // v-fieldset指令对应值的结果；
                let {valid, invalid, touched, untouched, modified, dirty, pristine, errors} = $validation;
                let value = {
                        valid, invalid, touched,
                        untouched, modified, dirty,
                        pristine, errors
                    };

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
                validation.valid = $validation.valid
                    ? !isExistOnff(vm.collection.valid, false)
                    : false;

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
            };
            // 根据某项异步验证状态更新全局异步状态
            let asyncResult = (asyncDetail, value) => {
                let result = 'true'
                if (value === 'false') {
                    result = 'false';
                }
                else {
                    let asyncKeys = Object.keys(asyncDetail);
                    let hasFalse = asyncKeys.some(key => asyncDetail[key] === 'false');
                    if (hasFalse) {
                        result = 'false';
                    }
                    else {
                        let allTrue = asyncKeys.every(key => asyncDetail[key] === 'true');

                        if (allTrue) {
                            result = 'true';
                        }
                        else {
                            let allLoading = asyncKeys.every(key => asyncDetail[key] === 'loading');
                            if (allLoading) {
                                result = 'loading';
                            }
                            else {
                                result = 'init';
                            }
                        }
                    }
                }
                return result;
            };

            // 异步总结果asyncResult:'true'/'false'/'init'/'loading'
            let changeAsync = ($root, key, value) => {
                $root.validation.asyncDetail[key] = value;
                $root.validation.asyncResult = asyncResult($root.validation.asyncDetail, value);
            };

            Vue.nextTick(() => {
                // 获取$validation名字
                let validatorName = findValidatorName(currentVm);

                changeValidation($root, key, currentVm[validatorName]);

                if (currentVm) {
                    currentVm.$watch(
                        validatorName,
                        (newVal, oldVal) => {
                            changeValidation($root, key, newVal);
                        },
                        {deep: true}
                    );
                    /**
                     * TODO:实验阶段,耦合show.js。解决目前异步验证方案,待优化
                     */
                    if(currentVm.$parent.hasAsync){
                        $root.validation.asyncDetail = assign({}, $root.validation.asyncDetail, {
                            [key]: 'init'
                        });
                        $root.validation.asyncResult = 'init';

                        currentVm.$parent.$watch('asyncState',(newVal,oldVal)=>{
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

Vue.use(ValidateManage);

export default ValidateManage;
