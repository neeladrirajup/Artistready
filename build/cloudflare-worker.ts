import handler from "vinext/server/fetch-handler";
import { withProfileRuntime } from "../lib/profile-runtime";

type AccessIdentity = { email?: string };
type AuthenticatedContext = ExecutionContext & {
  access?: { getIdentity(): Promise<AccessIdentity | null> };
};

// This entry point is used only for the independently hosted Cloudflare Worker.
// Cloudflare Access must run before the Worker and provide its verified identity.
export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: AuthenticatedContext) {
    if (!ctx.access) return new Response("Cloudflare Access is required.", { status: 401 });
    const identity = await ctx.access.getIdentity();
    const email = identity?.email?.trim().toLowerCase();
    if (!email) return new Response("A verified email is required.", { status: 401 });

    const headers = new Headers(request.headers);
    for (const name of headers.keys()) {
      if (name.toLowerCase().startsWith("oai-authenticated-user-")) headers.delete(name);
    }
    headers.set("oai-authenticated-user-id", `cloudflare-access:${email}`);
    const authenticatedRequest = new Request(request, { headers });
    return withProfileRuntime(env, () => handler.fetch(authenticatedRequest, env, ctx));
  },
};
