import * as path from "path";
import { CompilerOptions, Project, ts } from "ts-morph";
import { Contract } from "./definitions";
import { parseContract } from "./parsers/contract-parser";

export function parse(sourcePath: string): Contract {
  const project = createProject();

  // Add all dependent files that the project requires
  const sourceFile = project.addSourceFileAtPath(sourcePath);
  project.resolveSourceFileDependencies();

  // Validate that the project has no TypeScript syntax errors
  validateProject(project);

  const result = parseContract(sourceFile);

  // TODO: print human readable errors
  if (result.isErr()) throw result.unwrapErr();

  return result.unwrap().contract;
}

/**
 * Create a new project configured for Spot
 */
function createProject(): Project {
  const compilerOptions: CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    resolveJsonModule: true,
    alwaysStrict: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    esModuleInterop: true,
    skipLibCheck: true,
    baseUrl: "./",
    paths: {
      "@airtasker/spot": [path.join(__dirname, "../lib")]
    }
  };

  // Creates a new typescript program in memory
  return new Project({ compilerOptions });
}

/**
 * Validate an AST project's correctness.
 *
 * @param project an AST project
 */
function validateProject(project: Project): void {
  const diagnostics = project.getPreEmitDiagnostics();
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics
        .map(diagnostic => {
          const message = diagnostic.getMessageText();
          const filePath = diagnostic.getSourceFile()?.getFilePath();
          const line = diagnostic.getLineNumber();
          const messageText = typeof message === "string"
            ? message
            : message.getMessageText();
          return `${filePath}:${line}  ${messageText}`;
        })
        .join("\n")
    );
  }
}
