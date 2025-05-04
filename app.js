import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const DATA_FILE = path.join("data", "links.json");

const serverFile = async (res, filePath, contentType) => {
  try {
    var data = await readFile(filePath,'utf-8');
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page Not Found");
  }
};

const LoadLinks = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

const saveLinks = async (links) => {
  try {
    await writeFile(DATA_FILE, JSON.stringify(links));
  } catch (error) {
    console.error("Error saving links:", error);
  }
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      serverFile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
       serverFile(res, path.join("public", "style.css"), "text/css");
    } else if (req.url == "/links") {
      const links = await LoadLinks();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(links));
    }else{
        const links = await LoadLinks();
        const shortCode = req.url.slice(1);
        if(links[shortCode]){
            res.writeHead(302, { Location: links[shortCode] });
            return res.end();
        }
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Page not found" );
    }
  }

  if (req.method === "POST" && req.url === "/shorten") {
    const links = await LoadLinks();

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      const { url, shortCode } = JSON.parse(body);
      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("URL is required" );
      }

      const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
      if (links[finalShortCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Short code already exists" );
      }
      links[finalShortCode] = url;

      await saveLinks(links);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ shortCode: finalShortCode }));
    });
  }
});

const port = 9000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
