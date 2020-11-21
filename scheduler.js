const NUMBER_OF_HOURS_PER_SHIFT = 8
const EXPERT_COLLECTION_TIME = 4
const EXTRA_COLLECTION_TIME = 1
const MATCH_DURATION_IN_MINS = 110
const NUMBER_OF_TEAMS = 2

const assignCollectors = (squads, matches) => {
    const availableMatches = _getAvailableMatches()
    availableMatches.forEach(match => {
        _assignToSquad(match)     
    });
}

// I'd save the matches with the available time timestamp instead of the kick-off time 
const _getAvailableMatches = () => {
    const now = new Date.now()
    // Get all matches join priority and priority hours
    const matches = Matches.find({}).poppulate('competition', 'priority').poppulate('priority', 'hours')

    // TODO: assume this info already exists, no need to calculate them
    const updatedMatches = matches.map(match => {
        match.availableForProcessingTime = match.kikk_off + MATCH_DURATION_IN_MINS
        match.deadline = match.kick_off + match.competiton.priority.hours
    })
    // save the calculations for easier pricessing
    updatedMatches.save()

    return updatedMatches.filter(match => match.availableForProcessingTime > now)
}

const _assignToSquad = (match) => {
    const availableSquads = _getAvailableSquads() 
    // Brute force, assuming there are no prefrences take the top priority
    let squad = availableSquads[0]
    squad.preferred = false

    const preferringSquads = availableSquads.filter(squad => squad.prefrence == match.competiton)
    const bestMatchingSqaud = _getBeastMatchingSqaud(preferringSquads)
    // replace with best matching squad
    if(bestMatchingSqaud){
        squad = bestMatchingSqaud
        squad.preferred = true
    }

    squad.matches.push(match._id)
    squad.save()
}

const _getAvailableSquads = () => {
    // fetch upcoming squads whoes time left is > 0
    const now = new Date.now()
    const squads = Schedule.find({}).poppulate('prefrences', 'squad')
    // This is a very very bad processing however
    // I'd save the schedule data differently to avoid it
    // I would add the timestamp for the begining of the next shift time
    // Also I'd save the shift capacity in hours (number of squad members * 8 working hours)
    // Then it would be just fetch based on the filter query in one db operation
    const updatedSquads = squads.map(squad => {
        // find how to get timestamp from moment given a date and time
        squad.shiftStartTime = squad.shift == 'Night' ? _convertToTimeStamp(shift.date, '18') : _convertToTimeStamp(shift.date, '8')
        squad.capacity = squad.quantity * NUMBER_OF_HOURS_PER_SHIFT
    })

    updatedSquads.save()
    
    return updatedSquads.filter(squad => squad.shiftStartTime > now && squad.capacity > 0)
}

const _convertToTimeStamp = (date, timeInDay) => {/* convert date and timeInDay to timestamp and return the timestamp */}
const _updateSquadAndMatchCapacity = (squad, match) => {
    let requiredTime  = squad.preferred ? EXPERT_COLLECTION_TIME  : EXPERT_COLLECTION_TIME + EXPERT_COLLECTION_TIME
    const timeConsumedFromSquad = squad.capacity - (requiredTime * NUMBER_OF_TEAMS)
    
    if(timeConsumedFromSquad > 0 ) { // squad still have capacity
        squad.capacity = timeConsumedFromSquad
        match.timeConsumedFromSquad = 0

    } else if (timeConsumedFromSquad < 0) { // need anothor squad to pick it up
        squad.capacity = 0
        // the error here is that it will calculate the requiredTimeToCompleteProcessing from the same type of previous prefrence
        // so if at first a prefering squad picked the match up it will calculate the time left based on an expert squad picking up the job
        match.requiredTimeToCompleteProcessing = timeConsumedFromSquad * -1
    }
    else { // all is fitting perfectly
        squad.capacity = 0
        match.timeConsumedFromSquad = 0
    }
    squad.save()
    match.save()

    return { remainingSquadCapacity: squad.capacity, remainingMatchRequiredTime: match.requiredTimeToCompleteProcessing }
}

const _getBeastMatchingSqaud = (preferringSquads, match) => {
    preferringSquads.forEach(squad => {
        const shiftEndTime = squad.shiftStartTime + NUMBER_OF_HOURS_PER_SHIFT
        if(match.deadline > shiftEndTime && squad.capacity > 0 ) {
            return squad
        }
        break;
    })
}
