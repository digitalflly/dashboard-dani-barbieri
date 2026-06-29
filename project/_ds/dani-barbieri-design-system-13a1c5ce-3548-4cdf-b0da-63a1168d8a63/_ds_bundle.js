/* @ds-bundle: {"format":3,"namespace":"HighBeautyPrDesignSystem_13a1c5","components":[{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Badge","sourcePath":"components/core/Tag.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Field","sourcePath":"components/forms/Input.jsx"},{"name":"Avatar","sourcePath":"components/surfaces/Avatar.jsx"},{"name":"StatBlock","sourcePath":"components/surfaces/Avatar.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"}],"sourceHashes":{"components/brand/Logo.jsx":"b37c34866cfe","components/core/Button.jsx":"063bdaf582ce","components/core/Divider.jsx":"e49aac6f3534","components/core/Tag.jsx":"2f97a3a595fb","components/forms/Input.jsx":"45e0a3ea7a3a","components/surfaces/Avatar.jsx":"4705fb2fa644","components/surfaces/Card.jsx":"4780b3e435a8","ui_kits/landing/sections.jsx":"49b59da2fa54","ui_kits/social/templates.jsx":"af55d9c12c88"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HighBeautyPrDesignSystem_13a1c5 = window.HighBeautyPrDesignSystem_13a1c5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Logo — the High Beauty PrØ brand lockup, built from type so it renders
 * anywhere. The custom interlocking monogram is a supplied image; pass its
 * URL via `monogramSrc` to show it (variant "full" / "stacked" / "monogram").
 */
function Logo({
  variant = "wordmark",
  // "wordmark" | "stacked" | "full" | "secondary" | "monogram"
  tone = "ink",
  // "ink" | "wine" | "cream" | "gold"
  monogramSrc = null,
  size = 28,
  // wordmark cap height in px (approx)
  style = {},
  ...rest
}) {
  const toneColor = {
    ink: "var(--ink-900)",
    wine: "var(--wine-800)",
    cream: "var(--cream)",
    gold: "var(--gold-deep)"
  }[tone] || "var(--ink-900)";
  const isFoil = tone === "gold";
  const wordStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 500,
    letterSpacing: "0.06em",
    lineHeight: 1,
    fontSize: size,
    color: isFoil ? "transparent" : toneColor,
    ...(isFoil ? {
      background: "var(--gold-foil)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      WebkitTextFillColor: "transparent"
    } : {})
  };
  const subStyle = {
    fontFamily: "var(--font-sans)",
    fontWeight: 400,
    letterSpacing: "0.42em",
    textTransform: "uppercase",
    fontSize: Math.max(8, size * 0.30),
    color: isFoil ? "var(--gold-deep)" : toneColor,
    marginRight: "-0.42em"
  };
  const Mono = monogramSrc ? /*#__PURE__*/React.createElement("img", {
    src: monogramSrc,
    alt: "High Beauty Pr\xD8 monogram",
    style: {
      display: "block",
      height: size * (variant === "monogram" ? 2.4 : 1.9),
      width: "auto"
    }
  }) : null;
  if (variant === "monogram") {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: "inline-flex",
        ...style
      }
    }, rest), Mono || /*#__PURE__*/React.createElement("span", {
      style: {
        ...wordStyle,
        fontSize: size * 1.6
      }
    }, "HB"));
  }
  const Word = /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: size * 0.18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: wordStyle
  }, variant === "secondary" ? "PR\u00d8 BEAUTY" : "HIGH BEAUTY PR\u00d8"), /*#__PURE__*/React.createElement("span", {
    style: subStyle
  }, "Mentoria"));
  if (variant === "stacked" || variant === "full") {
    return /*#__PURE__*/React.createElement("span", _extends({
      style: {
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: size * 0.5,
        ...style
      }
    }, rest), Mono, Word);
  }

  // inline wordmark
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.45,
      ...style
    }
  }, rest), Mono, Word);
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Button — High Beauty PrØ. Tracked uppercase label, squared edges,
 * gentle warm transitions. Variants tuned for the wine/nude/gold palette.
 */
