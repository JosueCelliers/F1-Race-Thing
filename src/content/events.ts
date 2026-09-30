import type { LifeEventDef } from './types';

/**
 * BitLife-style life events that pop up between race weekends.
 *
 * Placeholders: {first} {last} {teammate} {rival} {team} {series} {track}
 * {nation} {age}. {teammate} requires `when.needsTeammate` and {rival}
 * requires `when.needsRival`. Options with `outcomes` are resolved with a
 * mini wheel spin, so they should feel like a gamble.
 */
export const LIFE_EVENTS: LifeEventDef[] = [
  // ---------------------------------------------------------------------------
  // Teammate dynamics
  // ---------------------------------------------------------------------------
  {
    id: 'teammate-blame',
    title: 'Blame Game',
    emoji: '😡',
    text: '{teammate} told the press that the mess at {track} was “entirely your fault”. The quote is already on a T-shirt.',
    weight: 3,
    when: { needsTeammate: true, after: ['dnf', 'crash', 'noPoints'] },
    options: [
      { label: 'Call them out', emoji: '📢', hint: 'Fans love drama', effects: { teammateRelation: -15, fans: 40, teamRelation: -5 }, text: 'The paddock is buzzing. Your garage is not.' },
      { label: 'Say nothing', emoji: '🤐', effects: { morale: -5, reputation: 1 }, text: 'You bite your tongue. It stings, but the grown-ups in the paddock notice.' },
      {
        label: 'Talk privately',
        emoji: '🤝',
        outcomes: [
          { weight: 3, text: 'You clear the air behind the motorhome. Respect restored.', effects: { teammateRelation: 12, morale: 4 } },
          { weight: 2, text: 'It turns into a shouting match. A catering tray is harmed.', effects: { teammateRelation: -8, morale: -4 } },
        ],
      },
    ],
  },
  {
    id: 'team-orders',
    title: 'Team Orders',
    emoji: '📻',
    text: 'The team boss pulls you aside: if you are ever ahead of {teammate} late in a race, you may be asked to “let them through”. It is not a question.',
    weight: 2,
    when: { needsTeammate: true, minRound: 3 },
    options: [
      {
        label: 'Agree to play ball',
        emoji: '🤝',
        hint: 'The team will remember',
        effects: { teamRelation: 10, teammateRelation: 6, morale: -8 },
        text: 'The boss nods. You feel like a very well-paid doorstop.',
      },
      { label: 'Refuse outright', emoji: '🙅', hint: 'Principles cost extra', effects: { teamRelation: -10, morale: 8, fans: 25 }, text: 'Word leaks. The fans love a rebel. The boss does not.' },
      {
        label: 'Nod, then ignore it',
        emoji: '😇',
        outcomes: [
          { weight: 2, text: 'The call never comes. You keep your dignity and your deniability.', effects: { morale: 5 } },
          { weight: 2, text: 'The call comes. You suddenly “lose radio”. Nobody believes you.', effects: { teamRelation: -12, teammateRelation: -10, fans: 30 } },
        ],
      },
    ],
  },
  {
    id: 'teammate-jealous',
    title: 'Green-Eyed Garage',
    emoji: '😒',
    text: '{teammate} has gone very quiet since your result at {track}. Their engineer says they are “processing”. Loudly. With a door.',
    weight: 3,
    when: { needsTeammate: true, after: ['win', 'podium'] },
    options: [
      {
        label: 'Offer them a coffee',
        emoji: '☕',
        hint: 'Olive branch, oat milk',
        outcomes: [
          { weight: 3, text: 'They accept, grudgingly. Mild warming detected.', effects: { teammateRelation: 10 } },
          { weight: 1, text: 'They pour it into a plant pot while holding eye contact.', effects: { teammateRelation: -6, morale: -3 } },
        ],
      },
      { label: 'Rub it in a little', emoji: '😏', hint: 'So tempting', effects: { teammateRelation: -15, morale: 6, fans: 15 }, text: 'You leave your trophy on their seat. Iconic. Unforgivable.' },
      { label: 'Stay out of it', emoji: '🙈', effects: { teammateRelation: -5, teamRelation: 4 }, text: 'You keep your head down. The team loves the calm. They stew alone.' },
    ],
  },
  {
    id: 'teammate-game-night',
    title: 'Paddock Besties?',
    emoji: '🎲',
    text: '{teammate} invites you to board-game night with their family. It is either the start of a real friendship or a very elaborate intelligence operation.',
    weight: 2,
    when: { needsTeammate: true, minRound: 2 },
    options: [
      {
        label: 'Go, bring snacks',
        emoji: '🍿',
        outcomes: [
          { weight: 3, text: 'You win at dice, lose at trivia and gain a genuine mate.', effects: { teammateRelation: 15, morale: 6 } },
          { weight: 1, text: 'You win too hard. A board is flipped. The friendship is on pause.', effects: { teammateRelation: -8, morale: 3 } },
        ],
      },
      {
        label: 'Go, but gather intel',
        emoji: '🕵️',
        hint: 'Know thy enemy',
        effects: { teammateRelation: 5, form: 2, morale: -3 },
        text: 'Between rounds you casually learn their braking points. You feel slightly guilty.',
      },
      { label: 'Politely decline', emoji: '🙂', effects: { teammateRelation: -5, form: 1 }, text: 'You spend the night on data instead. Lonely, but fast.' },
    ],
  },
  {
    id: 'teammate-prank',
    title: 'Prank War',
    emoji: '🎭',
    text: 'You open your driver room to find it filled floor to ceiling with ball-pit balls. {teammate} is grinning in the corridor. War has been declared.',
    weight: 2,
    when: { needsTeammate: true },
    options: [
      {
        label: 'Retaliate. Go big.',
        emoji: '🎁',
        hint: 'Escalation is an art',
        outcomes: [
          { weight: 2, text: 'You cling-film their scooter to the ceiling. The clip goes viral and even the boss laughs.', effects: { teammateRelation: 10, fans: 60, morale: 5 } },
          { weight: 1, text: 'You cling-film the wrong scooter. It belongs to the team boss.', effects: { teamRelation: -8, fans: 30 } },
        ],
      },
      { label: 'Laugh and dive in', emoji: '😂', effects: { teammateRelation: 8, morale: 4 }, text: 'You cannonball in and refuse to leave for an hour. Bonding achieved.' },
      { label: 'Report it to the boss', emoji: '🧑‍💼', effects: { teamRelation: 4, teammateRelation: -12 }, text: 'Technically correct. Socially catastrophic.' },
    ],
  },
  {
    id: 'teammate-upgrade',
    title: 'One Upgrade, Two Cars',
    emoji: '🔧',
    text: 'The shiny new floor has arrived, but there is only one. The team says {teammate} gets it because they are “further up the standings”. Hmm.',
    weight: 2,
    when: { needsTeammate: true, minRound: 3 },
    options: [
      { label: 'Accept it quietly', emoji: '😶', effects: { teamRelation: 6, morale: -8 }, text: 'You smile for the team. Inside, you are drafting a stern memo.' },
      {
        label: 'Demand a coin toss',
        emoji: '🪙',
        hint: 'Let fate decide',
        outcomes: [
          { weight: 1, text: 'Heads! The floor is yours. {teammate} stares at the coin in disbelief.', effects: { form: 2, teammateRelation: -10, morale: 5 } },
          { weight: 1, text: 'Tails. You asked for this. The team at least respects the sportsmanship.', effects: { morale: -6, teamRelation: 3 } },
        ],
      },
      {
        label: 'Kick up a fuss',
        emoji: '😤',
        hint: 'Squeaky wheels get parts',
        outcomes: [
          { weight: 1, text: 'They cave. The floor is yours, and so is the frosty atmosphere.', effects: { form: 2, teamRelation: -8, teammateRelation: -12 } },
          { weight: 2, text: 'They do not cave. You are now “difficult” in the team group chat.', effects: { teamRelation: -10, morale: -5 } },
        ],
      },
    ],
  },
  {
    id: 'teammate-setup-thief',
    title: 'Setup Thief',
    emoji: '🕵️',
    text: 'Your engineer discovers that {teammate} has been copying your setup sheets line for line. Their lap times suddenly look very familiar.',
    weight: 2,
    when: { needsTeammate: true, minRound: 2 },
    options: [
      { label: 'Lock down your data', emoji: '🔒', effects: { teammateRelation: -8, form: 1 }, text: 'New passwords, shredded printouts. Your secrets are safe again.' },
      {
        label: 'Feed them a fake setup',
        emoji: '🧪',
        hint: 'Deliciously petty',
        outcomes: [
          { weight: 2, text: 'They run your “special” setup and spin at the first corner. Chef’s kiss.', effects: { teammateRelation: -12, morale: 8 } },
          { weight: 1, text: 'They smell a rat and tell the boss you tried to sabotage them.', effects: { teammateRelation: -15, teamRelation: -8 } },
        ],
      },
      {
        label: 'Share it openly',
        emoji: '🤲',
        hint: 'A rising tide lifts all cars',
        effects: { teammateRelation: 12, teamRelation: 5, form: -1 },
        text: 'The team loves the attitude. Your advantage, less so.',
      },
    ],
  },
  {
    id: 'teammate-seat-rumour',
    title: 'Musical Chairs',
    emoji: '🪑',
    text: 'Rumour says {team} can only keep one of you next season. You and {teammate} are now being extremely, suspiciously polite to each other.',
    weight: 2,
    when: { needsTeammate: true, minRound: 5 },
    options: [
      {
        label: 'Ask the boss directly',
        emoji: '🗣️',
        outcomes: [
          { weight: 2, text: 'The boss laughs: “Relax, you are staying.” Probably.', effects: { morale: 8, teamRelation: 4 } },
          { weight: 1, text: '“Let’s see how the season goes.” That is not a yes.', effects: { morale: -8 } },
        ],
      },
      {
        label: 'Outwork them',
        emoji: '💪',
        hint: 'Sim sessions at 2am',
        effects: { form: 2, morale: -5, teammateRelation: -5 },
        text: 'You basically live at the factory. The cleaners know your coffee order.',
      },
      { label: 'Form an alliance', emoji: '🤝', effects: { teammateRelation: 12, teamRelation: -4 }, text: 'You agree to lobby for both seats. Management smells a union forming.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Rival dynamics
  // ---------------------------------------------------------------------------
  {
    id: 'rival-mind-games',
    title: 'Mind Games',
    emoji: '🧠',
    text: '{rival} tells a journalist you “brake like a nervous grandparent”. The clip is everywhere, and your nan is furious.',
    weight: 3,
    when: { needsRival: true },
    options: [
      {
        label: 'Fire back',
        emoji: '🔥',
        hint: 'Clapbacks trend',
        effects: { rivalHeat: 12, fans: 40, morale: 4 },
        text: 'You say they “overtake like a shopping trolley”. The internet is delighted.',
      },
      { label: 'Stay silent', emoji: '🧘', effects: { morale: -4, reputation: 2 }, text: 'You let the stopwatch do the talking. The grown-ups nod approvingly.' },
      {
        label: 'Send them cookies',
        emoji: '🍪',
        hint: 'Kill them with kindness',
        outcomes: [
          { weight: 2, text: 'They post the cookies with a laughing emoji. A truce, of sorts.', effects: { rivalHeat: -10, fans: 30 } },
          { weight: 1, text: 'They call it “passive-aggressive baking”. Honestly? Fair.', effects: { rivalHeat: 8, fans: 20 } },
        ],
      },
    ],
  },
  {
    id: 'rival-social-feud',
    title: 'Keyboard Warriors',
    emoji: '⌨️',
    text: 'Fans of {rival} have flooded your comments with tortoise emojis. Your fans are replying with tortoise facts. It is getting weird.',
    weight: 3,
    when: { needsRival: true },
    options: [
      {
        label: 'Post a tortoise pic',
        emoji: '🐢',
        hint: 'Own the meme',
        outcomes: [
          { weight: 2, text: 'You own the meme. Tortoise merch sells out in an hour.', effects: { fans: 80, money: 30, rivalHeat: 5 } },
          { weight: 1, text: 'Nobody gets the joke. You are now officially “the tortoise”.', effects: { fans: -20, morale: -5 } },
        ],
      },
      { label: 'Tag them publicly', emoji: '📱', effects: { rivalHeat: 15, fans: 50, teamRelation: -4 }, text: 'The feud goes mainstream. Your press officer needs a lie-down.' },
      { label: 'Log off for a week', emoji: '📵', effects: { morale: 6, fans: -15 }, text: 'Bliss. You had forgotten how nice trees are.' },
    ],
  },
  {
    id: 'rival-handshake',
    title: 'Respect Earned',
    emoji: '🤜',
    text: 'After a wheel-to-wheel scrap at {track}, {rival} walks over with a hand held out. Every camera in the paddock swings round.',
    weight: 3,
    when: { needsRival: true, after: ['win', 'podium', 'points'] },
    options: [
      { label: 'Shake it warmly', emoji: '🤝', effects: { rivalHeat: -12, reputation: 3, fans: 20 }, text: 'A classy moment. The clip is captioned “sportsmanship lives”.' },
      { label: 'Leave them hanging', emoji: '🙅', hint: 'Villain arc unlocked', effects: { rivalHeat: 15, fans: 60, reputation: -3 }, text: 'Awkward. Legendary. The booing is audible from space.' },
      {
        label: 'Go in for a hug',
        emoji: '🫂',
        outcomes: [
          { weight: 2, text: 'They hug back. The paddock melts. A rivalry softens.', effects: { rivalHeat: -15, fans: 50 } },
          { weight: 1, text: 'They were reaching past you for a water bottle. Mortifying.', effects: { morale: -6, fans: 40 } },
        ],
      },
    ],
  },
  {
    id: 'rival-crew-banter',
    title: 'Pit Lane Banter',
    emoji: '🗯️',
    text: 'One of {rival}’s mechanics mimes a crash as you walk past their garage. The rest of the crew cackles like a flock of seagulls.',
    weight: 2,
    when: { needsRival: true },
    options: [
      { label: 'Laugh along', emoji: '😅', effects: { morale: -3, rivalHeat: -5 }, text: 'You act like you are in on the joke. You are not.' },
      {
        label: 'Mime a trophy lift',
        emoji: '🏆',
        hint: 'Better back it up on Sunday',
        outcomes: [
          { weight: 1, text: 'The crew howls. Game on. You feel ten feet tall.', effects: { rivalHeat: 10, morale: 8, form: 1 } },
          { weight: 1, text: 'You trip over a tyre stack mid-mime. Their crew films it.', effects: { morale: -8, fans: 25 } },
        ],
      },
      { label: 'Complain to officials', emoji: '📋', effects: { rivalHeat: 8, reputation: -2, teamRelation: 3 }, text: 'Miming is not an offence, apparently. Your team admires the effort.' },
    ],
  },
  {
    id: 'rival-gala-dinner',
    title: 'Awkward Seating',
    emoji: '🍽️',
    text: 'At a {series} gala dinner, you are seated right next to {rival}. Three hours. Four courses. One very small table.',
    weight: 1,
    when: { needsRival: true, minRound: 4 },
    options: [
      {
        label: 'Make small talk',
        emoji: '💬',
        outcomes: [
          { weight: 2, text: 'Turns out you both hate olives. A fragile peace is born.', effects: { rivalHeat: -10, morale: 4 } },
          { weight: 1, text: 'Small talk becomes a debate about who braked too late. Voices rise.', effects: { rivalHeat: 10, fans: 20 } },
        ],
      },
      { label: 'Swap the name cards', emoji: '🔀', hint: 'Sneaky', effects: { morale: 5, reputation: -1 }, text: 'You end up beside a delightful retired mechanic. Best dinner ever.' },
      { label: 'Steal their dessert', emoji: '🍰', hint: 'An act of war', effects: { rivalHeat: 12, fans: 30, morale: 5 }, text: 'The crème brûlée incident will be discussed for years.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Media & social media
  // ---------------------------------------------------------------------------
  {
    id: 'media-awkward-interview',
    title: 'Awkward Interview',
    emoji: '🎤',
    text: 'A TV reporter asks what went wrong at {track}. You have been awake since 5am and your brain has quietly left the building.',
    weight: 3,
    when: { after: ['noPoints', 'dnf', 'crash'] },
    options: [
      { label: 'Honest answer', emoji: '🗣️', effects: { reputation: 2, teamRelation: -5 }, text: '“The car was undriveable.” True. The engineers are deeply hurt.' },
      { label: 'Blame the tyres', emoji: '🛞', effects: { morale: 3, reputation: -1 }, text: 'The classic. Nobody questions it. Nobody is impressed either.' },
      {
        label: 'Freestyle it',
        emoji: '🎲',
        hint: 'What could go wrong?',
        outcomes: [
          { weight: 2, text: 'You compare racing to making soup. It is weirdly profound. Clip of the week.', effects: { fans: 70, reputation: 2 } },
          { weight: 2, text: 'You say “um” 23 times. Someone remixes it into a dance track.', effects: { fans: 40, morale: -6 } },
        ],
      },
    ],
  },
  {
    id: 'media-viral-clip',
    title: 'Gone Viral',
    emoji: '📈',
    text: 'A clip of you trying to climb into your car the wrong way round has two million views. Your mum has sent it to you four times.',
    weight: 3,
    options: [
      { label: 'Lean into it', emoji: '🤳', hint: 'Content is content', effects: { fans: 90, reputation: -2 }, text: 'You recreate it in slow motion with dramatic music. A masterpiece.' },
      {
        label: 'Ask for it removed',
        emoji: '🚫',
        outcomes: [
          { weight: 1, text: 'It disappears. Mostly. The internet never truly forgets.', effects: { fans: -10, morale: 4 } },
          { weight: 2, text: 'Asking makes it trend even harder. Classic.', effects: { fans: 60, morale: -8 } },
        ],
      },
      { label: 'Ignore it', emoji: '🙃', effects: { morale: -3, fans: 20 }, text: 'It fades away eventually. Twelve weeks later.' },
    ],
  },
  {
    id: 'media-podcast',
    title: 'Podcast Invite',
    emoji: '🎧',
    text: 'The hit podcast “Box Box Brunch” wants you on for a two-hour chat. The hosts are famous for making drivers accidentally overshare.',
    weight: 2,
    options: [
      {
        label: 'Go on the show',
        emoji: '🎙️',
        hint: 'Two hours is a long time',
        outcomes: [
          { weight: 2, text: 'You are charming, funny and relaxed. Downloads explode.', effects: { fans: 110, reputation: 3 } },
          { weight: 1, text: 'You accidentally reveal the codename of the team’s next upgrade.', effects: { fans: 70, teamRelation: -10 } },
          { weight: 1, text: 'You spend twenty minutes on your childhood hamster. The internet adopts you both.', effects: { fans: 60, morale: -3 } },
        ],
      },
      { label: 'Decline politely', emoji: '🙅', effects: { teamRelation: 3, morale: 3 }, text: 'Your press officer exhales for the first time in weeks.' },
    ],
  },
  {
    id: 'media-documentary',
    title: 'Documentary Crew',
    emoji: '🎬',
    text: 'A streaming service wants to follow you for a whole season. Cameras in the garage, at home and even at the dentist. They promise “authentic drama”.',
    weight: 1,
    when: { minRound: 2, once: true },
    options: [
      {
        label: 'Full access',
        emoji: '🎥',
        hint: 'Fame, with side effects',
        effects: { fans: 200, money: 150, morale: -8, teamRelation: -4 },
        text: 'Your life is now “content”. Your mum has hired an agent.',
      },
      { label: 'Limited access', emoji: '🚪', effects: { fans: 80, money: 60, morale: -3 }, text: 'One tidy episode, a few awkward retakes, and your bedroom stays off camera.' },
      { label: 'No thanks', emoji: '🙅', effects: { morale: 6 }, text: 'You stay a mystery. Your weekends remain blissfully unfilmed.' },
    ],
  },
  {
    id: 'media-social-takeover',
    title: 'Social Media Takeover',
    emoji: '📱',
    text: 'The team lets you run its social accounts for a day. The media manager watches you like a hawk watching a toddler with scissors.',
    weight: 2,
    options: [
      {
        label: 'Post memes all day',
        emoji: '🤪',
        outcomes: [
          { weight: 2, text: 'Followers up 30%. The media manager quietly steals all your ideas.', effects: { fans: 90, teamRelation: 5 } },
          { weight: 1, text: 'A meme about the car being slow lands badly with the engineers.', effects: { fans: 60, teamRelation: -10 } },
        ],
      },
      { label: 'Keep it professional', emoji: '👔', effects: { teamRelation: 6, fans: 15 }, text: 'Tasteful. Informative. Mildly boring. Exactly how they like it.' },
      { label: 'Film a garage tour', emoji: '🎥', effects: { fans: 45, morale: 4, teamRelation: -3 }, text: 'You accidentally film a secret part. It gets blurred. Mostly.' },
    ],
  },
  {
    id: 'media-talk-show',
    title: 'Late-Night Sofa',
    emoji: '🛋️',
    text: 'A late-night talk show wants you as a guest. The host wants to race you around the studio in golf carts. There is a live band.',
    weight: 1,
    when: { minFans: 150 },
    options: [
      {
        label: 'Do the golf cart race',
        emoji: '⛳',
        outcomes: [
          { weight: 2, text: 'You win by a bumper. The studio erupts. The band plays you off.', effects: { fans: 150, morale: 6 } },
          { weight: 1, text: 'You lose to a 70-year-old host who cuts every corner. The clip haunts you.', effects: { fans: 100, morale: -8 } },
        ],
      },
      { label: 'Just do the chat', emoji: '🗨️', effects: { fans: 60, reputation: 2 }, text: 'Smooth, witty and gone in eight minutes. A solid showing.' },
      { label: 'Skip it, do sim work', emoji: '🖥️', effects: { form: 1, teamRelation: 4, fans: -5 }, text: 'The engineers are thrilled. The show books a juggler instead.' },
    ],
  },
  {
    id: 'media-superfan',
    title: 'Superfan',
    emoji: '🥹',
    text: 'A superfan has had your face tattooed on their leg. It looks like a startled potato wearing your helmet. They are filming your reaction.',
    weight: 2,
    when: { minFans: 50 },
    options: [
      { label: 'Hug them', emoji: '🫂', effects: { fans: 60, morale: 4 }, text: '“It is beautiful,” you lie, beautifully. The clip is pure wholesome.' },
      {
        label: 'Sign next to it',
        emoji: '✍️',
        hint: 'They might ink that too',
        outcomes: [
          { weight: 2, text: 'They get your signature tattooed as well. You are now a two-part artwork.', effects: { fans: 80, morale: 5 } },
          { weight: 1, text: 'Your pen slips. Now the potato has a moustache. They love it anyway.', effects: { fans: 50, morale: -3 } },
        ],
      },
      { label: 'Tell the truth', emoji: '😬', effects: { fans: -25, morale: 3 }, text: '“That looks nothing like me.” Correct. Also brutal.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Sponsors & money
  // ---------------------------------------------------------------------------
  {
    id: 'sponsor-appearance-day',
    title: 'Appearance Day',
    emoji: '🏬',
    text: 'A sponsor wants you to open its new furniture megastore on your only day off this month. There will be a ribbon. And giant scissors.',
    weight: 3,
    options: [
      { label: 'Cut that ribbon', emoji: '✂️', effects: { money: 60, morale: -6, teamRelation: 4 }, text: 'You assemble a wardrobe live on stage. It has three spare screws.' },
      {
        label: 'Send a cardboard cutout',
        emoji: '🧍',
        hint: 'Surely nobody will notice',
        outcomes: [
          { weight: 1, text: 'Everyone notices. The cutout still poses for 400 selfies.', effects: { money: 20, fans: 30, teamRelation: -6 } },
          { weight: 1, text: 'The sponsor finds it hilarious and pays you anyway.', effects: { money: 50, morale: 5 } },
        ],
      },
      { label: 'Rest instead', emoji: '😴', effects: { morale: 6, form: 1, teamRelation: -6 }, text: 'You nap for eleven hours. The commercial team sends a very polite, very angry email.' },
    ],
  },
  {
    id: 'sponsor-cheese-hat',
    title: 'Odd Sponsor Request',
    emoji: '🧀',
    text: 'Your cheese sponsor, Gouda Speed, wants you to wear a wedge-shaped hat on the podium. The contract says “reasonable promotional activity”.',
    weight: 2,
    options: [
      { label: 'Wear the cheese hat', emoji: '🧀', effects: { money: 80, fans: 40, reputation: -2 }, text: 'You look like a snack. Your bank balance looks healthier.' },
      {
        label: 'Negotiate a pin badge',
        emoji: '📎',
        outcomes: [
          { weight: 2, text: 'They settle for a tasteful cheese-shaped pin. A win for dignity.', effects: { money: 40, morale: 3 } },
          { weight: 1, text: 'Talks break down and they complain to the team. Nobody is grate-ful.', effects: { morale: -5, teamRelation: -3 } },
        ],
      },
      { label: 'Refuse', emoji: '🙅', effects: { teamRelation: -6, morale: 4 }, text: 'The team has to smooth things over with a very large cheese board.' },
    ],
  },
  {
    id: 'sponsor-voltra-stunt',
    title: 'Voltra Stunt',
    emoji: '⚡',
    text: 'Voltra Energy wants you to jump a go-kart over a swimming pool for an advert. “Totally safe,” says a man wearing sunglasses indoors.',
    weight: 1,
    options: [
      {
        label: 'Jump the pool',
        emoji: '🏊',
        hint: 'Big money, big splash',
        outcomes: [
          { weight: 3, text: 'Perfect landing. The advert goes global.', effects: { money: 200, fans: 120 } },
          { weight: 2, text: 'You land in the pool. The advert goes even more global.', effects: { money: 150, fans: 180, morale: -6 } },
          { weight: 1, text: 'You land badly and hurt your wrist. The team boss is not thrilled.', effects: { money: 150, injuryRaces: 1, teamRelation: -10 } },
        ],
      },
      { label: 'Use a stunt double', emoji: '🎭', effects: { money: 70, fans: 20 }, text: 'Someone in your helmet does the jump. Your mum can tell. Your mum can always tell.' },
      { label: 'Say no', emoji: '🙅', effects: { teamRelation: 6, morale: -3 }, text: 'The team is relieved. Voltra sends you a single, sad can.' },
    ],
  },
  {
    id: 'sponsor-pulls-out',
    title: 'Sponsor Walks',
    emoji: '💸',
    text: 'Your personal sponsor, Nimbus Air, is “re-evaluating its motorsport strategy”. That is corporate for “you have been dumped”.',
    weight: 2,
    when: { minRound: 3, after: ['noPoints', 'dnf', 'crash'] },
    options: [
      {
        label: 'Pitch a comeback deal',
        emoji: '📊',
        outcomes: [
          { weight: 1, text: 'They agree to a smaller deal if you score next time. Pressure is on.', effects: { money: 40, morale: -3 } },
          { weight: 2, text: 'They thank you for your time and block your number.', effects: { money: -50, morale: -8 } },
        ],
      },
      {
        label: 'Hunt for a new sponsor',
        emoji: '🔎',
        hint: 'Hustle mode',
        outcomes: [
          { weight: 2, text: 'A regional sock company signs you up. Socks are the future.', effects: { money: 30, morale: 4 } },
          { weight: 1, text: 'Nobody bites. You burn cash on travel with nothing to show for it.', effects: { money: -60, morale: -6 } },
        ],
      },
      { label: 'Shrug it off', emoji: '🤷', effects: { money: -100, morale: 4 }, text: 'Their loss. Your wallet disagrees, but your head is clear.' },
    ],
  },
  {
    id: 'sponsor-watch-deal',
    title: 'Luxury Watch Deal',
    emoji: '⌚',
    text: 'Horologia, a very posh watch brand, offers you a deal. The catch: the watch must be visible in every photo, including mid-spray on the podium.',
    weight: 1,
    when: { minReputation: 30 },
    options: [
      { label: 'Sign it', emoji: '✍️', effects: { money: 250, fans: 20, morale: -3 }, text: 'You check the time 400 times a day. Always on camera. Always 10:10.' },
      {
        label: 'Hold out for more',
        emoji: '💰',
        hint: 'Greedy? Or smart?',
        outcomes: [
          { weight: 2, text: 'They blink first. Bigger number, same watch.', effects: { money: 400 } },
          { weight: 1, text: 'They sign a tennis player instead. Your wrist feels naked.', effects: { morale: -6 } },
        ],
      },
      { label: 'Not my style', emoji: '🙅', effects: { morale: 4, reputation: 1 }, text: 'You keep your cheap digital watch. It has a calculator. Unbeatable.' },
    ],
  },
  {
    id: 'sponsor-too-good',
    title: 'Too Good To Be True',
    emoji: '🤑',
    text: 'QuantaCoin Deluxe offers $500k to put its logo on your helmet. Its website is one page and a spinning dollar sign.',
    weight: 1,
    options: [
      {
        label: 'Take the money',
        emoji: '💰',
        hint: 'What could possibly go wrong?',
        outcomes: [
          { weight: 1, text: 'It is legit! Somehow. The money clears and nobody asks questions.', effects: { money: 500 } },
          { weight: 2, text: 'They vanish after one payment. The headlines do not.', effects: { money: 100, reputation: -5, fans: -30 } },
        ],
      },
      { label: 'Politely decline', emoji: '🙅', effects: { reputation: 2 }, text: 'Two months later they are all over the news. You look very wise.' },
      { label: 'Ask your accountant', emoji: '🧮', effects: { money: -15, morale: 4 }, text: 'Your accountant laughs for forty seconds, then sends you an invoice.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Team politics
  // ---------------------------------------------------------------------------
  {
    id: 'team-engineer-standoff',
    title: 'Engineer Standoff',
    emoji: '🔩',
    text: 'Your race engineer wants a stiffer setup for the next race. Your gut says softer. You have been arguing about springs for 45 minutes.',
    weight: 3,
    options: [
      {
        label: 'Trust the engineer',
        emoji: '🧑‍🔧',
        outcomes: [
          { weight: 2, text: 'The data was right. You were wrong. The engineer is now insufferable.', effects: { teamRelation: 6, form: 1 } },
          { weight: 1, text: 'The car feels like a shopping trolley on gravel. At least you were polite.', effects: { teamRelation: 5, form: -2 } },
        ],
      },
      {
        label: 'Go with your gut',
        emoji: '🫀',
        hint: 'High risk, high reward',
        outcomes: [
          { weight: 1, text: 'Magic. The car dances through every corner. You were right!', effects: { form: 3, teamRelation: -4, morale: 6 } },
          { weight: 1, text: 'It is a disaster, and everyone knows it was your idea.', effects: { form: -2, teamRelation: -8 } },
        ],
      },
      { label: 'Split the difference', emoji: '⚖️', effects: { form: 1, teamRelation: 3, morale: -3 }, text: 'A compromise setup. Nobody is happy, which apparently means it is correct.' },
    ],
  },
  {
    id: 'team-boss-ultimatum',
    title: 'The Ultimatum',
    emoji: '⏳',
    text: 'The team boss calls you in. “Results, or we start looking at other drivers.” Then they slide a box of tissues across the desk. Rude.',
    weight: 2,
    when: { minRound: 4, after: ['noPoints', 'dnf', 'crash'], maxTeamRelation: 60 },
    options: [
      { label: 'Promise results', emoji: '🔥', effects: { morale: -5, form: 2 }, text: 'You leave fired up and slightly terrified. A good combo, apparently.' },
      { label: 'Blame the car', emoji: '🚗', effects: { teamRelation: -12, morale: 5 }, text: '“The car is a brick.” The boss disagrees. Loudly.' },
      {
        label: 'Ask for help',
        emoji: '🙏',
        hint: 'Vulnerability is a strategy',
        outcomes: [
          { weight: 2, text: 'The boss softens and books you extra sim time with the top engineer.', effects: { teamRelation: 6, form: 1 } },
          { weight: 1, text: '“Help? This is not a therapy session.” The tissues were a trap.', effects: { morale: -8 } },
        ],
      },
    ],
  },
  {
    id: 'team-sim-marathon',
    title: 'Simulator Marathon',
    emoji: '🖥️',
    text: 'The factory wants you in the simulator for 14 hours testing a new front wing. You are also meant to be at your cousin’s wedding.',
    weight: 2,
    options: [
      { label: 'Do the sim shift', emoji: '🖥️', effects: { teamRelation: 10, morale: -8, skills: { consistency: 1 } }, text: 'Your eyes are square. The engineers adore you. Your cousin does not.' },
      { label: 'Go to the wedding', emoji: '💒', effects: { morale: 10, teamRelation: -8 }, text: 'You dance until 2am. The reserve driver gets your sim time and your data.' },
      {
        label: 'Try to do both',
        emoji: '🏃',
        outcomes: [
          { weight: 1, text: 'You arrive just in time for cake, and the team has its data. Hero!', effects: { teamRelation: 6, morale: 6 } },
          { weight: 2, text: 'Late to both, rubbish at both. Everybody is a bit cross.', effects: { teamRelation: -4, morale: -6 } },
        ],
      },
    ],
  },
  {
    id: 'team-factory-tour',
    title: 'Factory Tour',
    emoji: '🏭',
    text: 'You spend a day meeting everyone at the {team} factory. All 400 of them. Remembering names is harder than a qualifying lap.',
    weight: 2,
    options: [
      { label: 'Learn every name', emoji: '🧠', effects: { teamRelation: 10, morale: -4 }, text: 'A hundred sticky notes later, the workshop adores you.' },
      { label: 'Buy everyone pastries', emoji: '🥐', effects: { teamRelation: 8, money: -30 }, text: '400 pastries. Your accountant weeps. The mechanics chant your name.' },
      { label: 'Speed-run it', emoji: '🏃', effects: { teamRelation: -5, morale: 3 }, text: 'You wave at everyone in eleven minutes. Record time. Nobody is impressed.' },
    ],
  },
  {
    id: 'team-experimental-part',
    title: 'Experimental Part',
    emoji: '🧪',
    text: 'The engineers have a radical new rear wing. It might be a rocket ship. It might fall off. They need a volunteer to run it at the next race.',
    weight: 2,
    options: [
      {
        label: 'Volunteer',
        emoji: '🙋',
        hint: 'Guinea pig or genius?',
        outcomes: [
          { weight: 2, text: 'It works! You are a tenth quicker and the engineers owe you one.', effects: { form: 3, teamRelation: 8 } },
          { weight: 1, text: 'It flaps like a pigeon on the straight. The data is useful, at least.', effects: { form: -3, teamRelation: 4, morale: -4 } },
        ],
      },
      { label: 'Let someone else', emoji: '🙅', effects: { teamRelation: -3, morale: 3 }, text: 'Safety first. The engineers mutter “boring” under their breath.' },
    ],
  },
  {
    id: 'team-boss-dinner',
    title: 'Dinner With The Boss',
    emoji: '🍷',
    text: 'The team boss invites you to dinner at a very fancy restaurant. The menu has no prices, which is how you know it is serious.',
    weight: 2,
    when: { minRound: 3 },
    options: [
      {
        label: 'Talk future plans',
        emoji: '🗓️',
        outcomes: [
          { weight: 2, text: 'They hint at a longer deal. Dessert tastes of victory.', effects: { teamRelation: 8, morale: 6 } },
          { weight: 1, text: 'They talk about “keeping options open”. So will you, then.', effects: { teamRelation: -3, morale: -5 } },
        ],
      },
      { label: 'Just enjoy the food', emoji: '🍝', effects: { teamRelation: 3, morale: 5, money: -20 }, text: 'You insist on paying your half. The bill has a comma in it.' },
      {
        label: 'Ask for a pay rise',
        emoji: '💰',
        hint: 'Bold, mid-risotto',
        outcomes: [
          { weight: 1, text: 'They agree to a bonus! Bold works.', effects: { money: 150, teamRelation: -3 } },
          { weight: 2, text: 'They laugh, then realise you were serious. A very awkward pudding.', effects: { teamRelation: -8, morale: -4 } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Training & fitness
  // ---------------------------------------------------------------------------
  {
    id: 'training-neck-day',
    title: 'Neck Day',
    emoji: '🏋️',
    text: 'Your trainer has built a neck harness out of bungee cords and a bucket of sand. They want 300 reps before breakfast.',
    weight: 3,
    options: [
      { label: 'Do all 300', emoji: '💪', effects: { form: 2, morale: -5 }, text: 'Your neck is now wider than your head. G-forces fear you.' },
      { label: 'Do 150, then nap', emoji: '😴', effects: { form: 1, morale: 4 }, text: 'A balanced approach. Your trainer calls it “adequate”. Ouch.' },
      {
        label: 'Invent an excuse',
        emoji: '🙃',
        hint: 'They have heard them all',
        outcomes: [
          { weight: 1, text: '“The dog ate my harness.” Somehow, it works.', effects: { morale: 6 } },
          { weight: 2, text: 'Your trainer doubles it to 600. Negotiations failed.', effects: { morale: -8, form: 1 } },
        ],
      },
    ],
  },
  {
    id: 'training-sim-league',
    title: 'Online Sim League',
    emoji: '🕹️',
    text: 'You are invited into a pro sim-racing league against teenagers who have never sat in a real car. They are terrifyingly fast.',
    weight: 2,
    options: [
      {
        label: 'Take it seriously',
        emoji: '🎯',
        hint: 'Humbling, but useful',
        effects: { skills: { racecraft: 1 }, morale: -5 },
        text: 'You get lapped by a 14-year-old called LapGoblin. You learn a lot.',
      },
      { label: 'Stream it for fun', emoji: '🎮', effects: { fans: 50, morale: 4, teamRelation: -3 }, text: 'You crash constantly and the chat loves it. The team asks you to maybe stop.' },
      { label: 'Stick to reality', emoji: '🌍', effects: { form: 1 }, text: 'You spend the evening on real onboard footage instead. Sensible. Dull.' },
    ],
  },
  {
    id: 'training-ice-bath',
    title: 'Ice Bath Challenge',
    emoji: '🧊',
    text: 'Your trainer says ice baths “build mental steel”. The thermometer says 2°C. Every cell in your body says absolutely not.',
    weight: 2,
    options: [
      {
        label: 'Plunge in',
        emoji: '🥶',
        outcomes: [
          { weight: 2, text: 'Three minutes of pure suffering. You emerge feeling invincible.', effects: { morale: 8, form: 1 } },
          { weight: 1, text: 'Your scream trends online. A dog in the next town joins in.', effects: { morale: -5, fans: 20 } },
        ],
      },
      { label: 'Warm bath instead', emoji: '🛁', effects: { morale: 6 }, text: 'Bubbles. Candles. Mental steel can wait until next week.' },
      { label: 'Film it for socials', emoji: '📱', effects: { fans: 40, morale: -4 }, text: 'You pretend it is lovely for forty seconds. An award-worthy performance.' },
    ],
  },
  {
    id: 'training-mental-coach',
    title: 'Mental Coach',
    emoji: '🧘',
    text: 'A performance psychologist wants to work with you. Their first exercise: describe your feelings about the first corner using only colours.',
    weight: 2,
    options: [
      {
        label: 'Commit to it',
        emoji: '🎨',
        hint: 'Slow burn, long game',
        effects: { growth: 1, morale: 5, money: -60 },
        text: 'The first corner is “angry orange”. Weirdly, you already feel calmer.',
      },
      {
        label: 'Try one session',
        emoji: '🙂',
        outcomes: [
          { weight: 1, text: 'It clicks. You sleep better than you have in years.', effects: { morale: 8, form: 1 } },
          { weight: 1, text: 'You describe every corner as “beige”. Nothing clicks.', effects: { morale: -3, money: -10 } },
        ],
      },
      { label: 'Not for me', emoji: '🙅', effects: { morale: -3, form: 1 }, text: 'You stick with your usual method: shouting into a pillow, then doing laps.' },
    ],
  },
  {
    id: 'training-karting-kids',
    title: 'Karting With Kids',
    emoji: '🏎️',
    text: 'You visit a local karting club to meet young drivers. An 11-year-old challenges you to a race and says you look “slow and old”.',
    weight: 2,
    options: [
      {
        label: 'Race at full speed',
        emoji: '🔥',
        outcomes: [
          { weight: 2, text: 'You win by a whisker. The kid demands a rematch. Respect.', effects: { fans: 40, morale: 5 } },
          { weight: 1, text: 'The kid wins. The video goes viral. You will never recover.', effects: { fans: 90, morale: -10 } },
        ],
      },
      { label: 'Let them win', emoji: '🎁', effects: { fans: 50, morale: -3 }, text: 'You lose convincingly. The kid is thrilled. Your ego is bruised.' },
      { label: 'Coach them instead', emoji: '🧑‍🏫', effects: { fans: 30, reputation: 2, morale: 4 }, text: 'You teach them the racing line. They immediately use it to pass you.' },
    ],
  },
  {
    id: 'training-altitude-camp',
    title: 'Altitude Camp',
    emoji: '🏔️',
    text: 'Your trainer suggests two weeks at a mountain training camp. No wifi, no takeaways, and a goat that seems to be following you.',
    weight: 1,
    options: [
      {
        label: 'Head for the mountain',
        emoji: '🐐',
        hint: 'Suffer now, fly later',
        effects: { skills: { pace: 1 }, morale: -6, money: -50 },
        text: 'You come back fitter, faster and with a goat-shaped hole in your heart.',
      },
      { label: 'Train at home', emoji: '🏠', effects: { form: 1, morale: 3 }, text: 'You jog round the block and call it “urban altitude”.' },
    ],
  },
  {
    id: 'training-rain-test',
    title: 'Rain Test Day',
    emoji: '🌧️',
    text: 'The team offers a test day on a soaked circuit. Everyone else found an excuse. It is freezing and the coffee machine is broken.',
    weight: 1,
    options: [
      { label: 'Do the whole day', emoji: '🌊', effects: { skills: { wet: 2 }, morale: -6 }, text: 'Aquaplane, spin, learn, repeat. The rain is now your friend.' },
      { label: 'Half a day, then tea', emoji: '☕', effects: { skills: { wet: 1 }, morale: -3 }, text: 'You learn a lot before lunch and nothing after it. Fair trade.' },
      { label: 'Skip it', emoji: '🙅', effects: { teamRelation: -5, morale: 4 }, text: 'You stay warm and dry. The team notices who turned up.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Personal life
  // ---------------------------------------------------------------------------
  {
    id: 'life-birthday',
    title: 'Birthday Bash',
    emoji: '🎂',
    text: 'You turn {age} this week! Your friends have “secretly” booked a party two nights before the next race. The group chat has 312 unread messages.',
    weight: 2,
    options: [
      {
        label: 'Party hard',
        emoji: '🥳',
        outcomes: [
          { weight: 2, text: 'Best night ever. Cake, dancing, a conga line. Worth it.', effects: { morale: 12, form: -1 } },
          { weight: 1, text: 'Someone posts a photo of you asleep face-first in the cake.', effects: { morale: 6, fans: 30, teamRelation: -4 } },
        ],
      },
      { label: 'Cake and early night', emoji: '🍰', effects: { morale: 5 }, text: 'One slice, one candle, one early night. Your trainer is so proud.' },
      { label: 'Skip it, focus', emoji: '🎯', effects: { form: 1, morale: -6 }, text: 'You spend your birthday watching onboard footage. Happy birthday to you.' },
    ],
  },
  {
    id: 'life-holiday',
    title: 'Holiday Temptation',
    emoji: '🏝️',
    text: 'There is a gap in the calendar. Your friends are off to a tropical island. Your trainer has sent a 40-page fitness plan. With diagrams.',
    weight: 2,
    options: [
      { label: 'Go on holiday', emoji: '🏝️', effects: { morale: 15, form: -2, money: -80 }, text: 'Sun, sea and snorkelling. You come back tanned and slightly slow.' },
      { label: 'Stick to the plan', emoji: '📋', effects: { form: 2, morale: -6 }, text: 'You do 400 squats a day while your friends send beach photos.' },
      {
        label: 'Beach and gym combo',
        emoji: '🏖️',
        hint: 'Willpower required',
        outcomes: [
          { weight: 1, text: 'You find the perfect balance: a gym with a sea view.', effects: { morale: 8, form: 1, money: -80 } },
          { weight: 2, text: 'You walk past the hotel gym every day. You never go in.', effects: { morale: 10, form: -1, money: -80 } },
        ],
      },
    ],
  },
  {
    id: 'life-celebrity-invite',
    title: 'Celebrity Invite',
    emoji: '⭐',
    text: 'A chart-topping pop star invites you to a yacht party. The dress code is “nautical glamour”. You own one hoodie and it has a hole in it.',
    weight: 1,
    when: { minFans: 100 },
    options: [
      {
        label: 'Go to the party',
        emoji: '🛥️',
        outcomes: [
          { weight: 2, text: 'You are photographed laughing with a pop icon. Instant fame boost.', effects: { fans: 150, morale: 8 } },
          { weight: 1, text: 'You get seasick and spend the evening at the railing. Unglamorous.', effects: { morale: -8, fans: 20 } },
        ],
      },
      { label: 'Stay home', emoji: '🏠', effects: { morale: -3, form: 1 }, text: 'You watch the party on social media while eating cereal. Discipline!' },
      {
        label: 'Bring the mechanics',
        emoji: '🔧',
        hint: 'Plus-twelve?',
        effects: { teamRelation: 10, fans: 40, money: -40 },
        text: 'The pop star meets your pit crew. Karaoke happens. Bonds are formed.',
      },
    ],
  },
  {
    id: 'life-tax-haven',
    title: 'Tax Haven Move',
    emoji: '🏙️',
    text: 'Your accountant suggests moving to a tiny, sunny, low-tax principality. The flats are small, the rent is huge, and the neighbours own submarines.',
    weight: 1,
    when: { minAge: 20, minReputation: 30, once: true },
    options: [
      { label: 'Move there', emoji: '🛳️', effects: { money: 300, fans: -40, morale: -4 }, text: 'Your wallet is thrilled. The {nation} press calls you a sellout.' },
      { label: 'Stay home', emoji: '🏡', effects: { fans: 30, morale: 5 }, text: 'You stay near family and your favourite bakery. Priceless. Literally.' },
    ],
  },
  {
    id: 'life-flashy-car',
    title: 'Flashy Supercar',
    emoji: '🚗',
    text: 'A dealer offers you a lime-green supercar at a “driver discount”. It has scissor doors and a horn that plays a little song.',
    weight: 2,
    when: { minAge: 18 },
    options: [
      { label: 'Buy it', emoji: '💸', effects: { money: -300, fans: 50, morale: 10 }, text: 'You look like a smoothie on wheels. You love it.' },
      {
        label: 'Test drive only',
        emoji: '🔑',
        outcomes: [
          { weight: 2, text: 'A free joyride, then you hand back the keys. The salesperson weeps.', effects: { morale: 5 } },
          { weight: 1, text: 'You get a speeding ticket in a car you do not own. Headlines.', effects: { money: -20, reputation: -2, fans: 30 } },
        ],
      },
      { label: 'Keep your old banger', emoji: '🛻', effects: { morale: -3, fans: 15 }, text: 'Your rusty runabout becomes a cult icon. “Humble legend,” says the internet.' },
    ],
  },
  {
    id: 'life-charity-gala',
    title: 'Charity Gala',
    emoji: '🎗️',
    text: 'You are invited to a charity gala for a children’s hospital. The auction includes your old race helmet and, for some reason, a pony.',
    weight: 2,
    options: [
      { label: 'Donate big', emoji: '💝', effects: { money: -200, reputation: 4, fans: 60 }, text: 'You win the pony and gift it to the hospital. Everybody cries. The pony is thrilled.' },
      { label: 'Visit the wards', emoji: '🏥', effects: { reputation: 3, morale: 8, fans: 20, form: -1 }, text: 'A long day of signing casts and racing wheelchairs. Best day of the year.' },
      { label: 'Send a signed cap', emoji: '🧢', effects: { fans: -10 }, text: 'The cap raises forty dollars. The internet notices you were “busy”.' },
    ],
  },
  {
    id: 'life-home-pressure',
    title: 'Home Crowd Pressure',
    emoji: '🏟️',
    text: 'The {nation} press has declared you a national hero. Your face is on a cereal box, and the home crowd now expects a win every single time.',
    weight: 2,
    when: { minFans: 60 },
    options: [
      {
        label: 'Embrace the hype',
        emoji: '📣',
        outcomes: [
          { weight: 2, text: 'The whole country is behind you. You feel ten feet tall.', effects: { form: 2, fans: 80, morale: 6 } },
          { weight: 1, text: 'The pressure squeezes you like a juice box.', effects: { form: -2, morale: -6, fans: 40 } },
        ],
      },
      { label: 'Play it down', emoji: '🤫', effects: { morale: 4, fans: -10 }, text: '“Just another race.” The papers call you modest. Some call you boring.' },
      { label: 'Do a media tour', emoji: '🗞️', effects: { fans: 120, form: -1, morale: -4 }, text: 'Every talk show in the country. You are exhausted and very famous.' },
    ],
  },
  {
    id: 'life-paddock-pet',
    title: 'Paddock Puppy',
    emoji: '🐶',
    text: 'You want to adopt a dog. The team says pets are banned from the paddock. There is, however, a loophole labelled “emotional support”.',
    weight: 1,
    when: { minAge: 18, once: true },
    options: [
      { label: 'Adopt the dog', emoji: '🐕', effects: { morale: 12, fans: 60, money: -20, teamRelation: -3 }, text: 'Meet Turbo. Turbo has a lanyard, a fan page and zero respect for tyre blankets.' },
      { label: 'Get a goldfish', emoji: '🐟', effects: { morale: 4 }, text: 'You name it Pole Position. It mostly stays in pole position.' },
      { label: 'Not while racing', emoji: '🙅', effects: { morale: -4, form: 1 }, text: 'Too busy for a pet. Your lock screen is a puppy. It helps, a bit.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // After results
  // ---------------------------------------------------------------------------
  {
    id: 'result-win-party',
    title: 'How To Celebrate?',
    emoji: '🍾',
    text: 'You won at {track}! The team is heading out to celebrate. Your trainer says bed by ten. Your mechanics say bed is for losers.',
    weight: 4,
    when: { after: ['win'] },
    options: [
      { label: 'Party with the crew', emoji: '🎉', effects: { teamRelation: 10, morale: 8, form: -1 }, text: 'You dance on a table with the tyre crew. Legend status: confirmed.' },
      { label: 'Quiet dinner', emoji: '🍽️', effects: { morale: 5, form: 1 }, text: 'A nice meal and a long sleep. Responsible. Wise. Slightly dull.' },
      {
        label: 'Crowd-surf the fans',
        emoji: '🙌',
        hint: 'Trust falls, but bigger',
        outcomes: [
          { weight: 2, text: 'The fans carry you across the whole grandstand. Unforgettable.', effects: { fans: 120, morale: 8 } },
          { weight: 1, text: 'The crowd parts like the sea. You land on a tuba.', effects: { fans: 70, morale: -5 } },
        ],
      },
    ],
  },
  {
    id: 'result-podium-fizz',
    title: 'Fizz Etiquette',
    emoji: '🥂',
    text: 'Podium at {track}! You are holding a giant bottle of fizz next to a very important guest in a very expensive suit. Nobody told you the etiquette.',
    weight: 3,
    when: { after: ['win', 'podium'] },
    options: [
      { label: 'Spray everyone', emoji: '🍾', effects: { fans: 40, morale: 5, reputation: -1 }, text: 'Including the guest. They laugh. Their dry cleaner does not.' },
      {
        label: 'Drink from your shoe',
        emoji: '👟',
        hint: 'Gross. Iconic.',
        outcomes: [
          { weight: 2, text: 'The crowd goes wild. You taste feet and glory.', effects: { fans: 100, reputation: -1 } },
          { weight: 1, text: 'You gag live on TV. The replay has slow motion.', effects: { fans: 60, morale: -5 } },
        ],
      },
      { label: 'Hand it to the crew', emoji: '🧑‍🔧', effects: { teamRelation: 8, fans: 15 }, text: 'You pass the bottle to your mechanics. They immediately spray you.' },
    ],
  },
  {
    id: 'result-dnf-cope',
    title: 'Picking Up The Pieces',
    emoji: '💔',
    text: 'Your race at {track} ended early. You are sitting in the motorhome, still in your overalls, staring at a wall. The wall stares back.',
    weight: 3,
    when: { after: ['dnf', 'crash'] },
    options: [
      {
        label: 'Watch the replay',
        emoji: '📺',
        hint: 'Painful, but educational',
        effects: { morale: -6, skills: { consistency: 1 } },
        text: 'You watch it forty times. It hurts. But now you see exactly what went wrong.',
      },
      { label: 'Go for a long run', emoji: '🏃', effects: { morale: 6, form: 1 }, text: 'Ten kilometres of angry jogging. By the end, you feel human again.' },
      {
        label: 'Vent to the mechanics',
        emoji: '🗯️',
        outcomes: [
          { weight: 1, text: 'They vent too. Pizza is ordered. The garage becomes a support group.', effects: { teamRelation: 8, morale: 6 } },
          { weight: 1, text: 'They are the ones rebuilding the car tonight. Read the room.', effects: { teamRelation: -6, morale: -3 } },
        ],
      },
    ],
  },
  {
    id: 'result-repair-bill',
    title: 'The Repair Bill',
    emoji: '🧾',
    text: 'The team has sent you a very polite email with a spreadsheet attached. The cost of your crash at {track} is highlighted in red. Big red.',
    weight: 3,
    when: { after: ['crash'] },
    options: [
      { label: 'Apologise to the crew', emoji: '🙇', effects: { teamRelation: 8, morale: -5 }, text: 'You bring doughnuts to the all-night rebuild. Forgiveness is sugar-coated.' },
      { label: 'Chip in for repairs', emoji: '💸', effects: { money: -150, teamRelation: 12 }, text: 'Unusual, generous, and never forgotten by the finance department.' },
      { label: 'Blame the track', emoji: '🧱', effects: { teamRelation: -8, morale: 4 }, text: '“The wall came out of nowhere.” The engineers roll their eyes in sync.' },
    ],
  },
  {
    id: 'result-points-drought',
    title: 'Points Drought',
    emoji: '🏜️',
    text: 'Another race without points. The team spreadsheet has switched to a font called “Concern”. Journalists are sharpening their pencils.',
    weight: 3,
    when: { after: ['noPoints', 'dnf'], minRound: 4 },
    options: [
      {
        label: 'Change everything',
        emoji: '🔄',
        hint: 'New setup, new routine',
        outcomes: [
          { weight: 1, text: 'New setup, new routine, new haircut. It clicks!', effects: { form: 3, morale: 6 } },
          { weight: 2, text: 'Too many changes at once. You feel lost in your own car.', effects: { form: -2, morale: -6 } },
        ],
      },
      { label: 'Trust the process', emoji: '🧘', effects: { morale: 4, form: 1, teamRelation: -3 }, text: 'Keep calm and race on. The team wishes you would panic a little.' },
      {
        label: 'Find a lucky charm',
        emoji: '🍀',
        hint: 'Science says no. Vibes say yes.',
        outcomes: [
          { weight: 1, text: 'Your lucky socks resurface. You feel unstoppable.', effects: { morale: 10, form: 1 } },
          { weight: 1, text: 'You lose the lucky socks in the hotel laundry. Doom.', effects: { morale: -8 } },
        ],
      },
    ],
  },
  {
    id: 'result-podium-buzz',
    title: 'Podium Buzz',
    emoji: '📲',
    text: 'A podium at {track}! Your phone has 400 notifications, your mum is crying on speakerphone, and a sponsor wants a video message by tonight.',
    weight: 3,
    when: { after: ['podium'] },
    options: [
      { label: 'Record the video', emoji: '🎥', effects: { money: 50, fans: 20, morale: -3 }, text: 'Take seventeen is the one. You sound thrilled and only slightly sleepy.' },
      { label: 'Go live with fans', emoji: '📱', effects: { fans: 70, teamRelation: -3 }, text: 'You chat to fans for an hour. The sponsor is still waiting for its video.' },
      { label: 'Switch off your phone', emoji: '📵', effects: { morale: 8, form: 1, fans: -10 }, text: 'You savour it quietly. The notifications can wait until breakfast.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Family background
  // ---------------------------------------------------------------------------
  {
    id: 'family-dynasty-meddling',
    title: 'Famous Parent Visits',
    emoji: '👑',
    text: 'Your famous racing parent has turned up in the garage and is giving the engineers “advice”. Everyone is nodding politely. Nobody is taking notes.',
    weight: 3,
    when: { family: ['dynasty'] },
    options: [
      { label: 'Ask them to leave', emoji: '🚪', effects: { teamRelation: 8, morale: -8 }, text: 'A tense chat by the motorhome. The engineers want to hug you.' },
      { label: 'Let them stay', emoji: '🤷', effects: { teamRelation: -8, fans: 30 }, text: 'The cameras love it. Your engineers are quietly updating their CVs.' },
      {
        label: 'Ask for real advice',
        emoji: '🎓',
        hint: 'They did win an awful lot',
        outcomes: [
          { weight: 2, text: 'One tip about braking later into the hairpin. Pure gold.', effects: { form: 2, morale: 5 } },
          { weight: 1, text: 'Forty minutes on how everything was “harder in their day”.', effects: { morale: -6 } },
        ],
      },
    ],
  },
  {
    id: 'family-dynasty-shadow',
    title: 'In Their Shadow',
    emoji: '🌑',
    text: 'A new documentary celebrates your famous parent’s career. It compares every one of your laps to theirs. You look like a caravan in comparison.',
    weight: 2,
    when: { family: ['dynasty'] },
    options: [
      { label: 'Watch it anyway', emoji: '📺', effects: { morale: -8, form: 2 }, text: 'It stings. But now you are hungrier than ever.' },
      { label: 'Joke about it', emoji: '😂', effects: { fans: 60, morale: 3 }, text: '“At least I got the good hair.” The internet decides you are funny.' },
      { label: 'Refuse to comment', emoji: '🤐', effects: { reputation: 2, morale: -4 }, text: '“I race for me.” A dignified answer. It still hurts, though.' },
    ],
  },
  {
    id: 'family-bought-seat',
    title: 'Bought Your Seat?',
    emoji: '💰',
    text: 'A journalist writes that you only drive for {team} because your family “bought the seat”. Your parents have already phoned the editor. Twice.',
    weight: 3,
    when: { family: ['wealthy'] },
    options: [
      { label: 'Let results talk', emoji: '🏁', effects: { form: 1, morale: -4 }, text: 'You say nothing and drive like fury.' },
      {
        label: 'Address it head-on',
        emoji: '🎙️',
        outcomes: [
          { weight: 2, text: 'A calm, honest interview wins people over. Respect earned.', effects: { reputation: 4, fans: 40 } },
          { weight: 1, text: 'You get defensive and say “we only paid a bit”. Oops.', effects: { reputation: -4, fans: 30 } },
        ],
      },
      {
        label: 'Fund a scholarship',
        emoji: '🎓',
        hint: 'Money where your mouth is',
        effects: { money: -250, reputation: 5, fans: 40 },
        text: 'You fund karting for kids without the cash. The critics go very quiet.',
      },
    ],
  },
  {
    id: 'family-funding-gap',
    title: 'Funding Gap',
    emoji: '🪙',
    text: 'Your family has sold the car to pay for your season. Everyone is cycling to work now. There is still a hole in the budget.',
    weight: 3,
    when: { family: ['poor', 'working'] },
    options: [
      { label: 'Take out a loan', emoji: '🏦', effects: { money: 200, morale: -8 }, text: 'The bank manager gives you a look that says “please win”.' },
      {
        label: 'Start a crowdfund',
        emoji: '🙏',
        hint: 'Fans to the rescue?',
        outcomes: [
          { weight: 2, text: 'Fans chip in! A retired baker pledges a lifetime supply of bread.', effects: { money: 150, fans: 50, morale: 6 } },
          { weight: 1, text: 'It raises a little cash and a lot of “good luck!” comments.', effects: { money: 10, morale: -6 } },
        ],
      },
      { label: 'Deliver pizzas', emoji: '🍕', effects: { money: 60, morale: -4, form: -1 }, text: 'You deliver pizzas between sim sessions. Your cornering on a moped is superb.' },
    ],
  },
  {
    id: 'family-night-shift',
    title: 'Night Shift',
    emoji: '🌙',
    text: 'To pay for tyres, you have been working night shifts at a warehouse. Your manager offers you a promotion. It means even more hours.',
    weight: 2,
    when: { family: ['working', 'poor'], maxAge: 24 },
    options: [
      { label: 'Take the promotion', emoji: '📦', effects: { money: 120, morale: -6, form: -2 }, text: 'More money, less sleep. You now yawn inside your helmet.' },
      { label: 'Quit the job', emoji: '👋', effects: { money: -40, form: 2, morale: 4 }, text: 'All-in on racing. Your savings start to look nervous.' },
      { label: 'Keep it steady', emoji: '⚖️', effects: { money: 40, morale: -3 }, text: 'Same shifts, same tyres. The grind continues.' },
    ],
  },
  {
    id: 'family-remortgage',
    title: 'Family Sacrifice',
    emoji: '🏠',
    text: 'Your family offers to remortgage the house to fund your next season. They insist it is fine. The dog looks worried.',
    weight: 1,
    when: { family: ['poor', 'working', 'comfortable'], once: true },
    options: [
      { label: 'Accept the help', emoji: '🤝', effects: { money: 300, morale: -8 }, text: 'The pressure is on. Every lap now has a mortgage attached.' },
      { label: 'Ask for half', emoji: '⚖️', effects: { money: 150, morale: -3 }, text: 'A compromise. The dog relaxes slightly.' },
      { label: 'Refuse', emoji: '🙅', effects: { morale: 8, teamRelation: -4 }, text: 'You will find another way. The team was quietly hoping for that cheque.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Personality
  // ---------------------------------------------------------------------------
  {
    id: 'hothead-road-rage',
    title: 'Road Rage',
    emoji: '🤬',
    text: 'Someone cuts you up on the motorway on the way to the airport. Your hands grip the wheel. Your inner racing driver wakes up.',
    weight: 3,
    when: { personality: ['hothead'], minAge: 18 },
    options: [
      { label: 'Let it go', emoji: '😮‍💨', effects: { morale: -4, aggression: -3 }, text: 'You breathe out slowly. Your mental coach would be so proud.' },
      {
        label: 'Chase them down',
        emoji: '🚗',
        hint: 'Terrible idea',
        outcomes: [
          { weight: 1, text: 'You overtake with a smug wave. It was a learner driver. You feel awful.', effects: { morale: -5, aggression: 5 } },
          { weight: 2, text: 'A fan films the whole thing. The headlines are not kind.', effects: { reputation: -4, fans: 40, aggression: 5 } },
        ],
      },
      { label: 'One firm honk', emoji: '📯', effects: { aggression: 3, morale: 4 }, text: 'A single, powerful honk. Justice served. Blood pressure: moderate.' },
    ],
  },
  {
    id: 'hothead-radio-rant',
    title: 'Radio Rant',
    emoji: '📻',
    text: 'Your furious radio message from {track} was broadcast live. It had so many bleeps it sounded like a microwave.',
    weight: 3,
    when: { personality: ['hothead'], after: ['noPoints', 'dnf', 'crash'] },
    options: [
      { label: 'Apologise publicly', emoji: '🙇', effects: { reputation: 2, fans: -10, teamRelation: 5 }, text: 'A sincere apology. The microwave remix still gets played at parties.' },
      { label: 'Stand by it', emoji: '😤', effects: { fans: 80, teamRelation: -8, aggression: 4 }, text: '“I meant every bleep.” The fans turn it into a T-shirt.' },
      {
        label: 'Turn it into a song',
        emoji: '🎵',
        outcomes: [
          { weight: 1, text: 'The “Bleep Anthem” becomes a paddock hit. Even the team laughs.', effects: { fans: 120, morale: 6 } },
          { weight: 2, text: 'The song is bad. Really bad. Your sponsors pretend not to know you.', effects: { fans: 30, money: -30, morale: -4 } },
        ],
      },
    ],
  },
  {
    id: 'party-nightclub',
    title: 'Nightclub Calling',
    emoji: '🪩',
    text: 'A superstar DJ invites you to a secret club night two days before the next race. Your trainer has hidden your shoes. You have spare shoes.',
    weight: 3,
    when: { personality: ['partyAnimal'], minAge: 18 },
    options: [
      {
        label: 'Go out',
        emoji: '🕺',
        outcomes: [
          { weight: 2, text: 'Epic night. You dance until dawn and somehow feel brilliant.', effects: { morale: 12, fans: 40 } },
          { weight: 1, text: 'Photos leak of you asleep on a bean bag at 6am. The team is not amused.', effects: { morale: 6, teamRelation: -10, form: -2 } },
        ],
      },
      { label: 'Stay in', emoji: '🛌', effects: { morale: -6, form: 2 }, text: 'You watch everyone’s stories from bed. It physically hurts.' },
      { label: 'Go, home by midnight', emoji: '⏰', effects: { morale: 7 }, text: 'A responsible party animal. Somewhere, a pig takes flight.' },
    ],
  },
  {
    id: 'showman-stunt',
    title: 'Crowd Pleaser',
    emoji: '🎪',
    text: 'The organisers of the next race want a “show” for the fans. You have an idea involving a trampoline, fireworks and a slow-motion camera.',
    weight: 3,
    when: { personality: ['showman'] },
    options: [
      {
        label: 'Go full show',
        emoji: '🎆',
        outcomes: [
          { weight: 2, text: 'Fireworks, backflip, standing ovation. Legendary.', effects: { fans: 150, morale: 8 } },
          { weight: 1, text: 'The trampoline launches you into a hedge. The fans still cheer.', effects: { fans: 80, morale: -5, teamRelation: -5 } },
        ],
      },
      { label: 'Selfies and waves', emoji: '🤳', effects: { fans: 40, morale: 3 }, text: 'Two hours of selfies. Sore wrist, full heart.' },
      { label: 'Save it for the race', emoji: '🔋', effects: { form: 1, fans: -10 }, text: 'The fans are disappointed. The stopwatch will not be.' },
    ],
  },
  {
    id: 'bigego-number-one',
    title: 'Number One Status',
    emoji: '🥇',
    text: 'You have decided you deserve official No.1 status over {teammate}. You have written a list of demands. It is laminated.',
    weight: 3,
    when: { personality: ['bigEgo'], needsTeammate: true, minRound: 2 },
    options: [
      {
        label: 'Demand it',
        emoji: '📜',
        hint: 'Fortune favours the loud',
        outcomes: [
          { weight: 1, text: 'The boss agrees! You are No.1. {teammate} is absolutely fuming.', effects: { teamRelation: -3, teammateRelation: -15, morale: 10, form: 1 } },
          { weight: 2, text: 'The boss says no, then pins your list on the fridge for everyone to read.', effects: { teamRelation: -10, morale: -8 } },
        ],
      },
      { label: 'Hint at it in the press', emoji: '🗞️', effects: { fans: 40, teammateRelation: -10, teamRelation: -5 }, text: '“I am clearly the team leader.” A spicy quote. The garage gets chilly.' },
      { label: 'Earn it on track', emoji: '🏁', effects: { morale: -3, form: 1, teammateRelation: 5 }, text: 'You bin the laminated list. It hurts your ego more than you will admit.' },
    ],
  },
  {
    id: 'golden-cover-star',
    title: 'Cover Star',
    emoji: '📸',
    text: 'A glossy magazine wants you on its cover as “The Future of Racing”. The shoot is the day before the next race. There will be a wind machine.',
    weight: 3,
    when: { personality: ['golden'] },
    options: [
      { label: 'Do the shoot', emoji: '🌟', effects: { fans: 120, reputation: 3, form: -1 }, text: 'Wind machine, dramatic lighting, a leather jacket. You look incredible.' },
      {
        label: 'Ask to reschedule',
        emoji: '📅',
        outcomes: [
          { weight: 2, text: 'They move the date. Everybody wins.', effects: { fans: 60, morale: 4 } },
          { weight: 1, text: 'They put a tennis player on the cover instead. Ouch.', effects: { morale: -6 } },
        ],
      },
      { label: 'Decline the hype', emoji: '🙅', effects: { reputation: 1, form: 1, fans: -10 }, text: '“I have not won anything yet.” Humble. The hype train is lightly derailed.' },
    ],
  },
  {
    id: 'grafter-factory-hours',
    title: 'Extra Factory Hours',
    emoji: '🧰',
    text: 'You have been at the factory so long that security thinks you live there. The mechanics ask if you want to help rebuild a gearbox.',
    weight: 3,
    when: { personality: ['grafter'] },
    options: [
      {
        label: 'Roll up your sleeves',
        emoji: '🔧',
        effects: { teamRelation: 10, morale: -4, skills: { pace: 1 } },
        text: 'Scraped knuckles, rebuilt gearbox. You understand the car better than ever.',
      },
      { label: 'Go home for once', emoji: '🛋️', effects: { morale: 8, teamRelation: -3 }, text: 'You rediscover your sofa. It missed you.' },
      {
        label: 'Pull an all-nighter',
        emoji: '🌙',
        hint: 'Grafters gonna graft',
        outcomes: [
          { weight: 1, text: 'You find a tiny flaw in the gearbox. The engineers call you a genius.', effects: { teamRelation: 12, form: 1 } },
          { weight: 1, text: 'You fall asleep in the parts store and wake up covered in labels.', effects: { morale: -5, form: -1, teamRelation: 4 } },
        ],
      },
    ],
  },
  {
    id: 'icecold-boring',
    title: 'Too Boring?',
    emoji: '😐',
    text: 'A pundit calls you “the human spreadsheet”. Your media team begs you to show some personality in your next interview. Any personality.',
    weight: 3,
    when: { personality: ['iceCold'] },
    options: [
      {
        label: 'Show some personality',
        emoji: '🤪',
        outcomes: [
          { weight: 1, text: 'You tell a joke. It lands! The internet discovers you are funny.', effects: { fans: 90, morale: 5 } },
          { weight: 2, text: 'You try a joke. Silence. A tumbleweed rolls across the press room.', effects: { fans: 10, morale: -6 } },
        ],
      },
      { label: 'Stay ice cold', emoji: '🧊', effects: { reputation: 2, form: 1, fans: -10 }, text: '“I am here to race, not to entertain.” Efficient. Cold. Classic.' },
      { label: 'Embrace the nickname', emoji: '📊', effects: { fans: 50, reputation: -1 }, text: 'You wear a pie-chart T-shirt to every interview. Cult hit. Pundits roll their eyes.' },
    ],
  },
  {
    id: 'mercenary-tapped-up',
    title: 'Tapped Up',
    emoji: '📞',
    text: 'A rival team calls your agent with a big offer for next season. The only catch: they want an answer before {team} finds out.',
    weight: 3,
    when: { personality: ['mercenary'], minRound: 4 },
    options: [
      {
        label: 'Take the meeting',
        emoji: '🕶️',
        outcomes: [
          { weight: 2, text: 'They love you. Your market value just doubled.', effects: { reputation: 3, morale: 6 } },
          { weight: 1, text: 'Your team boss spots you leaving their motorhome. Awkward.', effects: { teamRelation: -15, morale: -5 } },
        ],
      },
      { label: 'Tell your team', emoji: '📣', effects: { teamRelation: 5, money: 100, morale: -4 }, text: 'Your team matches the money, grumbling. You wonder what might have been.' },
      {
        label: 'Start a bidding war',
        emoji: '🎭',
        hint: 'Chess, not checkers',
        outcomes: [
          { weight: 1, text: 'Bidding war! You walk away with a fat bonus.', effects: { money: 300, teamRelation: -6 } },
          { weight: 1, text: 'Both teams lose patience. Nobody calls back.', effects: { teamRelation: -10, reputation: -3 } },
        ],
      },
    ],
  },
  {
    id: 'loyal-team-trouble',
    title: 'Team In Trouble',
    emoji: '🏚️',
    text: '{team} is in financial trouble. Rumour says it may not make the next round. The team boss quietly asks if you could take a pay cut.',
    weight: 3,
    when: { personality: ['loyal'], minRound: 2 },
    options: [
      { label: 'Take the pay cut', emoji: '💝', effects: { money: -200, teamRelation: 15, morale: 5 }, text: 'Jobs are saved. The mechanics bake you a cake that says “HERO”.' },
      {
        label: 'Hunt for sponsors',
        emoji: '🔎',
        outcomes: [
          { weight: 1, text: 'You land a sponsor for the team! Hero twice over.', effects: { teamRelation: 12, reputation: 3 } },
          { weight: 2, text: 'Nobody is buying. The effort is noticed, at least.', effects: { teamRelation: 5, morale: -4 } },
        ],
      },
      { label: 'Protect your salary', emoji: '🛡️', effects: { teamRelation: -12, morale: -5 }, text: 'Your agent says it is just business. It feels like betrayal. Because it sort of is.' },
    ],
  },
  {
    id: 'latebloomer-written-off',
    title: 'Written Off',
    emoji: '📝',
    text: 'A pundit says you have “peaked” and should retire to run a nice little garden centre. You are {age}. The garden centre does sound nice.',
    weight: 3,
    when: { personality: ['lateBloomer'] },
    options: [
      { label: 'Prove them wrong', emoji: '🔥', hint: 'Revenge is a long game', effects: { growth: 1, morale: -4 }, text: 'You pin the article above your bed. You read it every morning. Fuel.' },
      { label: 'Reply with humour', emoji: '😂', effects: { fans: 50, morale: 5 }, text: 'You post a photo holding a watering can: “Still growing.” Perfect.' },
      { label: 'Visit a garden centre', emoji: '🌻', hint: 'Hmm, tempting', effects: { morale: 8, form: -1 }, text: 'A lovely afternoon among the begonias. Racing can wait.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Junior formula
  // ---------------------------------------------------------------------------
  {
    id: 'junior-exams',
    title: 'Exam Season',
    emoji: '📚',
    text: 'Your final school exams clash with a crucial test day. Your teachers are unimpressed. Your parents are split. Your engineer sent a thumbs up.',
    weight: 3,
    when: { series: ['cadet', 'contender'], maxAge: 18 },
    options: [
      { label: 'Skip the exams', emoji: '🏎️', effects: { form: 2, morale: -5 }, text: 'Test day done. Your parents are furious. Your lap times are not.' },
      {
        label: 'Revise in the motorhome',
        emoji: '📖',
        hint: 'Multitasking legend?',
        outcomes: [
          { weight: 1, text: 'Top marks AND a useful test day. You are a machine.', effects: { morale: 10, reputation: 2 } },
          { weight: 2, text: 'You fall asleep on your textbook. And again in the debrief.', effects: { morale: -4, form: -1 } },
        ],
      },
      { label: 'Sit the exams', emoji: '🎓', effects: { morale: 6, teamRelation: -8 }, text: 'You pass! The team is less thrilled that you missed the test day.' },
    ],
  },
  {
    id: 'junior-paddock-parent',
    title: 'Paddock Parent',
    emoji: '📣',
    text: 'One of your parents has become a “paddock parent”: shouting advice from the pit wall and arguing with your engineer about tyre pressures.',
    weight: 3,
    when: { series: ['cadet', 'contender'], maxAge: 18 },
    options: [
      { label: 'Ask them to back off', emoji: '🙏', effects: { teamRelation: 6, morale: -6 }, text: 'Tears on both sides. But the engineer can finally hear the radio.' },
      { label: 'Let them be', emoji: '🤷', effects: { teamRelation: -6, morale: 4 }, text: 'They bring homemade sandwiches. The engineer plots an escape, sandwich in hand.' },
      {
        label: 'Give them a job',
        emoji: '🪪',
        outcomes: [
          { weight: 1, text: 'They run the team catering. Best food in the paddock. Peace!', effects: { teamRelation: 8, morale: 6 } },
          { weight: 1, text: 'They are put in charge of lap timing. Chaos reigns.', effects: { teamRelation: -8, morale: -3 } },
        ],
      },
    ],
  },
  {
    id: 'junior-driving-test',
    title: 'Road Driving Test',
    emoji: '🚙',
    text: 'You race cars for a living, but you still have to pass a normal driving test. Your examiner has clearly watched your crash compilation.',
    weight: 2,
    when: { minAge: 17, maxAge: 19, once: true },
    options: [
      {
        label: 'Drive super carefully',
        emoji: '🐢',
        outcomes: [
          { weight: 3, text: 'Passed! The examiner asks for a selfie.', effects: { morale: 8, fans: 20 } },
          { weight: 1, text: 'Failed for driving too slowly on a dual carriageway. The irony.', effects: { morale: -8, fans: 40 } },
        ],
      },
      {
        label: 'Drive like a racer',
        emoji: '🏎️',
        hint: 'Apex that roundabout',
        outcomes: [
          { weight: 1, text: 'Technically perfect. Technically terrifying. Passed, just.', effects: { morale: 6, fans: 40 } },
          { weight: 2, text: 'Failed in four minutes. The examiner needs a lie-down.', effects: { morale: -10, fans: 60 } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Endurance & GT
  // ---------------------------------------------------------------------------
  {
    id: 'endurance-codriver-setup',
    title: 'Co-Driver Clash',
    emoji: '🔧',
    text: 'Your co-drivers want a softer setup for the next race. You want it stiffer. You all share one car and, sadly, one seat insert.',
    weight: 3,
    when: { discipline: ['endurance'] },
    options: [
      { label: 'Go with the majority', emoji: '🤝', effects: { teamRelation: 6, form: -1 }, text: 'Democracy wins. The car feels like a waterbed, but the crew is happy.' },
      {
        label: 'Stand your ground',
        emoji: '🧱',
        outcomes: [
          { weight: 1, text: 'They try it your way. It is faster. Grudging respect all round.', effects: { form: 2, teamRelation: 4, morale: 5 } },
          { weight: 1, text: 'Stalemate. The engineer picks a setup nobody wanted.', effects: { form: -1, teamRelation: -8 } },
        ],
      },
      { label: 'Compromise', emoji: '⚖️', effects: { form: 1, morale: -3 }, text: 'A setup halfway between. Nobody loves it. Everyone can drive it.' },
    ],
  },
  {
    id: 'endurance-night-stint',
    title: 'Night Stint Nerves',
    emoji: '🌌',
    text: 'You have been handed the 3am stint at the next race. Pitch black, cold tyres, and slower cars appearing like ghosts in your headlights.',
    weight: 3,
    when: { discipline: ['endurance'] },
    options: [
      {
        label: 'Practise on the sim',
        emoji: '🖥️',
        hint: 'Hours of dark laps',
        effects: { skills: { consistency: 1 }, morale: -4 },
        text: 'Hours of dark sim laps. You can now see in the dark. Sort of.',
      },
      { label: 'Ask for a day stint', emoji: '☀️', effects: { teamRelation: -8, morale: 5 }, text: 'The team shuffles the rota. Your co-driver gets the ghosts instead.' },
      {
        label: 'Embrace the dark',
        emoji: '🦉',
        outcomes: [
          { weight: 2, text: 'You love it. The night is quiet. Your lap times are loud.', effects: { form: 2, morale: 6 } },
          { weight: 1, text: 'You nearly nod off in the briefing. Coffee intake: extreme.', effects: { form: -1, morale: -4 } },
        ],
      },
    ],
  },
  {
    id: 'endurance-motorhome-nap',
    title: 'Motorhome Naps',
    emoji: '😴',
    text: 'At the next race you need to sleep between stints, but your motorhome bunk is right next to the fan-zone stage. A tribute band has been booked.',
    weight: 2,
    when: { discipline: ['endurance'] },
    options: [
      { label: 'Buy fancy earplugs', emoji: '🎧', effects: { form: 1, money: -10 }, text: 'The most expensive earplugs money can buy. Worth every cent.' },
      {
        label: 'Sleep in the car',
        emoji: '🚗',
        hint: 'Surprisingly cosy?',
        outcomes: [
          { weight: 1, text: 'Surprisingly cosy. You wake refreshed and slightly sweaty.', effects: { form: 2, morale: 3 } },
          { weight: 1, text: 'You wake with the seatbelt pattern printed on your face. A fan takes a photo.', effects: { morale: -5, fans: 20 } },
        ],
      },
      { label: 'Join the fan zone', emoji: '🎸', effects: { fans: 60, form: -2, morale: 8 }, text: 'You sing with the band. Terrible. Magic. The fans will never forget.' },
    ],
  },
  {
    id: 'endurance-24h-hype',
    title: 'Twice Round The Clock',
    emoji: '🕛',
    text: 'Everyone keeps asking if you are ready for the 24 Hours of France. You have started dreaming in stint lengths and waking up to check tyre pressures.',
    weight: 2,
    when: { discipline: ['endurance'] },
    options: [
      { label: 'Walk the circuit', emoji: '🗺️', effects: { form: 1, morale: 4, money: -20 }, text: 'You walk the whole lap at dawn. The place hums with history. Goosebumps.' },
      {
        label: 'Try a sleep plan',
        emoji: '🛏️',
        hint: 'Napping as a sport',
        outcomes: [
          { weight: 2, text: 'You learn to nap in eleven minutes flat. A genuine superpower.', effects: { form: 2, morale: 3 } },
          { weight: 1, text: 'You can now only sleep in eleven-minute bursts. Including at night.', effects: { morale: -6 } },
        ],
      },
      { label: 'Ignore the hype', emoji: '🙉', effects: { morale: 5, fans: -10 }, text: '“It is just a long race.” The fans gasp. Your pulse stays at 52.' },
    ],
  },
  {
    id: 'gt-gentleman-driver',
    title: 'Gentleman Driver',
    emoji: '🎩',
    text: 'Your wealthy amateur co-driver owns three yachts and brakes about 50 metres too early. They want driving lessons. From you.',
    weight: 3,
    when: { discipline: ['gt', 'endurance'] },
    options: [
      { label: 'Coach them patiently', emoji: '🧑‍🏫', effects: { teamRelation: 8, form: 1, morale: -3 }, text: 'They find two whole seconds and buy the team a coffee machine. Worth it.' },
      { label: 'Charge for lessons', emoji: '💵', effects: { money: 120, teamRelation: -3 }, text: 'Private tuition at private-jet rates. They pay without blinking.' },
      { label: 'Politely dodge them', emoji: '🫥', effects: { teamRelation: -6, morale: 4 }, text: 'They find another coach. It turns out they play golf with the team owner.' },
    ],
  },
  {
    id: 'gt-manufacturer-politics',
    title: 'Manufacturer Politics',
    emoji: '🏭',
    text: 'The factory brand wants its “sister team” to win the next race and suggests you “manage your pace”. Nobody says the word “orders”. Everyone means it.',
    weight: 3,
    when: { discipline: ['gt', 'endurance'] },
    options: [
      { label: 'Follow the hint', emoji: '🤐', effects: { teamRelation: 10, morale: -8, form: -1 }, text: 'You cruise home. The factory will remember. So will you.' },
      { label: 'Race flat out', emoji: '🏁', effects: { teamRelation: -10, morale: 6, form: 1 }, text: 'You pretend the email went to spam. Nobody at the factory believes you.' },
      {
        label: 'Negotiate a deal',
        emoji: '🤝',
        outcomes: [
          { weight: 1, text: 'They promise you a factory seat next year. Deal.', effects: { teamRelation: 8, reputation: 2 } },
          { weight: 1, text: 'They promise nothing and forget your name by lunch.', effects: { morale: -5, teamRelation: -3 } },
        ],
      },
    ],
  },
  {
    id: 'gt-livery-vote',
    title: 'Fan Livery Vote',
    emoji: '🎨',
    text: 'Your GT team lets fans vote on your livery for the next round. The runaway leader is bubblegum pink with cartoon flamingos.',
    weight: 2,
    when: { discipline: ['gt'] },
    options: [
      { label: 'Honour the vote', emoji: '🦩', effects: { fans: 100, reputation: -1, morale: 4 }, text: 'Flamingo power! Merch sales go through the roof.' },
      { label: 'Veto it', emoji: '🚫', effects: { fans: -30, teamRelation: 4 }, text: 'You go with sleek matte black. The fans call the vote “rigged”.' },
      {
        label: 'Hide one flamingo',
        emoji: '🔍',
        hint: 'A compromise with feathers',
        outcomes: [
          { weight: 2, text: 'Fans hunt for it all weekend. Marketing genius.', effects: { fans: 60, morale: 4 } },
          { weight: 1, text: 'Nobody spots it. The fans still feel cheated.', effects: { fans: -15, morale: -3 } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // American open-wheel
  // ---------------------------------------------------------------------------
  {
    id: 'american-first-oval',
    title: 'First Oval',
    emoji: '⭕',
    text: 'Your first oval test. The wall is right there. The spotter is shouting numbers. Your brain keeps asking where all the corners went.',
    weight: 4,
    when: { discipline: ['american'], once: true },
    options: [
      {
        label: 'Flat out. Trust it.',
        emoji: '🦶',
        hint: 'Right foot of faith',
        outcomes: [
          { weight: 2, text: 'It clicks. Flat through turn one and it feels like flying.', effects: { form: 2, morale: 8 } },
          { weight: 1, text: 'You kiss the wall. Gently. The crew says “welcome to ovals”.', effects: { form: -2, morale: -6, teamRelation: -3 } },
        ],
      },
      { label: 'Build up slowly', emoji: '🐢', effects: { form: 1, morale: 3 }, text: 'Lap by lap, you find your rhythm. The spotter approves.' },
      { label: 'Ask a veteran', emoji: '🧓', effects: { skills: { racecraft: 1 }, morale: -4 }, text: 'A grizzled veteran explains the draft. Then tells you seven crash stories.' },
    ],
  },
  {
    id: 'american-victory-lane',
    title: 'Victory Lane Pie',
    emoji: '🥧',
    text: 'You won at {track}! Tradition says the winner rings the old farm bell and eats a whole peach pie in Victory Lane. The pie is enormous.',
    weight: 4,
    when: { discipline: ['american'], after: ['win'] },
    options: [
      {
        label: 'Eat the whole pie',
        emoji: '😋',
        outcomes: [
          { weight: 2, text: 'You demolish it. The crowd roars. Pie on your face, glory in your heart.', effects: { fans: 90, morale: 8 } },
          { weight: 1, text: 'Halfway through, you have regrets. Live on camera.', effects: { fans: 60, morale: -4 } },
        ],
      },
      { label: 'Share it with the crew', emoji: '🍴', effects: { teamRelation: 10, fans: 20 }, text: 'Pie for everyone! The pit crew now considers you family.' },
      { label: 'Just ring the bell', emoji: '🔔', effects: { fans: -15, morale: 4 }, text: 'Traditionalists boo. You ring the bell extra loud to compensate.' },
    ],
  },
  {
    id: 'american-pit-crew',
    title: 'Pit Crew Cookout',
    emoji: '🍔',
    text: 'Your pit crew invites you to their weekly cookout and stop practice. They want you to try a tyre change. The crew record is 3.2 seconds.',
    weight: 3,
    when: { discipline: ['american'] },
    options: [
      {
        label: 'Try the tyre change',
        emoji: '🛞',
        outcomes: [
          { weight: 1, text: '4.1 seconds! The crew hoists you onto their shoulders.', effects: { teamRelation: 12, morale: 6 } },
          { weight: 2, text: 'You drop the wheel gun on your foot. They love you anyway.', effects: { teamRelation: 8, morale: -3 } },
        ],
      },
      { label: 'Run the grill', emoji: '🔥', effects: { teamRelation: 8, morale: 5, money: -20 }, text: 'You buy the food and burn the burgers with pride. Crew morale: sky high.' },
      { label: 'Skip it', emoji: '🙅', effects: { teamRelation: -6, form: 1 }, text: 'You study the race data instead. The crew eats your share.' },
    ],
  },
  {
    id: 'american-heartland-hype',
    title: 'Heartland Hype',
    emoji: '🌽',
    text: 'The Heartland 500 is on the horizon. The fans want autographs, the media wants stories, and you want to stop thinking about 200 laps at full throttle.',
    weight: 2,
    when: { discipline: ['american'] },
    options: [
      { label: 'Meet the fans', emoji: '✍️', effects: { fans: 80, morale: -4, form: -1 }, text: 'Eight hours of autographs. Your hand is numb. Your heart is full.' },
      { label: 'Lock yourself away', emoji: '🔒', effects: { form: 2, fans: -15 }, text: 'Pure focus. You memorise every bump on the banking.' },
      {
        label: 'Quiz a past winner',
        emoji: '🏆',
        outcomes: [
          { weight: 1, text: 'A three-time winner shares a secret about turn three. Priceless.', effects: { form: 2, morale: 5 } },
          { weight: 1, text: 'They describe their worst crash in vivid detail. Thanks for that.', effects: { morale: -6 } },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Rare & dramatic
  // ---------------------------------------------------------------------------
  {
    id: 'rare-padel-injury',
    title: 'Padel Mishap',
    emoji: '🎾',
    text: 'A friendly padel match turns competitive. You dive for a lob, meet the glass wall and hear a crunch. It might be your wrist. It might be the glass.',
    weight: 0.5,
    options: [
      {
        label: 'See the doctor',
        emoji: '🩺',
        outcomes: [
          { weight: 2, text: 'Just a bad sprain. Ice, rest and a lot of embarrassment.', effects: { morale: -6, form: -1 } },
          { weight: 1, text: 'A hairline fracture. You will miss a race.', effects: { injuryRaces: 1, morale: -10 } },
        ],
      },
      {
        label: 'Tape it and race',
        emoji: '🩹',
        hint: 'Tough, or foolish?',
        outcomes: [
          { weight: 1, text: 'It holds. You grimace through every braking zone.', effects: { form: -2, morale: 4 } },
          { weight: 1, text: 'It does not hold. The doctors are very cross with you.', effects: { injuryRaces: 2, teamRelation: -8 } },
        ],
      },
    ],
  },
  {
    id: 'rare-cycling-crash',
    title: 'Pigeon Strike',
    emoji: '🚴',
    text: 'On a training ride, a pigeon flies straight into your helmet at 40 km/h. You and your bike part ways in spectacular fashion.',
    weight: 0.5,
    options: [
      {
        label: 'Get checked out',
        emoji: '🏥',
        outcomes: [
          { weight: 2, text: 'Bruises and grazes. You look terrible, but you can race.', effects: { morale: -6 } },
          { weight: 1, text: 'Broken collarbone. The pigeon is absolutely fine.', effects: { injuryRaces: 3, morale: -15 } },
        ],
      },
      {
        label: 'Hide it from the team',
        emoji: '🤫',
        hint: 'Terrible idea',
        outcomes: [
          { weight: 1, text: 'Nobody notices your limp. You get away with it. This time.', effects: { form: -1, morale: 3 } },
          { weight: 1, text: 'The team finds out from a fan video. Trust dented.', effects: { teamRelation: -12, form: -1 } },
        ],
      },
    ],
  },
  {
    id: 'rare-documentary-scandal',
    title: 'Documentary Scandal',
    emoji: '📼',
    text: 'A documentary crew aired a clip of you calling the team boss “a lukewarm lasagne”. The team boss has seen it. Twice.',
    weight: 0.5,
    when: { minRound: 3 },
    options: [
      { label: 'Apologise on camera', emoji: '🙇', effects: { teamRelation: 8, fans: -20, morale: -5 }, text: 'A tearful apology. The boss accepts, then orders lasagne every day.' },
      { label: 'Double down', emoji: '😈', effects: { teamRelation: -15, fans: 150, reputation: -3 }, text: '“A lukewarm lasagne in a suit.” The merch is printed within the hour.' },
      {
        label: 'Claim it was edited',
        emoji: '✂️',
        outcomes: [
          { weight: 1, text: 'The producers admit they cut it weirdly. You are in the clear.', effects: { teamRelation: 3, reputation: 2 } },
          { weight: 2, text: 'They release the uncut version. It is worse.', effects: { teamRelation: -12, reputation: -4 } },
        ],
      },
    ],
  },
  {
    id: 'rare-leaked-radio',
    title: 'Leaked Radio',
    emoji: '📡',
    text: 'A leaked team radio clip of you calling {teammate} “a mobile chicane” is all over the internet. The team is in crisis-meeting mode.',
    weight: 0.5,
    when: { needsTeammate: true },
    options: [
      { label: 'Apologise in person', emoji: '🙏', effects: { teammateRelation: 10, fans: -10, morale: -5 }, text: 'They accept. They also print “mobile chicane” hoodies. Fair.' },
      {
        label: 'Say it was a joke',
        emoji: '😅',
        outcomes: [
          { weight: 1, text: 'Everybody buys it. Crisis over.', effects: { teammateRelation: -5, fans: 20 } },
          { weight: 1, text: 'Nobody buys it. {teammate} stops speaking to you.', effects: { teammateRelation: -18, teamRelation: -8 } },
        ],
      },
      { label: 'Stand by it', emoji: '😤', effects: { teammateRelation: -20, fans: 100, teamRelation: -10 }, text: 'The internet loves a villain. {teammate} does not.' },
    ],
  },
  {
    id: 'rare-wrong-flight',
    title: 'Wrong Flight',
    emoji: '✈️',
    text: 'You boarded the wrong flight and landed in the wrong country, two days before the next race. Your phone is on 12%.',
    weight: 1,
    options: [
      { label: 'Buy any ticket back', emoji: '💳', effects: { money: -60, morale: -4 }, text: 'The only seat left is in business class. Expensive, but you make it.' },
      {
        label: 'Road-trip it',
        emoji: '🚐',
        hint: 'An adventure awaits',
        outcomes: [
          { weight: 1, text: 'An epic road trip! You arrive tired, with a viral travel vlog.', effects: { fans: 60, form: -1, morale: 6 } },
          { weight: 1, text: 'Traffic, a flat tyre and a goat on the road. You arrive barely awake.', effects: { form: -2, morale: -6 } },
        ],
      },
      { label: 'Call the team', emoji: '📞', effects: { teamRelation: -8 }, text: 'The team sends a jet. The team boss also sends a very long voice note.' },
    ],
  },
];
