import express from "express";
const router = express.Router();

router.get("/", async (req, res, next) => {
  res.send("Hello world");
});

export default router;
