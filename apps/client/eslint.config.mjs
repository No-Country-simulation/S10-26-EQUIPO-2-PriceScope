import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";
import eslintConfigPrettier from "eslint-config-prettier";

const SPACING_PREFIX_REGEX =
  /^((?:[a-z0-9-]+:)*)(-?(?:w|h|size|min-w|max-w|min-h|max-h|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|inset|inset-x|inset-y|top|right|bottom|left|translate-x|translate-y|scroll-m|scroll-p))-\[(\d+(?:\.\d+)?)px\]$/;

const ROUNDED_MAP = {
  "2px": "xs",
  "4px": "sm",
  "6px": "md",
  "8px": "lg",
  "12px": "xl",
  "16px": "2xl",
  "24px": "3xl",
  "32px": "4xl",
};

/**
 * Convierte un token de clase individual de Tailwind a su forma canónica de Tailwind CSS v4.
 */
function canonicalizeTailwindToken(token) {
  let updated = token;

  // 1. Modificador !important al principio (!bg-blue-50 o sm:!w-auto) -> al final (bg-blue-50! o sm:w-auto!)
  const importantMatch = updated.match(/^((?:[a-z0-9-]+:)*)!([a-zA-Z0-9_\-./[\]()%]+)$/);
  if (importantMatch) {
    updated = `${importantMatch[1]}${importantMatch[2]}!`;
  }

  // 2. Gradientes legacy (bg-gradient-to-*) -> Tailwind v4 (bg-linear-to-*)
  updated = updated.replace(
    /^((?:[a-z0-9-]+:)*)bg-gradient-to-(t|tr|r|br|b|bl|l|tl)(!?)$/,
    "$1bg-linear-to-$2$3"
  );

  // 3. Variables CSS arbitrarias ([var(--foo)]) -> sintaxis de paréntesis Tailwind v4 ((--foo))
  updated = updated.replace(
    /^((?:[a-z0-9-]+:)*[a-z-]+)-\[var\((--[a-zA-Z0-9-_]+)\)\](!?)$/,
    "$1-($2)$3"
  );

  // 4. Radios de borde arbitrarios equivalentes a tokens (ej. first:rounded-l-[4px] -> first:rounded-l-xs)
  const roundedMatch = updated.match(
    /^((?:[a-z0-9-]+:)*rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?)-\[(\d+px)\](!?)$/
  );
  if (roundedMatch && ROUNDED_MAP[roundedMatch[2]]) {
    updated = `${roundedMatch[1]}-${ROUNDED_MAP[roundedMatch[2]]}${roundedMatch[3]}`;
  }

  // 5. Medidas en píxeles divisibles por 2 o 4 en propiedades de espaciado/tamaño (ej. min-w-[240px] -> min-w-60)
  const spacingMatch = updated.match(SPACING_PREFIX_REGEX);
  if (spacingMatch) {
    const px = Number(spacingMatch[3]);
    const scale = px / 4;
    if (Number.isInteger(scale) || scale % 0.5 === 0) {
      updated = `${spacingMatch[1]}${spacingMatch[2]}-${scale}`;
    }
  }

  // 6. Alias obsoletos de contenedores flexibles
  updated = updated.replace(/^((?:[a-z0-9-]+:)*)flex-shrink-0(!?)$/, "$1shrink-0$2");
  updated = updated.replace(/^((?:[a-z0-9-]+:)*)flex-grow(!?)$/, "$1grow$2");

  return updated;
}

/**
 * Plugin local de ESLint con soporte de autofix (`--fix`) para clases canónicas de Tailwind CSS v4.
 */
const tailwindV4Plugin = {
  rules: {
    "canonical-classes": {
      meta: {
        type: "suggestion",
        docs: {
          description:
            "Exige y corrige automáticamente las clases canónicas de Tailwind CSS v4 para evitar warnings en VS Code.",
        },
        fixable: "code",
        schema: [],
      },
      create(context) {
        function checkStringLiteral(node) {
          if (typeof node.value !== "string" || !node.value.trim()) return;
          // Evitar alterar selectores complejos o textos de UI con signos de puntuación
          const tokens = node.value.split(/(\s+)/);
          let hasChanges = false;

          const nextTokens = tokens.map((part) => {
            if (!part.trim()) return part;
            const canonical = canonicalizeTailwindToken(part);
            if (canonical !== part) {
              hasChanges = true;
            }
            return canonical;
          });

          if (hasChanges) {
            const fixedValue = nextTokens.join("");
            context.report({
              node,
              message: `Usa la clase canónica de Tailwind v4: "${fixedValue}" en lugar de "${node.value}".`,
              fix(fixer) {
                const quote = node.raw[0];
                return fixer.replaceText(node, `${quote}${fixedValue}${quote}`);
              },
            });
          }
        }

        return {
          JSXAttribute(node) {
            if (node.name && node.name.name === "className" && node.value?.type === "Literal") {
              checkStringLiteral(node.value);
            }
          },
          CallExpression(node) {
            const calleeName = node.callee.type === "Identifier" ? node.callee.name : undefined;
            if (calleeName === "cx" || calleeName === "cn" || calleeName === "tv") {
              for (const arg of node.arguments) {
                if (arg.type === "Literal") {
                  checkStringLiteral(arg);
                }
              }
            }
          },
          Property(node) {
            if (node.value?.type === "Literal") {
              checkStringLiteral(node.value);
            } else if (node.value?.type === "ArrayExpression") {
              for (const el of node.value.elements) {
                if (el?.type === "Literal") {
                  checkStringLiteral(el);
                }
              }
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      jsdoc,
      "tailwind-v4": tailwindV4Plugin,
    },
    rules: {
      "tailwind-v4/canonical-classes": "warn",
      // Exige un comentario JSDoc breve solo en funciones, hooks y clases exportadas (API pública del módulo)
      // para mantener el código sostenible sin obligar a comentar variables o funciones internas obvias.
      "jsdoc/require-jsdoc": [
        "warn",
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: false,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          checkConstructors: false,
        },
      ],
      "jsdoc/require-description": [
        "warn",
        { contexts: ["FunctionDeclaration", "ClassDeclaration"] },
      ],
      // No obligamos a duplicar @param ni @returns porque TypeScript ya define los tipos
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
