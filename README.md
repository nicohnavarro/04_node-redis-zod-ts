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
