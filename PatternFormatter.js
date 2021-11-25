const PATTERNS = {
  alpha: "[A-Za-z]+",
  alphanum: "[A-Za-z0-9]+",
  int: "[0-9]+",
  decimal: "[0-9.]+",
  currency: "[0-9]+[.]?[0-9]{0,2}",
  // https://haacked.com/archive/2020/05/17/french-thousand-separator-mystery/
  currency_locale: "[0-9., \u202F\u00A0]+([.,][0-9]{0,2})?",
  date: "[0-9]{0,4}(-[0-2]?[0-9]?)?(-[0-3]?[0-9]?)?",
  time: "[0-2]?[0-9](:[0-9]{0,2})?(:[0-9]{0,2})?",
  time_hm: "[0-2]?[0-9](:[0-9]{0,2})?",
  creditcard: "[0-9]{0,4}( [0-9]{0,4})?( [0-9]{0,4})?( [0-9]{0,4})?",
};
const SEPARATORS = [" ", ".", ",", "-", ":"];
class PatternFormatter {
  /**
   * @param {HTMLInputElement} el
   */
  constructor(el) {
    this.el = el;
    this.regex = null;

    // We can use an alias
    if (this.el.dataset.alias) {
      let pattern = PATTERNS[this.el.dataset.alias] ?? "";
      el.setAttribute("pattern", pattern);
    }
    // Or a custom pattern (! must match partial input)
    if (el.hasAttribute("pattern")) {
      // input pattern matches the whole value
      this.regex = new RegExp("^" + el.getAttribute("pattern") + "$", "u");
    }

    this.setDefaultPlaceholder();

    this.el.addEventListener("beforeinput", (ev) => {
      // Check if the value matches the pattern, if so, proceed
      let curr = this.el.value;
      if (!ev.data || !this.regex) {
        return;
      }
      curr += ev.data;
      if (curr.length === 0) {
        return;
      }
      let decSep = this.getDecimalSeparator();
      let isPrevented = false;
      if (this.el.hasAttribute("maxlength")) {
        // Check max length for currency with decimals
        if (["currency", "currency_locale", "decimal"].includes(this.el.dataset.alias)) {
          let maxlength = this.el.getAttribute("maxlength");
          if (ev.data != decSep && !curr.includes(decSep)) {
            maxlength -= 3;
          }
          if (curr.length > maxlength) {
            ev.preventDefault();
            isPrevented = true;
          }
        }
      }

      // Prevent invalid input
      if (!this.regex.test(curr)) {
        ev.preventDefault();
        isPrevented = true;
      }

      if (isPrevented) {
        // We prevented a separator ? We should use the right one
        if (this.el.value.length && SEPARATORS.includes(ev.data)) {
          switch (this.el.dataset.alias) {
            case "decimal":
            case "currency":
            case "currency_locale":
              // We can only have one
              if (!this.el.value.includes(decSep)) {
                this.el.value = this.el.value + decSep;
              }
              break;
            case "date":
              if (this.el.value.length < 8) {
                this.el.value = this.el.value + "-";
              }
              break;
            case "time":
            case "time_hm":
              if (this.el.value.length < 6) {
                this.el.value = this.el.value + ":";
              }
            case "creditcard":
              if (this.el.value.length < 16) {
                this.el.value = this.el.value + " ";
              }
              break;
          }
        }

        // We prevented a number ? Maybe we just need a separator in between
        if (!Number.isNaN(Number.parseInt(ev.data))) {
          let len = this.el.value.length;
          switch (this.el.dataset.alias) {
            case "date":
              if (len === 4 || len === 7) {
                this.el.value = this.el.value + "-" + ev.data;
              }
              break;
            case "time":
            case "time_hm":
              if (len === 2 || len === 5) {
                this.el.value = this.el.value + ":" + ev.data;
              }
            case "creditcard":
              if (len === 4 || len === 9 || len === 14) {
                this.el.value = this.el.value + " " + ev.data;
              }
              break;
          }
        }
      }
    });

    // Add on focus unformatting
    this.el.addEventListener("focus", (ev) => {
      if (!this.el.value) {
        return;
      }

      // Otherwise max length won't work properly
      if (this.el.dataset.alias == "currency_locale") {
        this.el.value = this.getUnformattedValue();
      }
    });

    // Add some automatic formatting on blur
    this.el.addEventListener("blur", (ev) => {
      // Allow no value
      if (!this.el.value) {
        return;
      }
      let parts;
      let formatter;
      let separator;
      let result;
      switch (this.el.dataset.alias) {
        case "decimal":
          formatter = new Intl.NumberFormat("en-US", { useGrouping: false });
          break;
        case "currency":
          formatter = new Intl.NumberFormat("en-US", { useGrouping: false, maximumFractionDigits: 2, minimumFractionDigits: 2 });
          break;
        case "currency_locale":
          formatter = this.getLatinFormatter();
          break;
        case "date":
          separator = "-";
          parts = this.el.value.split(separator).filter(Number);
          if (!parts[0]) {
            parts[0] = new Date().getFullYear();
          }
          while (parts.length < 3) {
            parts.push("01");
          }
          // Append year
          while (parts[0].length < 4) {
            parts[0] += "0";
          }
          // Prepend month and day
          while (parts[1].length < 2) {
            parts[1] = "0" + parts[1];
          }
          while (parts[2].length < 2) {
            parts[2] = "0" + parts[2];
          }
          break;
        case "time":
        case "time_hm":
          let len = this.el.dataset.alias === "time" ? 3 : 2;
          separator = ":";
          parts = this.el.value.split(separator);
          while (parts.length < len) {
            parts.push("00");
          }
          for (let j = 0; j < len; j++) {
            while (parts[j].length < 2) {
              parts[j] += "0";
            }
          }

          break;
      }

      if (formatter) {
        result = formatter.format(this.getRawValue());
        if (result != "NaN") {
          this.el.value = result;
        }
      }
      if (parts) {
        this.el.value = parts.join(separator);
      }
    });
  }

