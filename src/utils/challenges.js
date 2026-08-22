// 42 daily challenges across all life directions — rotate by day of year
export const CHALLENGES = [
  // ─── God ─────────────────────────────────────────────────────
  { text: "Spend 5 minutes in silence today — no phone, no music. Just be still.", why: "God speaks in the quiet. You've been too loud to hear.", cat: 'god', emoji: '🕊️' },
  { text: "Read one Psalm out loud, slowly. Let it land.", why: "Speaking truth anchors it in the body, not just the mind.", cat: 'god', emoji: '🕊️' },
  { text: "Write one prayer of gratitude — specific, not generic.", why: "Specificity deepens gratitude. Vague prayers produce vague peace.", cat: 'god', emoji: '🕊️' },
  { text: "Before you open your phone this morning, say one thing you're thankful for out loud.", why: "The first thought sets the frame for the entire day.", cat: 'god', emoji: '🕊️' },
  { text: "Ask God one honest question today. Write it down and sit with it.", why: "Questions move closer to truth than answers ever will.", cat: 'god', emoji: '🕊️' },
  { text: "Memorize one verse or truth today. Repeat it 3 times tonight.", why: "What you put in your mind is what rises in your hardest moments.", cat: 'god', emoji: '🕊️' },

  // ─── Health ───────────────────────────────────────────────────
  { text: "Drink a full glass of water before your first cup of anything else.", why: "You wake up dehydrated after 8 hours. Give your body what it needs first.", cat: 'health', emoji: '💪' },
  { text: "Take a 10-minute walk alone — no earphones, no distractions.", why: "Walking without input is thinking time. Most people never think alone.", cat: 'health', emoji: '💪' },
  { text: "Be in bed with lights off by 10:30 PM tonight.", why: "The hours before midnight are worth double for recovery. Guard them.", cat: 'health', emoji: '💪' },
  { text: "Eat all 3 meals today sitting at a table, without your phone.", why: "Mindless eating is mindless living. Be present for your body.", cat: 'health', emoji: '💪' },
  { text: "Do 20 push-ups right now, before you continue your day.", why: "You don't need a gym. You need the decision. Make it.", cat: 'health', emoji: '💪' },
  { text: "Skip one unhealthy thing you'd normally eat today. Just today.", why: "One good decision creates the next one. Start the chain.", cat: 'health', emoji: '💪' },
  { text: "Stretch for 5 minutes before you sleep tonight.", why: "Your body carries tension you don't notice until you release it.", cat: 'health', emoji: '💪' },

  // ─── Wealth ───────────────────────────────────────────────────
  { text: "Write down exactly how much you spent yesterday. Look at the total.", why: "What is measured is managed. Most people avoid this number from fear.", cat: 'wealth', emoji: '💰' },
  { text: "Read one article or watch one video about personal finance today.", why: "Financial education has the highest return of any investment.", cat: 'wealth', emoji: '💰' },
  { text: "Say no to one purchase today that you don't truly need.", why: "Every unspent rupee is a soldier working for your future self.", cat: 'wealth', emoji: '💰' },
  { text: "Identify one unnecessary subscription or habit draining money. Cancel or cut it.", why: "Small leaks sink big ships. Wealth is built by plugging the leaks.", cat: 'wealth', emoji: '💰' },
  { text: "Write down one way to earn ₹500 extra this month.", why: "Wealthy people obsess over earning, not just saving. Think like an owner.", cat: 'wealth', emoji: '💰' },
  { text: "Calculate your net worth today: assets minus liabilities.", why: "You can't navigate without knowing where you are right now.", cat: 'wealth', emoji: '💰' },

  // ─── Family ───────────────────────────────────────────────────
  { text: "Call one family member today — not text. Actually call and listen.", why: "A voice carries warmth that text can never transmit.", cat: 'family', emoji: '❤️' },
  { text: "Tell someone in your family specifically why you appreciate them.", why: "'I love you' is nice. 'I love you because...' changes a person forever.", cat: 'family', emoji: '❤️' },
  { text: "Do one household task that isn't 'your job' to do.", why: "Service without expectation is the highest love language.", cat: 'family', emoji: '❤️' },
  { text: "Have one meal today with your family — phone face-down on the table.", why: "Presence is the rarest, most precious gift in the digital age.", cat: 'family', emoji: '❤️' },
  { text: "Ask one family member: 'How are you really doing?' — then truly listen.", why: "Most people are never asked this question and carry the weight alone.", cat: 'family', emoji: '❤️' },
  { text: "Apologize to someone you spoke harshly to — even if it was days ago.", why: "Unfinished apologies fester in relationships like untreated wounds.", cat: 'family', emoji: '❤️' },
  { text: "Write down 3 specific things you are grateful for about your family.", why: "Gratitude prevents the familiarity that slowly breeds neglect.", cat: 'family', emoji: '❤️' },

  // ─── Professional ─────────────────────────────────────────────
  { text: "Block 90 minutes this morning for your hardest task. Start with nothing else open.", why: "Peak focus hours are finite. Protect them like you protect your money.", cat: 'pro', emoji: '💼' },
  { text: "Write down the 3 outcomes you will produce this week — not tasks, outcomes.", why: "Activity is not progress. Outcomes are the only thing that moves life forward.", cat: 'pro', emoji: '💼' },
  { text: "Learn one new thing in your field today. Read, watch, or ask a better person.", why: "Expertise is just accumulated curiosity applied consistently.", cat: 'pro', emoji: '💼' },
  { text: "Delete one app or notification from your phone that steals your focus.", why: "Your attention is your most valuable professional asset. Protect it.", cat: 'pro', emoji: '💼' },
  { text: "Send a message of genuine appreciation to someone whose work helped you.", why: "People work harder for recognition than for salary. Give freely.", cat: 'pro', emoji: '💼' },
  { text: "Ask for feedback on something you did recently. Be ready to actually hear it.", why: "Feedback is free coaching. Most people avoid it out of ego and fear.", cat: 'pro', emoji: '💼' },

  // ─── People & Words ───────────────────────────────────────────
  { text: "In your next conversation, ask one more question than you normally would.", why: "The most interesting people are the most interested people.", cat: 'people', emoji: '🗣️' },
  { text: "When someone is speaking today, just listen. Don't prepare your response while they talk.", why: "Most people are waiting to speak, not truly listening. Be different.", cat: 'people', emoji: '🗣️' },
  { text: "Before you react to something that frustrates you today, take one full breath.", why: "Between stimulus and response is your freedom. Use it.", cat: 'people', emoji: '🗣️' },
  { text: "Find something genuinely worth complimenting in 3 different people today and say it.", why: "Looking for good in others changes how you see the world — and yourself.", cat: 'people', emoji: '🗣️' },
  { text: "Replace one complaint today with an observation or a solution.", why: "Complainers drain energy from every room. Be the one who changes the frame.", cat: 'people', emoji: '🗣️' },
  { text: "Think of someone who helped you. Tell them what they did and how it mattered.", why: "Unexpressed gratitude is the same as ingratitude.", cat: 'people', emoji: '🗣️' },

  // ─── Mindset ──────────────────────────────────────────────────
  { text: "Write down your biggest current fear. Ask: Is this real or am I imagining it?", why: "Most fears live only in the mind. Naming them on paper shrinks them.", cat: 'mind', emoji: '🧠' },
  { text: "Do the task you've been avoiding for more than 3 days. Start it in the next 5 minutes.", why: "Avoidance drains 10x more energy than the task itself takes to complete.", cat: 'mind', emoji: '🧠' },
  { text: "Spend 10 minutes reviewing where you were 1 year ago vs where you are today.", why: "Perspective is the cure for feeling stuck. You have come farther than you think.", cat: 'mind', emoji: '🧠' },
  { text: "Say yes today to something you'd normally say no to out of comfort or habit.", why: "Growth only happens outside the comfortable and familiar. Lean in.", cat: 'mind', emoji: '🧠' },
]

