import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/lib/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "window", message: "src/lib must not use browser globals." },
        { name: "document", message: "src/lib must not use browser globals." },
        { name: "localStorage", message: "src/lib must not use browser globals." },
        { name: "sessionStorage", message: "src/lib must not use browser globals." },
        { name: "navigator", message: "src/lib must not use browser globals." },
      ],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "public/**"],
  }
);
