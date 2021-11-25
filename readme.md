# Input Formatter

[![NPM](https://nodei.co/npm/pattern-formatter.png?mini=true)](https://nodei.co/npm/pattern-formatter/)
[![Downloads](https://img.shields.io/npm/dt/pattern-formatter.svg)](https://www.npmjs.com/package/pattern-formatter)

## How to use

Init with `PatternFormatter.init()` and set a `data-alias` attribute.

```html
<script type="module">
  import PatternFormatter from "./PatternFormatter.js";
  PatternFormatter.init();
</script>
<p>Integer input</p>
<input type="text" class="formatter" data-alias="int" />
```
