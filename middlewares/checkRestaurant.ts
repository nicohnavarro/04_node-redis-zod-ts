import type { Request, Response, NextFunction } from "express";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import { errorResponse } from "../utils/responses.js";

export const checkRestaurantExist = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { restaurantId } = req.params;

  if (!restaurantId) return errorResponse(res, 400, "Restaurant Id not found");

  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);
  const isRestaurantExist = await client.exists(restaurantKey);

  if (!isRestaurantExist)
    return errorResponse(res, 404, "Restaurant Not Found");

  next();
};
