# Input Formatter

[![NPM](https://nodei.co/npm/input-formatter.png?mini=true)](https://nodei.co/npm/input-formatter/)
[![Downloads](https://img.shields.io/npm/dt/input-formatter.svg)](https://www.npmjs.com/package/input-formatter)

## How to use

Init with `InputFormatter.init()` and set a `data-alias` attribute.

```html
<script type="module">
  import InputFormatter from "./InputFormatter.js";
  InputFormatter.init();
</script>
<p>Integer input</p>
<input type="text" class="formatter" data-alias="int" />
```
