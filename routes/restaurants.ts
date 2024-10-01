import express, {
  type Request,
  type Response,
  type NextFunction,
  response,
} from "express";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant.js";
import { validate } from "../middlewares/validate.js";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantByRatingKey,
  restaurantCuisinesKeyById,
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
  weatherKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { checkRestaurantExist } from "../middlewares/checkRestaurant.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10 } = req.query;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);
  try {
    const client = await initializeRedisClient();
    const restaurantIds = await client.zRange(
      restaurantByRatingKey,
      start,
      end,
      //{ REV: true }, For some reason this doesn't work ☹️
    );
    console.log(restaurantIds);
    const restaurants = await Promise.all(
      restaurantIds.map((id) => client.hGetAll(restaurantKeyById(id))),
    );
    return successResponse(res, restaurants);
  } catch (error) {
    next(error);
  }
});

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
      const [viewCount, restaurant, cuisines] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
        client.sMembers(restaurantCuisinesKeyById(restaurantId)),
      ]);
      return successResponse(res, { ...restaurant, cuisines });
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:restaurantId/weather",
  checkRestaurantExist,
  async (
    req: Request<{ restaurantId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { restaurantId } = req.params;
    try {
      const client = await initializeRedisClient();
      const weatherKey = weatherKeyById(restaurantId);
      const cachedWeather = await client.get(weatherKey);

      if (cachedWeather) return successResponse(res, JSON.parse(cachedWeather));

      const restaurantKey = restaurantKeyById(restaurantId);
      const coords = await client.hGet(restaurantKey, "location");

      if (!coords)
        return errorResponse(res, 404, "Coordinates have not been found");

      const [lng, lat] = coords.split(",");
      const apiResponse = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall/overview?lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`,
        //`https://api.openweathermap.org/data/2.5/weather?units=imperial&lat=${lat}&log=${lng}&appid=${process.env.WEATHER_API_KEY}`,
      );
      console.log(apiResponse);
      if (apiResponse.status === 200) {
        const json = await apiResponse.json();
        await client.set(weatherKey, JSON.stringify(json), { EX: 60 * 60 });
        return successResponse(res, json);
      }

      return errorResponse(res, 500, "Couldn't fetch weather info");
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:restaurantId/reviews",
  checkRestaurantExist,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;
    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewIds = await client.lRange(reviewKey, start, end);
      const reviews = await Promise.all(
        reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id))),
      );
      return successResponse(res, reviews);
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
      await Promise.all([
        ...data.cuisines.map((cuisine) =>
          Promise.all([
            client.sAdd(cuisinesKey, cuisine),
            client.sAdd(cuisineKey(cuisine), id),
            client.sAdd(restaurantCuisinesKeyById(id), cuisine),
          ]),
        ),
        client.hSet(restaurantKey, hashData),
        client.zAdd(restaurantByRatingKey, { score: 0, value: id }),
      ]);
      return successResponse(res, hashData, "Added new restaurant");
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
      const restaurantKey = restaurantKeyById(restaurantId);
      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now(),
        restaurantId,
      };

      const [reviewCount, setResult, totalStars] = await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailsKey, reviewData),
        client.hIncrByFloat(restaurantKey, "totalStars", data.rating),
      ]);
      const avgRating = Number((totalStars / reviewCount).toFixed(1));
      await Promise.all([
        client.zAdd(restaurantByRatingKey, {
          score: avgRating,
          value: restaurantId,
        }),
        client.hSet(restaurantKey, "avgStars", avgRating),
      ]);
      return successResponse(res, reviewData, "Review Added");
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExist,
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res: Response,
    next: NextFunction,
  ) => {
    const { restaurantId, reviewId } = req.params;
    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailsKeyById(reviewId);
      const [removeResult, deleteResult] = await Promise.all([
        client.lRem(reviewKey, 0, reviewId),
        client.del(reviewDetailsKey),
      ]);
      if (removeResult === 0 && deleteResult === 0) {
        return errorResponse(res, 404, "Review not found");
      }
      return successResponse(res, reviewId, "Review deleted");
    } catch (error) {
      next(error);
    }
  },
);

router.put("/", validate(RestaurantSchema), async (req, res) => {});

export default router;