function Button({
  children,
  variant = "primary",
  // primary | secondary | ghost | gold | link
  size = "md",
  // sm | md | lg
  block = false,
  disabled = false,
  as = "button",
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const heights = {
    sm: "var(--control-h-sm)",
    md: "var(--control-h-md)",
    lg: "var(--control-h-lg)"
  };
  const padX = {
    sm: "18px",
    md: "26px",
    lg: "34px"
  };
  const fs = {
    sm: "11px",
    md: "12px",
    lg: "13px"
  };
  const base = {
    display: block ? "flex" : "inline-flex",
    width: block ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    height: heights[size],
    padding: `0 ${padX[size]}`,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    fontSize: fs[size],
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    textDecoration: "none",
    whiteSpace: "nowrap",
    borderRadius: "var(--radius-xs)",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "var(--transition-base)",
    opacity: disabled ? 0.45 : 1,
    boxSizing: "border-box"
  };
  const variants = {
    primary: {
      background: "var(--wine-800)",
      color: "var(--cream)",
      borderColor: "var(--wine-800)",
      boxShadow: "var(--shadow-sm)"
    },
    secondary: {
      background: "transparent",
      color: "var(--wine-800)",
      borderColor: "var(--border-strong)"
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-900)",
      borderColor: "transparent"
    },
    gold: {
      background: "var(--gold-foil)",
      color: "var(--wine-900)",
      borderColor: "transparent",
      boxShadow: "var(--shadow-sm)"
    },
    link: {
      background: "transparent",
      color: "var(--wine-800)",
      borderColor: "transparent",
      height: "auto",
      padding: "4px 0",
      letterSpacing: "0.16em",
      borderBottom: "1px solid var(--hairline-gold)",
      borderRadius: 0
    }
  };
  const hoverByVariant = {
    primary: {
      background: "var(--wine-900)",
      borderColor: "var(--wine-900)"
    },
    secondary: {
      background: "var(--wine-800)",
      color: "var(--cream)",
      borderColor: "var(--wine-800)"
    },
    ghost: {
      background: "var(--nude-100)"
    },
    gold: {
      filter: "brightness(1.04)"
    },
    link: {
      color: "var(--wine-900)"
    }
  };
  const onEnter = e => {
    if (!disabled) Object.assign(e.currentTarget.style, hoverByVariant[variant] || {});
  };
  const onLeave = e => {
    if (disabled) return;
    const v = {
      ...base,
      ...variants[variant],
      ...style
    };
    Object.assign(e.currentTarget.style, {
      background: v.background,
      color: v.color,
      borderColor: v.borderColor,
      filter: "none"
    });
  };
  const onDown = e => {
    if (!disabled) e.currentTarget.style.transform = "translateY(1px)";
  };
  const onUp = e => {
    if (!disabled) e.currentTarget.style.transform = "none";
  };
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      ...base,
      ...variants[variant],
      ...style
    },
    disabled: as === "button" ? disabled : undefined,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onMouseDown: onDown,
    onMouseUp: onUp
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Divider — editorial separator. "gold" is a thin foil rule; "ornament"
 * centres a small diamond between two gold hairlines (used between sections).
 */
