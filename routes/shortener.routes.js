import {readFile,writeFile} from "fs/promises";
import crypto from "crypto";
import path from "path";
import { Router } from "express";

const router=Router();

const DATA_FILE = path.join("data", "links.json");

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
  
  router.get("/", async (req, res) => {
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
  
  router.post("/", async (req, res) => {
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
  
  router.get("/:shortCode", async (req, res) => {
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

export default router;
  