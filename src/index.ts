import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { parse, serialize } from "cookie";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cookies = parse(request.headers.get("Cookie") || "");
    
    // Load session from cookie to save tokens/API calls
    const session = new StringSession(cookies.tg_session || "");
    const client = new TelegramClient(session, env.API_ID, env.API_HASH, {
      connectionRetries: 5,
    });

    // 1. AUTH: Initial OTP Request
    if (url.pathname === "/api/auth/send") {
      const phone = url.searchParams.get("phone");
      await client.connect();
      const { phoneCodeHash } = await client.sendCode({ apiId: env.API_ID, apiHash: env.API_HASH }, phone!);
      return new Response(JSON.stringify({ hash: phoneCodeHash }), { status: 200 });[cite: 1]
    }

    // 2. AUTH: Verify OTP and Save to Cookie
    if (url.pathname === "/api/auth/verify") {
      const { phone, code, hash } = await request.json();
      await client.signInUser({ apiId: env.API_ID, apiHash: env.API_HASH }, {
        phoneNumber: phone,
        phoneCode: code,
        phoneCodeHash: hash,
      });

      const sessionStr = client.session.save();
      return new Response("Logged In", {
        headers: {
          "Set-Cookie": serialize("tg_session", sessionStr, {
            path: "/",
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 30, // 30 Days
          }),
        },
      });[cite: 1]
    }

    // 3. STORAGE: View / Stream (Range Requests)
    if (url.pathname.startsWith("/api/view/")) {
      const fileId = url.pathname.split("/")[3];
      const file = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(fileId).first();
      // Logic to stream file chunks from Telegram based on browser Range headers
      return new Response("Streaming Logic...", { headers: { "Content-Type": file.mime_type } });
    }

    // 4. STORAGE: Delete (3-dots action)
    if (url.pathname.startsWith("/api/delete/")) {
      const fileId = url.pathname.split("/")[3];
      await env.DB.prepare("DELETE FROM files WHERE id = ?").bind(fileId).run();[cite: 1]
      return new Response("Deleted Successfully");
    }

    return new Response("Tele-Drive API Offline", { status: 404 });
  }
}
