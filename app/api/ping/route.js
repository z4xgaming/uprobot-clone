export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return Response.json({ error: 'URL is required' }, { status: 400 });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Uprobot-Clone/1.0' },
    });

    clearTimeout(timeout);
    const time = Date.now() - start;

    return Response.json({
      ok: res.ok,
      status: res.status,
      time,
    });
  } catch (error) {
    const time = Date.now() - start;
    return Response.json({
      ok: false,
      status: 0,
      time,
      error: error.message,
    });
  }
}
