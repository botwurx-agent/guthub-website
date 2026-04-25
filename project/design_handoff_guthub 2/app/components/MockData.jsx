// MockData.jsx — realistic mock state for "Steve Nazari"

const MOCK = {
  user: {
    name: 'Steve Nazari',
    firstName: 'Steve',
    initials: 'SN',
    age: 58,
    weightLb: 225,
    goalWeightLb: 215,
    heightIn: 70,
    conditions: ['IBS', 'Mild reflux'],
    allergies: ['Dairy', 'Gluten (sensitive)'],
    diet: 'Mediterranean-ish',
    goals: ['Reduce bloating', 'Lose 10 lb', 'More steady energy'],
  },
  gutScore: 72,
  gutScorePrev: 64,
  streakDays: 11,

  todayMacros: {
    calories: { cur: 1240, goal: 2100 },
    protein:  { cur: 84,  goal: 140 },
    carbs:    { cur: 132, goal: 220 },
    fat:      { cur: 38,  goal: 78 },
  },

  todayMeals: [
    { id: 'm1', meal: 'Breakfast', time: '7:42 AM', title: 'Oatmeal with berries & almond butter',
      calories: 380, protein: 12, carbs: 58, fat: 14, gutFlags: ['high-fiber'], img: 'oat' },
    { id: 'm2', meal: 'Lunch', time: '12:18 PM', title: 'Grilled chicken with roasted veg & quinoa',
      calories: 520, protein: 42, carbs: 48, fat: 16, gutFlags: ['lean-protein', 'low-FODMAP'], img: 'chicken' },
    { id: 'm3', meal: 'Snack', time: '3:30 PM', title: 'Greek-style coconut yogurt + walnuts',
      calories: 240, protein: 8, carbs: 14, fat: 16, gutFlags: ['probiotic'], img: 'yogurt' },
  ],

  recentSymptoms: [
    { id: 's1', when: 'Today, 1:30 PM', kind: 'Bloating', severity: 2, note: 'Mild after lunch.' },
    { id: 's2', when: 'Yesterday, 9:00 PM', kind: 'Reflux', severity: 3, note: 'After late dinner.' },
    { id: 's3', when: 'Yesterday, 3:00 PM', kind: 'Energy dip', severity: 2 },
  ],

  insights: [
    { title: 'Dairy + bloating', body: 'In the last 14 days, you reported bloating within 4 hours of dairy 4 of 5 times.', tone: 'warn' },
    { title: 'Fiber is on track', body: 'Average 28g/day this week — right in the target window for IBS support.', tone: 'good' },
    { title: 'Late dinners → reflux', body: '3 of 4 reflux entries were after dinners eaten past 8 PM.', tone: 'warn' },
  ],

  weekPlan: [
    { day: 'Mon', breakfast: 'Steel-cut oats, blueberries, walnuts', lunch: 'Lentil soup with sourdough', dinner: 'Salmon, brown rice, asparagus' },
    { day: 'Tue', breakfast: 'Greek yogurt parfait', lunch: 'Mediterranean quinoa bowl', dinner: 'Turkey meatballs with zucchini noodles' },
    { day: 'Wed', breakfast: 'Veggie omelet, sourdough toast', lunch: 'Chicken & avocado salad', dinner: 'Baked cod with sweet potato' },
    { day: 'Thu', breakfast: 'Smoothie: spinach, banana, almond butter', lunch: 'Tuna nicoise', dinner: 'Stir-fry chicken with brown rice' },
    { day: 'Fri', breakfast: 'Chia pudding with berries', lunch: 'Lentil & arugula salad', dinner: 'Grilled shrimp tacos' },
    { day: 'Sat', breakfast: 'Frittata with greens', lunch: 'Grain bowl with tahini', dinner: 'Roast chicken, root vegetables' },
    { day: 'Sun', breakfast: 'Avocado toast with eggs', lunch: 'Soba noodles with tofu', dinner: 'Family pasta night (gluten-free)' },
  ],

  shoppingList: [
    { cat: 'Produce', items: ['Spinach', 'Avocado (3)', 'Sweet potatoes', 'Asparagus', 'Berries (mixed)', 'Bananas', 'Zucchini'] },
    { cat: 'Protein', items: ['Salmon fillets', 'Chicken thighs', 'Ground turkey', 'Cod', 'Eggs (1 dozen)', 'Tofu (firm)'] },
    { cat: 'Pantry', items: ['Steel-cut oats', 'Brown rice', 'Quinoa', 'Lentils (red)', 'Olive oil', 'Tahini', 'Almond butter'] },
    { cat: 'Dairy alts', items: ['Coconut yogurt', 'Almond milk (unsweetened)'] },
  ],

  threads: [
    { id: 't1', title: 'Why am I bloated after lunch?', snip: 'Looking at the last 7 days...', when: 'Today' },
    { id: 't2', title: 'Plan my week (low-FODMAP)', snip: 'Here\'s a 7-day plan...', when: 'Yesterday' },
    { id: 't3', title: 'Magnesium for sleep', snip: 'For your sleep pattern...', when: '3d ago' },
    { id: 't4', title: 'Reading my Vibrant Wellness lab', snip: 'Your zonulin is mildly elevated...', when: '5d ago' },
  ],

  trends30: {
    score: [58,62,60,64,63,65,64,66,68,67,69,70,68,71,72,70,72,71,73,72,74,73,75,72,73,72,71,73,72,72],
    weight: [228,228,227,227,226,226,225,225,225,224,224,224,223,223,222,222,222,221,221,220,220,219,219,219,218,217,217,217,216,215],
    bloat:  [3,3,2,3,2,2,3,2,2,1,2,2,1,2,1,1,2,1,1,2,1,1,1,2,1,1,1,1,2,1],
  },

  notifications: [
    { title: 'Time to log dinner', when: '2 min ago' },
    { title: 'Your lab analysis is ready', when: '1 hr ago' },
    { title: 'Coach: a question about your reflux', when: '3 hr ago' },
  ],
};

window.MOCK = MOCK;