function Divider({
  variant = "gold",
  label = null,
  style = {},
  ...rest
}) {
  if (variant === "ornament") {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: "var(--gold)",
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--hairline-gold)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        transform: "rotate(45deg)",
        display: "inline-block",
        width: 6,
        height: 6,
        border: "1px solid var(--gold)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: "var(--hairline-gold)"
      }
    }));
  }
  if (label) {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: variant === "gold" ? "var(--hairline-gold)" : "var(--hairline)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-sans)",
        fontSize: 11,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "var(--text-muted)"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        background: variant === "gold" ? "var(--hairline-gold)" : "var(--hairline)"
      }
    }));
  }
  return /*#__PURE__*/React.createElement("hr", _extends({
    style: {
      height: 1,
      border: 0,
      margin: 0,
      background: variant === "gold" ? "var(--hairline-gold)" : "var(--hairline)",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Tag — small tracked-caps marker for categories/topics. */
function Tag({
  children,
  tone = "wine",
  style = {},
  ...rest
}) {
  const tones = {
    wine: {
      color: "var(--wine-800)",
      borderColor: "var(--hairline-gold)",
      background: "transparent"
    },
    sand: {
      color: "var(--taupe-500)",
      borderColor: "var(--border-strong)",
      background: "var(--nude-100)"
    },
    solid: {
      color: "var(--cream)",
      borderColor: "var(--wine-800)",
      background: "var(--wine-800)"
    },
    gold: {
      color: "var(--gold-deep)",
      borderColor: "var(--hairline-gold)",
      background: "transparent"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 26,
      padding: "0 12px",
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      borderRadius: "var(--radius-pill)",
      border: "1px solid",
      ...tones[tone],
      ...style
    }
  }, rest), children);
}

/** Badge — numeric/status pip. */
function Badge({
  children,
  tone = "wine",
  style = {},
  ...rest
}) {
  const tones = {
    wine: {
      background: "var(--wine-800)",
      color: "var(--cream)"
    },
    gold: {
      background: "var(--gold)",
      color: "var(--wine-900)"
    },
    soft: {
      background: "var(--accent-soft)",
      color: "var(--wine-800)"
    },
    success: {
      background: "var(--success)",
      color: "#fff"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 20,
      height: 20,
      padding: "0 7px",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: "0.04em",
      borderRadius: "var(--radius-pill)",
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag, Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Input — refined text field. Bottom-rule "line" variant (editorial) or a
 * boxed "outline" variant. Focus brings a gold underline / wine border.
 */
function Input({
  variant = "outline",
  // outline | line
  size = "md",
  invalid = false,
  iconLeft = null,
  style = {},
  wrapStyle = {},
  ...rest
}) {
  const h = {
    sm: "var(--control-h-sm)",
    md: "var(--control-h-md)",
    lg: "var(--control-h-lg)"
  }[size];
  const [focus, setFocus] = React.useState(false);
  const shared = {
    width: "100%",
    height: h,
    fontFamily: "var(--font-sans)",
    fontWeight: 300,
    fontSize: 15,
    color: "var(--ink-900)",
    background: "transparent",
    border: "none",
    outline: "none",
    letterSpacing: "0.01em"
  };
  const box = variant === "line" ? {
    borderBottom: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--gold)" : "var(--border-strong)"}`,
    paddingBottom: 2,
    borderRadius: 0
  } : {
    border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--wine-800)" : "var(--border-soft)"}`,
    borderRadius: "var(--radius-sm)",
    background: "var(--surface-card)",
    padding: "0 14px",
    boxShadow: focus ? "0 0 0 3px var(--accent-soft)" : "none",
    transition: "var(--transition-base)"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: h,
      ...box,
      ...wrapStyle
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      display: "inline-flex"
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    style: {
      ...shared,
      ...style
    },
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest)));
}

/** Field — label + Input + helper, the standard form row. */
function Field({
  label,
  helper,
  required = false,
  children,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--wine-700)"
    }
  }, " *")), children, helper && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 12,
      color: "var(--text-muted)"
    }
  }, helper));
}
Object.assign(__ds_scope, { Input, Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Avatar — circular portrait with optional gold ring. */
function Avatar({
  src,
  name = "",
  size = 48,
  ring = false,
  style = {},
  ...rest
}) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      background: "var(--nude-200)",
      color: "var(--wine-800)",
      fontFamily: "var(--font-display)",
      fontSize: size * 0.38,
      flex: "0 0 auto",
      ...(ring ? {
        boxShadow: "0 0 0 1px var(--cream), 0 0 0 2px var(--gold)"
      } : {}),
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials);
}

