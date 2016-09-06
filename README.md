###demo

```
<h2>验证内容：</h2>
<my-component v-fieldset="aaa"></my-component>
<my-component2 v-fieldset="bbb"></my-component2>
<input type="submit" v-if="validation.valid" @click="submit">
<h2>验证结果：</h2>
<pre>{{validation|json}}</pre>

<input type="text" v-validate:username="{
                   required: { rule: true, message: 'required you name !!' },
                   minlength:{rule:1,message:'最小为1'}}">
```

##指令

###v-fieldname

表单提交的name值，配合v-model使用。和v-model的值绑定。

###v-fieldset

表单分组名，每一个业务组件，凡是有需要提交的数据，都需要加这个字段；
例：
```
<my-component v-fieldset="aaa"></my-component>
```

###validation

####字段验证结果

- valid: 字段有效时返回 true,否则返回 false。
- invalid: valid 的逆.
- touched: 字段获得过焦点时返回 true,否则返回 false。
- untouched: touched 的逆.
- modified: 字段值与初始值不同时返回 true,否则返回 false。
- dirty: 字段值改变过至少一次时返回 true,否则返回 false。
- pristine: dirty 的逆.
- errors: 字段无效时返回存有错误信息的数据，否则返回 undefined。

####全局结果

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
  // 表单需要提交的数据
  "data": {
    "username": "111",
  },
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

###方法

- getFieldsData
获得需要提交的表单数据，数据已经格式化好了,每一个数据都使用了trim方法去掉了前后空格

###事件名

- form-valid
表单验证通过时触发

其余的顾名思义
-  'form-invalid';
- 'form-touched';
- 'form-untouched';
- 'form-dirty';
- 'form-pristine';
-  'form-modified';