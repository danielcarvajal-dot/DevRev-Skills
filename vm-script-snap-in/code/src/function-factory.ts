import on_script_chosen from './functions/on_script_chosen';
import run_vm_script from './functions/run_vm_script';

export const functionFactory = {
  run_vm_script,
  on_script_chosen,
} as const;

export type FunctionFactoryType = keyof typeof functionFactory;