/** StatBlock — display number + tracked-caps label, for results/figures. */
function StatBlock({
  value,
  label,
  tone = "wine",
  align = "left",
  style = {}
}) {
  const color = tone === "cream" ? "var(--cream)" : tone === "gold" ? "var(--gold-deep)" : "var(--wine-800)";
  const labelColor = tone === "cream" ? "rgba(246,239,232,0.7)" : "var(--text-muted)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: align,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 52,
      lineHeight: 1,
      color,
      letterSpacing: "var(--ls-display)"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: labelColor
    }
  }, label));
}
Object.assign(__ds_scope, { Avatar, StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Card — editorial container. Tones: paper (white), tinted (nude), sand,
 * wine (dark). `media` renders a top image; `interactive` lifts on hover.
 */
function Card({
  children,
  tone = "paper",
  // paper | tinted | sand | wine
  media = null,
  // image url
  mediaHeight = 200,
  interactive = false,
  goldEdge = false,
  padding = 28,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    paper: {
      background: "var(--surface-card)",
      color: "var(--text-body)",
      border: "1px solid var(--border-soft)"
    },
    tinted: {
      background: "var(--nude-200)",
      color: "var(--ink-700)",
      border: "1px solid transparent"
    },
    sand: {
      background: "var(--sand-300)",
      color: "var(--ink-900)",
      border: "1px solid transparent"
    },
    wine: {
      background: "var(--wine-800)",
      color: "var(--text-on-wine)",
      border: "1px solid var(--wine-900)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      boxShadow: interactive && hover ? "var(--shadow-lg)" : "var(--shadow-sm)",
      transform: interactive && hover ? "translateY(-4px)" : "none",
      transition: "var(--transition-base)",
      ...(goldEdge ? {
        boxShadow: "0 0 0 1px var(--hairline-gold), var(--shadow-sm)",
        border: "1px solid transparent"
      } : {}),
      ...tones[tone],
      ...style
    }
  }, rest), media && /*#__PURE__*/React.createElement("div", {
    style: {
      height: mediaHeight,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: media,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      transform: interactive && hover ? "scale(1.05)" : "scale(1)",
      transition: "transform var(--dur-slow) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/landing/sections.jsx
try { (() => {
/* High Beauty PrØ — Landing page sections. Composes DS primitives. */
const DS = window.HighBeautyPrDesignSystem_13a1c5;
const {
  Logo,
  Button,
  Tag,
  Divider,
  Card,
  StatBlock,
  Avatar,
  Input,
  Field
} = DS;
const A = "../../assets/";
const ease = "cubic-bezier(.22,.61,.36,1)";

/* ---------- shared bits ---------- */
function Eyebrow({
  children,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: "0.34em",
      textTransform: "uppercase",
      color: tone === "light" ? "var(--gold)" : "var(--text-muted)",
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 1,
      background: "var(--gold)"
    }
  }), children);
}

/* ---------- Nav ---------- */
function Nav() {
  const links = ["O método", "A mentora", "Resultados", "Investimento"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px clamp(20px,5vw,72px)",
      background: "rgba(246,239,232,0.86)",
      backdropFilter: "var(--blur-panel)",
      borderBottom: "1px solid var(--hairline)"
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "wordmark",
    tone: "ink",
    monogramSrc: A + "monogram-gold.png",
    size: 20
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 36
    }
  }, links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12.5,
      fontWeight: 400,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--ink-700)",
      textDecoration: "none",
      transition: `color .2s ${ease}`
    },
    onMouseEnter: e => e.currentTarget.style.color = "var(--wine-800)",
    onMouseLeave: e => e.currentTarget.style.color = "var(--ink-700)"
  }, l))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm"
  }, "Quero participar"));
}

/* ---------- Hero ---------- */
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.05fr 0.95fr",
      minHeight: 620,
      background: "var(--wine-800)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "clamp(40px,6vw,92px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "light"
  }, "Mentoria \xB7 High Beauty Pr\xD8"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: "clamp(46px,5.4vw,76px)",
      lineHeight: 1.04,
      letterSpacing: "var(--ls-display)",
      color: "var(--cream)"
    }
  }, "Beleza com", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: "italic",
      fontWeight: 400
    }
  }, "prop\xF3sito"), " e autoridade"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 460,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 18,
      lineHeight: 1.6,
      color: "var(--nude-200)"
    }
  }, "A mentoria de Dani Barbieri para profissionais da beleza que querem crescer com m\xE9todo, posicionamento e excel\xEAncia."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg"
  }, "Aplicar agora"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    style: {
      color: "var(--cream)",
      borderColor: "rgba(246,239,232,0.4)"
    }
  }, "O m\xE9todo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, ["Marina Luz", "Paula Reis", "Bia Sá"].map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: n,
    style: {
      marginLeft: i ? -12 : 0
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n,
    size: 36,
    ring: true
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      fontWeight: 300,
      color: "var(--nude-200)"
    }
  }, "+2.000 profissionais mentoradas"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + "img-beauty-orchid.png",
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(105deg, rgba(119,21,32,0.45), rgba(119,21,32,0) 40%)"
    }
  })));
}

/* ---------- Marquee strip ---------- */
function Strip() {
  const items = ["Posicionamento", "Atendimento de alto valor", "Precificação", "Branding pessoal", "Fidelização"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--wine-900)",
      padding: "16px 0",
      borderTop: "1px solid var(--hairline-gold)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: 40
    }
  }, items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--gold)"
    }
  }, i))));
}

