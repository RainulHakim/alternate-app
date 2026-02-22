# alternate-app
AlternAte is a dynamic nutrition assistant that analyzes meals and suggests smarter swaps without sacrificing taste or convenience. Users choose goals and dietary constraints, receive macro estimates and ingredient insights, save results, and compare meals. Powered by secure server-side AI with a design-forward, interactive interface

What it does
AlternAte is an AI-powered nutrition assistant. You can type any meal, like: “Grilled chicken sandwich with fries and iced tea.” In seconds, AlternAte shows: Calories Protein, carbs, fat Fiber, sugar, sodium Health flags (like high sodium or low fiber) It also gives you 3 smarter swaps based on your goal, whether that’s weight loss, muscle gain, heart health, or just eating balanced.

Compare Two Meals

You can compare two meals side by side. For example: A burrito bowl vs. a loaded quesadilla. AlternAte breaks down both meals and explains: Which one better fits your goal The tradeoffs How to improve either one It doesn’t just show numbers. It tells you what actually matters.

Check Your Whole Diet

You can paste your entire day of eating, and AlternAte will: Score it from 0–100 Tell you what’s working Point out what’s too high or too low Suggest a realistic improved version of your day You can also upload a food photo for analysis.

Meal Log and Weekly Score

Every meal you analyze can be saved. Your saved meals build a weekly health score based on things like: Sodium control Sugar control Fiber intake Protein balance Calorie balance Variety The score updates automatically and gives you a tier rating from low to very good.

Leaderboard and Points

AlternAte also makes healthy eating social. You can compete with friends on a weekly leaderboard. The better your score, the higher you rank. You earn points for actions like: Saving meals Completing diet checks Logging consistently Reaching high weekly scores It turns nutrition into something interactive instead of overwhelming.

How we built it
The app is built with React and Vite. All AI calls go through a secure Vercel serverless function so the API key is never exposed to users. I use two Gemini models: One for full analysis, comparisons, and vision One lightweight version for fast meal breakdowns All responses are forced into strict JSON so the data stays structured and reliable. Meal history and points are stored locally in the browser for the prototype.


