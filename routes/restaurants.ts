import express from "express";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { validate } from "../middlewares/validate.js";
const router = express.Router();

router.post("/", validate(RestaurantSchema), async (req, res) => {
  const data = req.data as Restaurant;
});

router.put("/", validate(RestaurantSchema), async (req, res) => {});

export default router;
