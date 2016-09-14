##插件要解决的问题

> 解决vue-validator插件不能用于自定义组件的问题。

####使用validator插件时会遇到这样的问题

```
// 使用
<validator name="validation">
  <mycomponent></mycomponent>
</validator>
<template id="template">
    <div>
       <input type="text" v-validate:username="['required']">
    </div>
</template>
// js部分
Vue.component('mycomponent',{
    template: '#template'
});
// result结果 
Uncaught TypeError: Cannot read property 'manageValidation' of undefined 
```
结论：vue-validator无法管理自定义组件的验证。

####本插件主要为了解决上述问题。

- 引入本插件，**每一个自定义组件需要采用vue-validator的用法**。
- 再给自定义组件用上**v-fieldset指令**，这样就可以把这些自定义组件归为一组，统一验证管理了。
- 并且还可以给表单元素写上**v-fieldname指令，配合v-model指令**。这样就可以收集需要提交的数据，可以通过调用vue实例的getFieldsData方法得到。

```
// 使用
<div id="app">
  <my-component v-fieldset="aaa"></my-component>
  <my-component2 v-fieldset="bbb"></my-component2>
  <input type="submit" v-if="validation.valid" @click="submit">
  <h2>验证结果：</h2>
  <pre>{{validation|json}}</pre>
</div>  

// 自定义组件模板部分，使用v-fieldname会收集此表单的数据，以v-fieldname的值为key,以v-model的值为value.
<template id="template">
    <div>
        <validator name="validation">
            <input type="text" v-fieldname="username" v-validate:username="['required']">
        </validator>
    </div>
</template>
<template id="template2">
    <div>
        <validator name="validation">
            <input type="text" v-fieldname="username2" v-validate:username2="['required']">
        </validator>
    </div>
</template>

// js部分
Vue.component('mycomponent',{
    template: '#template',
    data:function(){
      return {
        username:""
      }
    }
});
Vue.component('mycomponent2',{
    template: '#template2',
        data:function(){
      return {
        username2:""
      }
    }
});
new Vue({
   el: '#app',
    data: {
        validation: {},
    },
    methods: {
        submit: function() {
          // 会得到使用v-fieldname指令的表单数据
            console.log(this.getFieldsData());
        }
    }
})
```

##指令

###v-fieldname

表单提交的name值，配合v-model使用,和v-model的值绑定。
对于普通的标签，如果没有v-model，需要有v-text指令，和v-text指令的内容绑定

###v-fieldset

表单分组名，每一个业务组件，凡是有需要提交的数据，都需要加这个字段；
例：
```
<my-component v-fieldset="aaa"></my-component>
```

##validation

###字段验证结果

- valid: 字段有效时返回 true,否则返回 false。
- invalid: valid 的逆.
- touched: 字段获得过焦点时返回 true,否则返回 false。
- untouched: touched 的逆.
- modified: 字段值与初始值不同时返回 true,否则返回 false。
- dirty: 字段值改变过至少一次时返回 true,否则返回 false。
- pristine: dirty 的逆.
- errors: 字段无效时返回存有错误信息的数据，否则返回 undefined。

###全局结果

- valid: 所有字段都有效时返回 true,否则返回 false。
- invalid: 只要存在无效字段就返回 true,否则返回 false。
- touched: 只要存在获得过焦点的字段就返回 true,否则返回 false。
- untouched: touched 的逆。
- modified: 只要存在与初始值不同的字段就返回 true,否则返回 false。
- dirty: 只要存在值改变过至少一次的字段就返回 true,否则返回 false。
- pristine: 所有字段都没有发生过变化时返回 true,否则返回 false。
```
{
  // 整体验证结果
  "valid": false,
  "invalid": true,
  "touched": false,
  "untouched": true,
  "dirty": false,
  "pristine": true,
  "modified": false,
  // fieldset=='aaa'字段的验证结果
  "aaa": {
    "valid": false,
    "invalid": true,
    "touched": false,
    "untouched": true,
    "modified": false,
    "dirty": false,
    "pristine": true,
    "errors": [ 
      {
        "field": "username2",
        "validator": "required",
        "message": "required you name !!"
      }
    ]
  },
}
```

##方法

- getFieldsData
获得需要提交的表单数据，数据已经格式化好了,每一个数据都使用了trim方法去掉了前后空格

##事件名

- form-valid
表单验证通过时触发

其余的顾名思义
-  'form-invalid';
- 'form-touched';
- 'form-untouched';
- 'form-dirty';
- 'form-pristine';
-  'form-modified';

