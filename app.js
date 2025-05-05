
import {readFile,writeFile} from "fs/promises";
import path from "path";
import crypto from "crypto";
import express from "express";

const app = express();

const DATA_FILE = path.join("data", "links.json");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const serverFile = async (res, filePath, contentType) => {
  try {
    var data = await readFile(filePath, "utf-8");
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

app.get("/", async (req, res) => {
  try {
    const file = await readFile(
      path.join("views", "index.html"),
      "utf-8"
    );
    const links = await LoadLinks();

    const content = file.toString().replaceAll(
      "{{shortened_urls}}",
      Object.entries(links)
        .map(
          ([shortCode, url]) =>
            `<li><a href="/${shortCode}" target="_blank">${req.host}/${shortCode}</a> -> ${url}</li>`
        )
        .join("")
    );
    return res.send(content);
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/", async (req, res) => {
  try {
    const { url, shortCode } = req.body;
    const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

    const links = await LoadLinks();

    if (links[finalShortCode]) {
      return res.status(400).send("Short code already exists");
    }

    links[finalShortCode] = url;
    await saveLinks(links);

    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const links = await LoadLinks();

    if(!links[shortCode]) {
      return res.status(404).send("Short code not found");
    }

    return res.redirect(links[shortCode]);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});



const port = 9000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
