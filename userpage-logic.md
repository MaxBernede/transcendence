## TRYING TO WRITE DOWN ALL THE STUFF I HAVE WORKED ON SO FAR BUT IT IS QUITE A LOT TO REMEMBER

## USERPAGE LOGIC:

- backend: handles authentication, fetches data, and ensures relationships (achievements, match history etc) are included
  it updates user data as needed

- frontend: dynamically fetches and renders user stats, avatar, achievements, and match history based on the backend response

- security: the backend uses the JWT to identify the user
            the frontend securely fetches data and displays it dynamically

## LOGGING IN:

- AuthController handles request in the login() function
- Authservice validates the username and password against database

- user logs in through axios.post('http://localhost:3000/auth/login')
- backend checks username and password are correct and if so creates JWT token with id / username / email.
  which is stored as a cookie in the browser (this allows access protected routes)
- it will then be send as a request for authentication

- Why HTTP-only?
  Prevents JavaScript from accessing the cookie, protecting against XSS (Cross-Site Scripting) attacks
  Automatically sent with requests, making authentication seamless


## FETCHING THE USER DATA:

- UserService fetches the user from the database using findOne

- Userpage component uses useEffect to fetch all the data from axios.get('http://localhost:3000/api/users/me') on the frontend
- the backend uses the AuthGuard to verify the token and get the users ID from it
- Once validated, the backend retrieves the user’s ID (sub) from the JWT payload and queries the database for the user’s information.
- fetched user data is placed into userdata, achievements, match history etc and these frontend components render it

- The backend returns the user data, including:

	Stats (wins, losses, ladder_level).
	Avatar (image.link or avatar fallback).
	Achievements (eager-loaded with relations: ['achievements']).
	Match History (queried from the match_history table).

- Relationships like achievements and matchHistory are loaded using relations to ensure the data is available in one query

## RENDERING THE DATA ON THE FRONTEND:

- buildAvatarUrl function makes sure the avatar is fetched and needs this to do so:

	Image Link: The image.link provided in the user object.
	Avatar URL: The avatar property of the user.
	Default Avatar: /assets/Bat.jpg.

- The updateAvatar method in UserService updates the user's avatar in the database (if the previous avatar was a locally stored file, it deletes it to prevent  
   leftover files you aren't doing anything with)

- The achievements array is mapped to display the achievement name and description.
  Example: "Champion - Won the championship."

- Match History array is rendered by the MatchHistory component.	
  Each match includes details like the type of match, opponent, result, and score.

## HOW TO TEST:

## LOGIN:

- Endpoint: POST http://localhost:3000/auth/login

- Body:

  {
  "username": "testuser",
  "password": "testpassword"
  }

- it will show a Set-Cookie header with the JWT if successful

## TEST USER DATA:

- Endpoint: GET http://localhost:3000/api/users/me

- Headers:
  Ensure the Cookie header contains the JWT from the login step (find JWT token in cookies inspect console)

- the user data will include stats, avatar URL, achievements, and match history

## UPDATE STATS:

- Endpoint: PUT http://localhost:3000/api/users/:id

- Body:

	{
	"wins": 10,
	"loose": 5,
	"ladder_level": 3
	}

## UPDATE MATCH HISTORY:

- Endpoint: PUT http://localhost:3000/api/users/:id/match-history

- Body:

	[
	{
		"type": "Ranked",
		"opponent": "Player123",
		"result": "Win",
		"score": "5-3"
	},
	{
		"type": "Casual",
		"opponent": "Player456",
		"result": "Loss",
		"score": "2-5"
	}
	]





