import { createServer } from "node:http";
import { text } from "node:stream/consumers";

const rows: unknown[] = [];

createServer(async (request, response) => {
  if (request.method === "POST") {
    const lines = (await text(request)).split("\n").filter(Boolean);
    rows.push(...lines.map((line) => JSON.parse(line)));
    response.end();
  } else if (request.url === "/rows") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(rows));
  } else {
    response.end("Ok.\n");
  }
}).listen(new URL(process.env.ANALYTICS_CLICKHOUSE_URL ?? "").port);
