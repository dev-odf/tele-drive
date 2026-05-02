import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { parse, serialize } from "cookie";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cookies = parse(request.headers.get("Cookie") || "");
    
    // 1. Rebuild the client instantly from the user's cookie
    const session = new StringSession(cookies.tg_session || "");
    const client = new TelegramClient(session, env.API_ID, env.API_HASH, { connectionRetries: 5 });
    
    if (session.save() !== "") {
        await client.connect();
    }

    // 2. LIST FILES (No DB needed, just read "Saved Messages")
    if (url.pathname === "/api/files" && request.method === "GET") {
      // Fetch the last 50 documents/media from their Saved Messages
      const messages = await client.getMessages("me", {
        limit: 50,
        filter: new Api.InputMessagesFilterDocument()
      });

      // Format the data on the fly to send to the frontend
      const files = messages.map(msg => ({
        id: msg.id,
        name: msg.file?.name || "Unknown_File",
        size: msg.file?.size || 0,
        date: msg.date
      }));

      return new Response(JSON.stringify(files), { headers: { "Content-Type": "application/json" } });
    }

    // 3. UPLOAD FILE (Directly to "Saved Messages")
    if (url.pathname === "/api/upload" && request.method === "POST") {
      const formData = await request.formData();
      const file = formData.get("file"); // Get file from frontend
      
      // Upload directly to the user's personal Saved Messages
      await client.sendFile("me", {
        file: file,
        caption: `Uploaded via Tele-Drive Public`,
      });

      return new Response("Uploaded successfully to your Telegram!");
    }

    // ... (Keep the OTP Login code from the previous step here to set the cookie) ...
    
    return new Response("Tele-Drive Public API");
  }
}
