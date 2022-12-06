# Micro URL API
#### Shorten long, boring URLs to memorable, fun, micro URLs in a RESTful way!

## Technologies:
 - Node JS
 - TypeScript
 - MySQL
 - Express JS

## Routes (GET Method):
 - **Create a new micro URL:** `/new` (Required queries - `owner`, `short`, `url`)
 - **View existing micro URL(s):** `/view` (Required queries - `short`: returns an object if found | `owner`: returns an array of objects if found)
 - **Change an existing micro URL:** `/change` (Required queries - `short` & Optional queries - `owner`, `new_short`, `url`)
 - **Remove an existing micro URL:** `/remove` (Required queries - `short`)

 - **Visit a URL via micro URL:** `/anything`

## Queries:
 - _`owner`:_ Name of owner (2 - 40 characters)
 - _`short`:_ Desired micro URL back-half (1 - 40 characters containing only 0 - 9, a - z, A - Z, _, - and .)
 - _`url`:_ The boring URL
 - _`new_short`:_ New desired micro URL back-half (same as `short`, applies only to `/change` route)