/* ---------- Method ---------- */
function Method() {
  const mods = [{
    n: "01",
    t: "Posicionamento de marca",
    d: "Construa uma identidade profissional que comunica valor antes da primeira palavra.",
    img: A + "img-rose-soft.png"
  }, {
    n: "02",
    t: "Atendimento de excelência",
    d: "Do acolhimento à fidelização: a experiência que transforma cliente em embaixadora.",
    img: A + "img-beauty-orchid.png"
  }, {
    n: "03",
    t: "Precificação & gestão",
    d: "Cobre o que o seu trabalho vale e organize o negócio para crescer com previsibilidade.",
    img: A + "img-palm-gold.png"
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--cream)",
      padding: "clamp(64px,8vw,120px) clamp(20px,5vw,72px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: 18,
      marginBottom: 56
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "O m\xE9todo Pr\xD8"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: "clamp(34px,4vw,52px)",
      lineHeight: 1.08,
      color: "var(--ink-900)",
      maxWidth: 720
    }
  }, "Tr\xEAs pilares para profissionalizar a sua beleza")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 28,
      maxWidth: 1120,
      margin: "0 auto"
    }
  }, mods.map(m => /*#__PURE__*/React.createElement(Card, {
    key: m.n,
    tone: "paper",
    media: m.img,
    mediaHeight: 210,
    interactive: true,
    padding: 28
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      color: "var(--gold-deep)",
      marginBottom: 8
    }
  }, m.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 10px",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 24,
      color: "var(--ink-900)",
      lineHeight: 1.15
    }
  }, m.t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.6,
      color: "var(--text-muted)"
    }
  }, m.d)))));
}

/* ---------- Mentor ---------- */
function Mentor() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--nude-200)",
      display: "grid",
      gridTemplateColumns: "0.9fr 1.1fr",
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      minHeight: 520,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + "img-velvet-palm.png",
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "clamp(48px,6vw,96px)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "A mentora"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: "clamp(32px,3.6vw,48px)",
      lineHeight: 1.1,
      color: "var(--ink-900)"
    }
  }, "Dani Barbieri"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 520,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.7,
      color: "var(--ink-700)"
    }
  }, "Refer\xEAncia na forma\xE7\xE3o de profissionais da beleza, Dani uniu prop\xF3sito e excel\xEAncia em um m\xE9todo autoral. Como mentora, guia especialistas ao sucesso com autenticidade, t\xE9cnica e confian\xE7a \u2014 valorizando quem atua no setor."), /*#__PURE__*/React.createElement(Divider, {
    variant: "ornament",
    style: {
      maxWidth: 220
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    value: "+10",
    label: "Anos de atua\xE7\xE3o"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    value: "+2.000",
    label: "Mentoradas"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    value: "98%",
    label: "Recomendam",
    tone: "gold"
  }))));
}

/* ---------- Results ---------- */
function Results() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--wine-800)",
      padding: "clamp(64px,8vw,120px) clamp(20px,5vw,72px)",
      color: "var(--cream)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 900,
      margin: "0 auto",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 30
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "light"
  }, "Quem viveu, recomenda"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontStyle: "italic",
      fontSize: "clamp(26px,3.2vw,42px)",
      lineHeight: 1.32,
      letterSpacing: "var(--ls-display)",
      color: "var(--cream)"
    }
  }, "\u201CEm tr\xEAs meses eu reposicionei o meu atendimento, dobrei o meu ticket e, pela primeira vez, senti orgulho da minha marca.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Marina Luz",
    size: 48,
    ring: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 14,
      letterSpacing: "0.04em"
    }
  }, "Marina Luz"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 12,
      color: "var(--nude-200)",
      letterSpacing: "0.1em",
      textTransform: "uppercase"
    }
  }, "Lash designer \xB7 SP")))));
}

