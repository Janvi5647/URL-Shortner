import express from "express";
import router from "./routes/shortener.routes.js";

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set()

app.use(router);

const port = 9000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
