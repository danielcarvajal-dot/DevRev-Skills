import command_handler from './functions/command_handler';
import on_ticket_created from './functions/on_ticket_created';

export const functionFactory = {
  command_handler,
  on_ticket_created,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