/* ---------- Apply ---------- */
function Apply() {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("section", {
    id: "apply",
    style: {
      background: "var(--cream)",
      padding: "clamp(64px,8vw,120px) clamp(20px,5vw,72px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 64,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Investimento"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: "clamp(32px,3.6vw,50px)",
      lineHeight: 1.08,
      color: "var(--ink-900)"
    }
  }, "Aplique para a pr\xF3xima turma"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 17,
      lineHeight: 1.65,
      color: "var(--ink-700)",
      maxWidth: 420
    }
  }, "As vagas s\xE3o limitadas e selecionadas. Deixe seus dados e a nossa equipe entra em contato com os pr\xF3ximos passos."), /*#__PURE__*/React.createElement(Divider, {
    variant: "gold",
    style: {
      maxWidth: 300,
      marginTop: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 13,
      color: "var(--text-muted)",
      letterSpacing: "0.04em"
    }
  }, "@danibarbieribeauty \xB7 danielle@barbiericompany.com")), /*#__PURE__*/React.createElement(Card, {
    tone: "paper",
    goldEdge: true,
    padding: 36
  }, sent ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "30px 6px"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: A + "monogram-gold.png",
    style: {
      height: 64,
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: "0 0 8px",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 26,
      color: "var(--ink-900)"
    }
  }, "Recebido"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      color: "var(--text-muted)"
    }
  }, "Em breve falamos com voc\xEA.")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Nome",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Seu nome completo",
    required: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "E-mail",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    placeholder: "voce@email.com",
    required: true
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Instagram"
  }, /*#__PURE__*/React.createElement(Input, {
    variant: "line",
    placeholder: "@seuperfil"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    as: "button",
    type: "submit",
    style: {
      marginTop: 6
    }
  }, "Enviar aplica\xE7\xE3o")))));
}

/* ---------- Footer ---------- */
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--wine-950)",
      padding: "clamp(48px,6vw,80px) clamp(20px,5vw,72px) 40px",
      color: "var(--nude-200)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1120,
      margin: "0 auto",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "stacked",
    tone: "gold",
    monogramSrc: A + "monogram-gold.png",
    size: 22
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 64,
      flexWrap: "wrap"
    }
  }, [{
    h: "Mentoria",
    l: ["O método", "A mentora", "Resultados"]
  }, {
    h: "Contato",
    l: ["@danibarbieribeauty", "danielle@barbiericompany.com"]
  }].map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.24em",
      textTransform: "uppercase",
      color: "var(--gold)"
    }
  }, c.h), c.l.map(x => /*#__PURE__*/React.createElement("a", {
    key: x,
    href: "#",
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 14,
      color: "var(--nude-200)",
      textDecoration: "none"
    }
  }, x)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1120,
      margin: "48px auto 0",
      paddingTop: 22,
      borderTop: "1px solid rgba(246,239,232,0.14)",
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 12,
      color: "rgba(228,213,202,0.6)",
      letterSpacing: "0.06em"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2025 High Beauty Pr\xD8 \u2014 Mentoria"), /*#__PURE__*/React.createElement("span", null, "Identidade visual \xB7 ArthDesignn")));
}
function LandingPage() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--cream)"
    }
  }, /*#__PURE__*/React.createElement(Nav, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(Strip, null), /*#__PURE__*/React.createElement(Method, null), /*#__PURE__*/React.createElement(Mentor, null), /*#__PURE__*/React.createElement(Results, null), /*#__PURE__*/React.createElement(Apply, null), /*#__PURE__*/React.createElement(Footer, null));
}
Object.assign(window, {
  LandingPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/landing/sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/social/templates.jsx
try { (() => {
/* High Beauty PrØ — Social templates (Instagram). Native px; the gallery scales them. */
const DSS = window.HighBeautyPrDesignSystem_13a1c5;
const {
  Logo: SLogo,
  Divider: SDivider
} = DSS;
const AS = "../../assets/";
function Mono({
  size = 88
}) {
  return /*#__PURE__*/React.createElement("img", {
    src: AS + "monogram-gold.png",
    alt: "",
    style: {
      height: size,
      width: "auto",
      display: "block"
    }
  });
}
function Kicker({
  children,
  color = "var(--gold)"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 26,
      letterSpacing: "0.42em",
      textTransform: "uppercase",
      color,
      marginRight: "-0.42em"
    }
  }, children);
}

/* 1080×1080 — statement feed post */
function FeedPost() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1080,
      height: 1080,
      background: "var(--wine-800)",
      color: "var(--cream)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 84,
      boxSizing: "border-box",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 30,
      paddingTop: 24
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: 96
  }), /*#__PURE__*/React.createElement(Kicker, null, "Mentoria")), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      textAlign: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 116,
      lineHeight: 1.02,
      letterSpacing: "var(--ls-display)"
    }
  }, "Beleza com", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: "italic",
      fontWeight: 400
    }
  }, "prop\xF3sito")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 28,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 90,
      height: 1,
      background: "var(--hairline-gold)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 30,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--nude-200)"
    }
  }, "@danibarbieribeauty")));
}

