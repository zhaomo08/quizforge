// 简化开发环境下的 Auth 端点占位，避免 TS 构建失败
type RequestHandler = (req: Request) => Promise<Response>;

export const GET: RequestHandler = async (_req: Request) => {
	return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: RequestHandler = async (_req: Request) => {
	return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};