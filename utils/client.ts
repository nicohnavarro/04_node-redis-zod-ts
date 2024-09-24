import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function initializeRedisClient() {
  console.log("REDIS");
  //Singleton Pattern
  if (!client) {
    client = createClient();
    console.log(client);
    client.on("error", (err) => {
      console.error(err);
    });
    client.on("connect", () => {
      console.log("Redis connected");
    });
    await client.connect();
  }
  return client;
}
