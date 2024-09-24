import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { validate } from "../middlewares/validate.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import { restaurantKeyById } from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";

const router = express.Router();

router.get(
  "/:restaurantId",
  async (
    req: Request<{ restaurantId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { restaurantId } = req.params;
    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const restaurant = await client.hGetAll(restaurantKey);
      return successResponse(res, restaurant);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/",
  validate(RestaurantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body as Restaurant;
    try {
      const client = await initializeRedisClient();
      const id = nanoid();
      const restaurantKey = restaurantKeyById(id);
      const hashData = { id, name: data.name, location: data.location };
      const addResult = await client.hSet(restaurantKey, hashData);
      console.log(`Added ${addResult} fields`);
      return successResponse(res, hashData, "Added new restaurant");
    } catch (error) {
      next(error);
    }
  },
);

router.put("/", validate(RestaurantSchema), async (req, res) => {
  console.log("PUT");
});

export default router;
