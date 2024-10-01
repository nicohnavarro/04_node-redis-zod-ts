# Node API with Redis, TS & Zod

##

### pnpm

### Zod validation

Add schemas & types

### Redis

using Hashes

- Field-Value pairs
- Represent basic objects, counter, etc.
- No nested data (arrays/objects)
- Fields added and removed as needed

| Field  | Value       |
| ------ | ----------- |
| Id     | 1           |
| name   | Better Food |
| rating | 5           |

#### Some commands

[HSET] : Sets the value of one or more fields on a hash
[HGET] : Returns the value at a given field
[HGETALL] : Returns all the fields and values of the hash stored at key
[HMGET] : Return the value at one or more given fields
[HINCRBY] : Increments the value at a given field by the integer provided

### Sets

Unordered Collection
Unique Strings

- cuisines => key
- cuisine:italian
- restaurant_cuisines: restaurant1

| cuisines |
| -------- |
| Italian  |
| Japanise |
| Mexican  |
| Indian   |

[SADD]: Add a new member to a set
[SREM]: Removes the specified member fron the set
[SISMEMBER]: Test a string for a set membership
[SINTER]: returns the set of members that two or more sets have in common
[SCARD]: returns the size of a set

#### Sorted Sets

- Unique string
- Ordered by a score
- Leaderboard

`restaurants:by_rating => key`
| Restaurant | Rating |
| -------------- | --------------- |
| restaurant1 | 3.5 |
| restaurant2 | 4 |
| restaurant3 | 5 |

Member | Score

[ZADD]: Adds new member and associated score to a sorted set
[ZRANGE]: Returns a member of a sorted set, sorted within a given range
[ZRANK]: Returns the rank of the provided member assuming the sorted
[ZREVRANK]: Returns the rank of the provided member assuming the sorted set