  setDefaultPlaceholder() {
    if (this.el.hasAttribute("placeholder")) {
      return;
    }
    let placeholder;
    switch (this.el.dataset.alias) {
      case "alpha":
        if (this.el.hasAttribute("maxlength")) {
          placeholder = "a".repeat(this.el.getAttribute("maxlength"));
        }
        break;
      case "alphanum":
        if (this.el.hasAttribute("maxlength")) {
          placeholder = "·".repeat(this.el.getAttribute("maxlength"));
        }
        break;
      case "int":
        if (this.el.hasAttribute("maxlength")) {
          placeholder = "0".repeat(this.el.getAttribute("maxlength"));
        }
        break;
      case "decimal":
      case "currency":
      case "currency_locale":
        if (this.el.hasAttribute("maxlength")) {
          placeholder = "0".repeat(this.el.getAttribute("maxlength") - 3);
          placeholder += this.getSeparator() + "00";
        }
        break;
      case "date":
        placeholder = "yyyy-mm-dd";
        break;
      case "time":
        placeholder = "hh:mm:ss";
        break;
      case "time_hm":
        placeholder = "hh:mm";
        break;
      case "creditcard":
        placeholder = "···· ···· ···· ····";
        break;
    }
    if (placeholder) {
      this.el.setAttribute("placeholder", placeholder);
    }
  }

  /**
   * Returns a plain js number and keep locale decimal separator
   * @returns {Number}
   */
  getUnformattedValue() {
    let separator = this.getDecimalSeparator();
    return this.el.value.replace(new RegExp("[^0-9\\" + separator + "]", "g"), "");
  }

  /**
   * Returns a plain js number ready to be formatted
   * @returns {Number}
   */
  getRawValue() {
    return this.getUnformattedValue().replace(this.getDecimalSeparator(), ".");
  }

  getLatinFormatter() {
    const opts = { maximumFractionDigits: 2, minimumFractionDigits: 2 };

    // We pass an array because null doesn't work
    const formatter = Intl.NumberFormat([], opts);
    if (formatter.resolvedOptions().numberingSystem === "latn") {
      return formatter;
    }
    return new Intl.NumberFormat("en-US", opts);
  }

  getSeparator() {
    switch (this.el.dataset.alias) {
      case "int":
      case "decimal":
      case "currency":
        return ".";
      case "currency_locale":
        return this.getDecimalSeparator();
      case "date":
        return "-";
        break;
      case "time":
      case "time_hm":
        return ":";
      case "creditcard":
        return " ";
    }
  }

  getDecimalSeparator() {
    if (this.el.dataset.alias != "currency_locale") {
      return ".";
    }
    return Intl.NumberFormat()
      .formatToParts(1.1)
      .find((part) => part.type === "decimal").value;
  }

  static init(selector = "input.formatter") {
    document.querySelectorAll(selector).forEach((el) => {
      new PatternFormatter(el);
    });
  }
}

export default PatternFormatter;
