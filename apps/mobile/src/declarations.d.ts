// Expose Jest globals (describe, it, expect, jest, etc.) to TypeScript.
// Required because pnpm's symlink structure means VS Code's TS server doesn't
// reliably auto-discover @types/jest from node_modules/@types/. The triple-slash
// directive forces an explicit reference that bypasses symlink resolution.
/// <reference types="jest" />