export function getDailyChallenge() {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const dayOfYear = Math.ceil((now - startOfYear) / 86400000)
  return CHALLENGES[dayOfYear % CHALLENGES.length]
}

export function getTimePulse() {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const dayOfYear = Math.ceil((now - startOfYear) / 86400000)
  const totalDays = (year % 4 === 0) ? 366 : 365

  // Week of year
  const weekOfYear = Math.ceil(dayOfYear / 7)

  // Days left in month
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
  const daysLeftInMonth = daysInMonth - now.getDate()
  const monthName = now.toLocaleString('default', { month: 'long' })

  // Weekends left this year (count remaining Sundays)
  let weekendsLeft = 0
  for (let d = new Date(now); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) weekendsLeft++
  }

  const yearPct = Math.round((dayOfYear / totalDays) * 100)
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  const daysLeftInYear = totalDays - dayOfYear

  return { weekOfYear, daysLeftInMonth, monthName, weekendsLeft, yearPct, daysLeftInYear, isWeekend, dayOfYear }
}

export function getWiseGreeting(name) {
  const hour = new Date().getHours()
  const n = name && name !== 'You' ? name : null
  const you = n ? n : 'friend'

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const day = Math.ceil((now - startOfYear) / 86400000)

  const greetings = {
    morning: [
      `The morning belongs to those who rise for it, ${you}.`,
      `Start before the noise does, ${you}. The day is yours.`,
      `Aurelius started each morning asking: "What difficulty will I face today, and how will I meet it?" What's yours, ${you}?`,
      `The first hour is the rudder of the day, ${you}. Set it wisely.`,
    ],
    afternoon: [
      `Midday, ${you}. Is your frog eaten? Refocus if not — the day isn't done.`,
      `Half your day is behind you, ${you}. Make the second half deliberate.`,
      `Afternoon is when resolve weakens, ${you}. This is the test.`,
    ],
    evening: [
      `The sun is setting, ${you}. The day will not return. Did it matter?`,
      `Evening, ${you}. "Withdraw into yourself as much as you can." — Seneca. The world will wait.`,
      `What did you do today that your future self will thank you for, ${you}?`,
    ],
    night: [
      `Rest is preparation for tomorrow's battle, ${you}. Protect your sleep.`,
      `The best gift you can give tomorrow's self is a good night's rest, ${you}.`,
      `Night, ${you}. Aurelius wrote every night. Your diary is waiting.`,
    ],
  }

  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  return greetings[period][day % greetings[period].length]
}
