import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { validate } from "../middlewares/validate.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
} from "../utils/keys.js";
import { successResponse } from "../utils/responses.js";
import { checkRestaurantExist } from "../middlewares/checkRestaurant.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

const router = express.Router();

router.get(
  "/:restaurantId",
  checkRestaurantExist,
  async (
    req: Request<{ restaurantId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { restaurantId } = req.params;
    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [viewCount, restaurant] = await Promise.all([
        client.hGetAll(restaurantKey),
        client.hIncrBy(restaurantKey, "viewCount", 1),
      ]);
      return successResponse(res, restaurant);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:restaurantId/reviews",
  checkRestaurantExist,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;
    try {
      const client = await initializeRedisClient();
      const reviewId = nanoid();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);

      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now(),
        restaurantId,
      };

      await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailsKey, reviewData),
      ]);

      return successResponse(res, reviewData, "Review Added");
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
      return successResponse(res, hashData, "Added new restaurant");
    } catch (error) {
      next(error);
    }
  },
);

router.put("/", validate(RestaurantSchema), async (req, res) => {});

export default router;
