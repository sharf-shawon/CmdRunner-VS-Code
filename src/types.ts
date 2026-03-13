import { z } from 'zod';

/** Schema for an individual command entry in the config. */
export const CommandConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  command: z.string(),
  terminal: z.string().optional(),
  group: z.string().optional(),
  cwd: z.string().optional(),
  color: z.string().optional(),
  reuseTerminal: z.boolean().optional().default(true),
  keybinding: z.string().optional(),
  dependsOn: z.array(z.string()).optional().default([]),
  env: z.record(z.string()).optional().default({}),
  checksum: z.string().optional(),
  terminalProfile: z.string().optional(),
});

/** A single runnable command entry. */
export type CommandConfig = z.infer<typeof CommandConfigSchema>;

/** Schema for a startup command. */
export const StartupCommandSchema = z.object({
  label: z.string(),
  command: z.string(),
});

/** A command that runs automatically on workspace open. */
export type StartupCommand = z.infer<typeof StartupCommandSchema>;

/** Schema for an environment profile. */
export const ProfileSchema = z.object({
  env: z.record(z.string()).optional().default({}),
});

/** A named set of environment variables. */
export type Profile = z.infer<typeof ProfileSchema>;

/** Root schema for the entire .cmdrunner / .cmdrunner.yml config. */
export const CmdRunnerConfigSchema = z.object({
  $schema: z.string().optional(),
  display: z.enum(['auto', 'sidebar', 'dropdown']).optional().default('auto'),
  maxVisible: z.number().int().positive().optional().default(5),
  terminalProfile: z.string().optional().default('default'),
  startupMode: z.enum(['sequential', 'parallel']).optional().default('sequential'),
  cooldownMs: z.number().int().nonnegative().optional().default(1000),
  profiles: z.record(ProfileSchema).optional().default({}),
  activeProfile: z.string().optional(),
  startup: z.array(StartupCommandSchema).optional().default([]),
  commands: z.array(CommandConfigSchema).default([]),
});

/** The fully validated CmdRunner configuration. */
export type CmdRunnerConfig = z.infer<typeof CmdRunnerConfigSchema>;