/* 1080×1080 — quote / testimonial */
function QuotePost() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1080,
      height: 1080,
      background: "var(--nude-200)",
      color: "var(--ink-900)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 56,
      padding: 96,
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 200,
      lineHeight: 0.6,
      color: "var(--gold)",
      height: 90
    }
  }, "\u201C"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontStyle: "italic",
      fontSize: 62,
      lineHeight: 1.34,
      letterSpacing: "var(--ls-display)",
      color: "var(--ink-900)"
    }
  }, "Em tr\xEAs meses reposicionei meu atendimento e dobrei o meu ticket."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 64,
      height: 1,
      background: "var(--wine-800)"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 500,
      fontSize: 30,
      letterSpacing: "0.04em",
      color: "var(--wine-800)"
    }
  }, "Marina Luz"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 22,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--taupe-500)"
    }
  }, "Lash designer"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute"
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: AS + "monogram-gold.png",
    alt: "",
    style: {
      position: "absolute",
      right: 70,
      bottom: 64,
      height: 74
    }
  }));
}

/* 1080×1920 — story */
function StoryFrame() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1080,
      height: 1920,
      position: "relative",
      overflow: "hidden",
      color: "var(--cream)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: AS + "img-rose-dark.png",
    alt: "",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg, rgba(61,10,17,0.55) 0%, rgba(61,10,17,0.15) 36%, rgba(61,10,17,0.78) 100%)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 110,
      boxSizing: "border-box",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 26,
      paddingTop: 30
    }
  }, /*#__PURE__*/React.createElement(Mono, {
    size: 104
  }), /*#__PURE__*/React.createElement(Kicker, null, "High Beauty Pr\xD8")), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 128,
      lineHeight: 1.04
    }
  }, "Pr\xF3xima", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: "italic",
      fontWeight: 400
    }
  }, "turma"), /*#__PURE__*/React.createElement("br", null), "aberta"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 30,
      paddingBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "26px 64px",
      background: "var(--gold-foil)",
      color: "var(--wine-900)",
      fontFamily: "var(--font-sans)",
      fontWeight: 600,
      fontSize: 32,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      borderRadius: 3
    }
  }, "Aplicar agora"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: 300,
      fontSize: 28,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--nude-200)"
    }
  }, "\u2191 arraste para cima"))));
}

/* ---- gallery ---- */
function Frame({
  children,
  w,
  h,
  label,
  scale
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: w * scale,
      height: h * scale,
      boxShadow: "var(--shadow-lg)",
      borderRadius: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      transform: `scale(${scale})`,
      transformOrigin: "top left"
    }
  }, children)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label));
}
function SocialKit() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "var(--cream)",
      padding: "56px clamp(20px,5vw,72px)",
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: "0.34em",
      textTransform: "uppercase",
      color: "var(--gold-deep)"
    }
  }, "Social \xB7 Instagram"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "10px 0 0",
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: 46,
      color: "var(--ink-900)"
    }
  }, "Templates de conte\xFAdo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 44,
      justifyContent: "center",
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Frame, {
    w: 1080,
    h: 1080,
    scale: 0.30,
    label: "Feed \xB7 Frase"
  }, /*#__PURE__*/React.createElement(FeedPost, null)), /*#__PURE__*/React.createElement(Frame, {
    w: 1080,
    h: 1080,
    scale: 0.30,
    label: "Feed \xB7 Depoimento"
  }, /*#__PURE__*/React.createElement(QuotePost, null)), /*#__PURE__*/React.createElement(Frame, {
    w: 1080,
    h: 1920,
    scale: 0.21,
    label: "Story \xB7 CTA"
  }, /*#__PURE__*/React.createElement(StoryFrame, null))));
}
Object.assign(window, {
  SocialKit,
  FeedPost,
  QuotePost,
  StoryFrame
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/social/templates.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.Card = __ds_scope.Card;

})();
