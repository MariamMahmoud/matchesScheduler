# matchesScheduler

This algorithm orginially puts priority first
It only takes into consideration prefrences after picking up the top priority
So if something has a preferred squad that can work on it the next day and it can wait till then it won't
which is the down side of this algorith
However it will make sure that the top priorities are done first no matter what
In order to solve that I added a `_getBeastMatchingSqaud` method, this method sees if there is an upcoming squad the preferss it and will still meet the dead line
If so it will assign it to that squad, otherwise it will continue with the brute force methos, which is priority comes first.

The algorith will loop on matches sorted by priorities so this will ensure that the highest priority matches get assigned first
The Brute force also has another problem which is too many BD hits and it processes the remaining capcaity for each squad and the time left to process a match
This can be solved assuming that all operations are done in memory and only the assigned matches gets saved updating all squads at once.

Another problem mentioned in the comments is that calculating the time left for processing a match is inaccurate, it assumes the next squad picking the match has the same prefrence of the current match
Couldn't find a way to optimize that.

There are a lot of optimization that should be decided here, like how often do we run this assigning code, is it whenever we add a match, then what?
would it re priotrise everything starting from the upcoming shifts clearing assignments and reassigning them based on priorities,
or just continues on the existing assignements as is