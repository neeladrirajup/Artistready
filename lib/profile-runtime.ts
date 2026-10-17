import { AsyncLocalStorage } from 'node:async_hooks';
const runtime=new AsyncLocalStorage<Cloudflare.Env>();
export const withProfileRuntime=<T>(env:Cloudflare.Env,run:()=>T)=>runtime.run(env,run);
export const getProfileRuntime=()=>runtime.getStore();
