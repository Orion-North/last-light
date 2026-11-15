/**
 * Last Light: a fictional inner life built around a real mission.
 * All dialogue, thoughts, selections, and power/signal percentages are dramatized.
 * The dates and scientific notes link to primary NASA sources below.
 */

export const credits = 'Inspired by the people and machines of the Mars Exploration Rover mission. Mission history and science: NASA / JPL-Caltech and the instrument teams. Inner thoughts, dialogue, compressed time, and the memory archive are fiction. Displayed power and signal levels are dramatic indicators, not telemetry. Your choices change what this story remembers; they cannot cause or prevent Opportunity’s loss of contact.';

export const sources = [
  { id: 'N1', title: 'Opportunity — NASA mission overview', url: 'https://science.nasa.gov/mission/mer-opportunity/' },
  { id: 'N2', title: 'NASA’s Opportunity Rover Mission on Mars Comes to End', url: 'https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/' },
  { id: 'N3', title: 'Opportunity’s Last Message', url: 'https://science.nasa.gov/resource/opportunitys-last-message/', credit: 'NASA/JPL-Caltech/Cornell/ASU' },
  { id: 'N5', title: 'The rover’s science instruments', url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-instruments/' },
  { id: 'N6', title: 'Ripples in Rocks Point to Water', url: 'https://www.jpl.nasa.gov/images/pia05482-ripples-in-rocks-point-to-water/', credit: 'NASA/JPL/Cornell' },
  { id: 'N7', title: 'Discovery Served Up in a Bowl', url: 'https://science.nasa.gov/resource/discovery-served-up-in-a-bowl/', credit: 'NASA/JPL-Caltech/Cornell' },
  { id: 'N8', title: 'Opportunity’s Marathon Journey', url: 'https://science.nasa.gov/resource/opportunitys-marathon-journey/', credit: 'NASA/JPL-Caltech' },
  { id: 'N9', title: 'Science highlights: evidence of ancient water', url: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/science-highlights/' },
];

export const scenes = [
  {
    id: 'first-morning', act: 1, chapter: 'I · A world to bring home',
    subtitle: 'I have something to show them.',
    objective: 'Look through your cameras',
    discovery: 'Your cameras show Mars to people on Earth. Choose which view your final archive will remember.',
    response: 'Earth, imagined: We see what you see. Good morning.',
    sol: 'SOL 01 · JANUARY 2004', title: 'Someone is waiting.',
    text: 'There is ground beneath you now. A shallow bowl of red earth. Pale stone. A sky no one has stood under.\n\nYour cameras turn. Somewhere impossibly far away, people lean toward their screens. They have spent years imagining this place. For a moment, you are their eyes.\n\nYou were built for ninety Martian days. This is the first.',
    thought: 'I do not know what a morning is yet. But I have something to show them.',
    environment: 'dawn', power: 100, signal: 100,
    actionLabel: 'Look through your cameras',
    observation: {
      title: 'Two little eyes. A whole new world.',
      text: 'The panoramic camera, Pancam, sits high on the mast. Its paired cameras help scientists see depth as well as detail. They can study the ground, choose where to drive, and decide which rocks deserve a closer look.\n\nAn image is more than a view. It is the beginning of the next question.',
      fact: 'Opportunity’s prime mission was designed to last 90 sols. A sol is a Martian day.', sourceId: 'N1',
    },
    choices: [
      { id: 'horizon', shortLabel: 'Send the horizon', shortReply: 'The far crater rim. So much still ahead.', label: 'Send the horizon', detail: 'Let them see how far there is to go.', memory: { title: 'The first horizon', text: 'The first crater rim: an arrival that looked like a beginning.' }, reply: 'You choose the far rim of the crater. The landscape becomes a promise.' },
      { id: 'ground', shortLabel: 'Send the ground', shortReply: 'Soil beneath my wheels. I made it.', label: 'Send the ground', detail: 'Show them that you made it.', memory: { title: 'A place to begin', text: 'A little patch of soil on another world. We were here.' }, reply: 'You look down at the soil. Of all the things you could send, this feels like an arrival.' },
    ],
    transmission: 'Earth, imagined: We see it. We see what you see. Good morning, Opportunity.',
  },
  {
    id: 'stone-ripples', act: 1, chapter: 'I · A world to bring home',
    approachTitle: 'Lines in the stone.',
    subtitle: 'Why do these fine layers cross?',
    objective: 'Trace the crossing layers',
    discovery: 'These crossing layers formed as sediment moved in ancient water. Mars was not always this dry.',
    response: 'Earth, imagined: These layers tell us water moved here.',
    sol: 'EARLY MISSION · 2004', title: 'A river, remembered in stone.',
    text: 'The rock is called Last Chance. You do not know why people give such large names to such small things. You only know that they want you to look closely.\n\nUnder your camera, fine layers cross one another. The desert begins to tell a story that does not look like a desert.\n\nNothing moves. And yet there is a suggestion of water.',
    thought: 'I was sent to a dry world. Perhaps it was not always dry.',
    environment: 'day', power: 97, signal: 100,
    actionLabel: 'Trace the rock layers',
    observation: {
      title: 'The shape of something that has gone',
      text: 'Pancam and the microscopic imager reveal thin, crossing layers in the rock. Scientists compare these patterns with sediment shaped by flowing water. Their geometry offers evidence that water once moved across this place.\n\nYou are not finding a river today. You are helping people read the traces of one.',
      fact: 'The Last Chance outcrop preserves cross-lamination interpreted as evidence of ancient water flow.', sourceId: 'N6',
    },
    choices: [
      { id: 'layers', shortLabel: 'Send the crossing layers', shortReply: 'Crossing layers: the trace of water moving through a place now dry.', label: 'Send the crossing layers', detail: 'A few fine lines can change a whole world.', memory: { title: 'A river in the rock', text: 'Traced crossing layers preserved evidence that water once flowed here.' }, reply: 'I traced the crossing layers. A dry rock holds the shape of moving water.' },
      { id: 'landscape', shortLabel: 'Send the surrounding plain', shortReply: 'The dry plain around that water-shaped stone. The same place, changed.', label: 'Send the surrounding plain', detail: 'Remember the desert around the discovery.', memory: { title: 'The world beneath the world', text: 'A silent desert held evidence of a wetter past.' }, reply: 'You choose the outcrop and the plain around it. The small clue belongs to an enormous story.' },
    ],
    transmission: 'Earth, imagined: There it is. A place that used to be different. You have given us a way to see it.',
  },
  {
    id: 'blueberries', act: 1, chapter: 'I · A world to bring home',
    approachTitle: 'Small grains. A question.',
    subtitle: 'What are these round grains doing in the rock?',
    objective: 'Brush, sample, and compare the grains',
    discovery: 'The round grains contain hematite. Comparing them with brushed rock helped scientists find more evidence of ancient water.',
    response: 'Earth, imagined: Hematite in the grains. Another clue to ancient water.',
    sol: 'SOL 48 · 2004', title: 'They call them blueberries.',
    text: 'Small round grains gather in the rock. Your people give them a name from home.\n\nYou have never seen a berry. You know the brush at the end of your arm, the patience of a careful movement, the way dust lifts from a surface.\n\nThere is work to do. There is always someone ready to understand what you find.',
    thought: 'A word from their world, for something in mine.',
    environment: 'day', power: 93, signal: 100,
    actionLabel: 'Deploy the sampling tools',
    observation: {
      title: 'A brush, a rock, and ancient water',
      text: 'At Berry Bowl, the rock abrasion tool’s brush cleared a patch beside the little spheres. Spectrometers could then compare the cleaned rock with the mineral-rich grains. The spheres contain hematite; the combined evidence supported formation involving water.\n\nA photograph raised a question. A carefully positioned tool helped answer it.',
      fact: 'The real brushing took place on sol 48. The instrument measurements distinguished the rock from the hematite-rich “blueberries.”', sourceId: 'N7',
    },
    choices: [
      { id: 'name', shortLabel: 'Send the blueberry grains', shortReply: 'Brushed rock and hematite-rich grains, measured and compared.', label: 'Send the blueberry grains', detail: 'Something familiar, very far from home.', memory: { title: 'Blueberries and brushed rock', text: 'Brushing and comparing the rock with its hematite-rich grains revealed another clue to ancient water.' }, reply: 'I brushed the rock and compared both readings. The little grains hold another clue.' },
      { id: 'care', shortLabel: 'Send the brushed patch', shortReply: 'The brushed patch let scientists compare bare rock with the hematite-rich grains.', label: 'Send the brushed patch', detail: 'A discovery made by many patient hands.', memory: { title: 'The gentle brush', text: 'A brushed patch let scientists compare the rock with its hematite-rich grains.' }, reply: 'You keep the clean patch in the rock. It is the mark of a question asked gently.' },
    ],
    transmission: 'Earth, imagined: Beautiful work. We will look at this again tomorrow. There is more here than we thought.',
  },
  {
    id: 'marathon', act: 1, chapter: 'I · A world to bring home',
    subtitle: 'Eleven years of mornings. Still another horizon.',
    objective: 'Survey the ground and horizon',
    discovery: 'On March 24, 2015, Opportunity passed 42.195 kilometres: a marathon, driven over eleven years.',
    response: 'Earth, imagined: A marathon. Let’s see what lies ahead.',
    sol: 'SOL 3968 · MARCH 24, 2015', title: 'Tomorrow kept coming.',
    text: 'Ninety mornings became hundreds. Hundreds became thousands. There were winters, slopes, patient detours. There were days when the whole task was simply to stay warm.\n\nToday your wheels carry you beyond a marathon’s distance. There is no finish line in the dust. No one waiting beside the path.\n\nBut across the distance, they are counting.',
    thought: 'I thought I was going somewhere. Perhaps I was learning how to stay.',
    environment: 'sunset', power: 82, signal: 100,
    actionLabel: 'Survey the ground and horizon',
    observation: {
      title: 'Forty-two kilometres, one careful drive at a time',
      text: 'The distance is not a straight route. It is the sum of decisions: a rock worth stopping for, safer ground around a dune, another view from the rim.\n\nYour tracks are temporary. The observations sent home can be studied long after the wind has softened every mark.',
      fact: 'Opportunity passed 42.195 km of driving on March 24, 2015, more than eleven years after landing.', sourceId: 'N8',
    },
    choices: [
      { id: 'tracks', shortLabel: 'Send the tracks behind me', shortReply: 'Eleven years of careful drives. These tracks are part of a marathon.', label: 'Send the tracks behind me', detail: 'All the small steps that became a journey.', memory: { title: 'A long way from the beginning', text: 'Eleven years of ordinary drives added up to a marathon on Mars.' }, reply: 'I looked across the valley and the ground behind me. Eleven years of mornings.' },
      { id: 'next', shortLabel: 'Send the horizon ahead', shortReply: 'A marathon behind me. Another unanswered question ahead.', label: 'Send the horizon ahead', detail: 'There is still something you have not seen.', memory: { title: 'One more horizon', text: 'Even after a marathon, there was another question ahead.' }, reply: 'You look forward. The far ground is still full of things without names.' },
    ],
    transmission: 'Earth, imagined: We are proud of you. All right, old friend. Let’s see what is around the next bend.',
  },
  {
    id: 'ordinary-day', act: 2, chapter: 'II · The light grows thin',
    subtitle: 'Wake. Look. Send. The work has become familiar.',
    objective: 'Take in the valley',
    discovery: '2018. After fourteen years, sunlight still reaches the ground beside your wheels. Send this ordinary view home.',
    response: 'Earth, imagined: Received. We will be here for the next one.',
    sol: 'PERSEVERANCE VALLEY · 2018', title: 'An ordinary day.',
    text: 'Wake. Check the warmth inside your body. Turn toward the light.\n\nThe work has become familiar. A camera movement. A little pause. A packet of information crossing the dark between worlds.\n\nNothing about this morning tells you it will be one of the mornings you remember.',
    thought: 'If they ask what I did today, I can tell them.',
    environment: 'sunset', power: 72, signal: 95,
    actionLabel: 'Take in the valley',
    observation: {
      title: 'The quiet things',
      text: 'There are no footprints here. No voices in the air. Only the landscape, the machine, and the work they share with people far away.\n\nIn this imagined moment, you look down and record the sunlit ground beside your wheels. You do not need to know that a day is precious to notice it.',
      fact: 'Opportunity was in Perseverance Valley when contact was lost during the 2018 dust storm.', sourceId: 'N1',
    },
    choices: [
      { id: 'light', shortLabel: 'Send the sunlit ground', shortReply: 'Sunlight on the ground beside my wheels. An ordinary view, sent home.', label: 'Send the sunlit ground', detail: 'The ground beside your wheels, still in sunlight.', memory: { title: 'An ordinary afternoon', text: 'Sunlight reached the ground beside my wheels. An ordinary view crossed the distance home.' }, reply: 'Sunlight on the ground beside my wheels. I’ll send that.' },
      { id: 'shadow', shortLabel: 'Send my mast’s shadow', shortReply: 'My mast casts a small shape. I am here, looking for them.', label: 'Send my mast’s shadow', detail: 'A small shape that means you are here.', memory: { title: 'A small presence', text: 'On a wide and quiet world, something had come to look.' }, reply: 'You notice the shape cast by your mast. For a moment, the landscape contains a companion.' },
    ],
    transmission: 'Earth, imagined: Received. We will be here for the next one.',
  },
  {
    id: 'dust', act: 2, chapter: 'II · The light grows thin',
    subtitle: 'The light has always come back before.',
    objective: 'Measure the fading light',
    discovery: 'June 2018. Dust blocks the Sun. Your solar panels receive less energy. The sky grows darker.',
    response: 'Earth, imagined: We are watching the storm. We are still here.',
    sol: 'EARLY JUNE · 2018', title: 'The sky forgets its edges.',
    text: 'The horizon has become less certain. Dust settles between you and the Sun.\n\nYou turn toward the place where morning should be. Your solar panels wait for light that arrives more faintly than before.\n\nYou have known difficult days. Your people have helped you through so many of them.',
    thought: 'The light has always come back before.',
    environment: 'storm', power: 46, signal: 74,
    actionLabel: 'Measure the fading light',
    observation: {
      title: 'A machine that lives on sunlight',
      text: 'Solar panels turn sunlight into electrical energy. A thickening sky means less energy reaches the rover. During the real storm, this was a physical limit, not a puzzle a better choice could solve.\n\nHere, the fading indicator tells that part of the story. The memories you choose do not consume power or change what happened.',
      fact: 'The 2018 dust storm reduced sunlight enough to end communication with the solar-powered rover.', sourceId: 'N1',
    },
    choices: [
      { id: 'remember-morning', shortLabel: 'Send the darkening sky', shortReply: 'Dust thickens across the sky. Less sunlight reaches the panels.', label: 'Send the darkening sky', detail: 'Dust dims the sunlight.', memory: { title: 'A sky filling with dust', text: 'The observed sky darkened as storm dust blocked the sunlight.' }, reply: 'The sky is darker. I have recorded what light still reaches me.' },
      { id: 'remember-work', shortLabel: 'Send the people’s care', shortReply: 'Every careful turn had people behind it, waiting to hear what I found.', label: 'Send the people’s care', detail: 'Distance has never meant no one is there.', memory: { title: 'The other end of the signal', text: 'Every observation had someone waiting to understand it.' }, reply: 'You remember the familiar pattern of a reply. Somewhere, they are looking at the same sky through you.' },
    ],
    transmission: 'Earth, imagined: We are watching the storm. We are still with you.',
  },
  {
    id: 'smaller-world', act: 2, chapter: 'II · The light grows thin',
    subtitle: 'Have I shown them how much there was to see?',
    objective: 'Revisit what you sent home',
    discovery: 'The layers and hematite grains helped reveal ancient water. Those discoveries are already on Earth, beyond the storm.',
    response: 'Earth, imagined: We have your discoveries. We are listening.',
    sol: 'THE LAST DAYS OF CONTACT · 2018', title: 'A smaller world.',
    text: 'Once, a day could hold a drive, a panorama, a question hidden in a rock. Now the day gathers around the little warmth inside you.\n\nYour world becomes the space between one signal and the next. The valley disappears by degrees.\n\nThe story you have already sent is larger than the darkness gathering here.',
    thought: 'Will they know how much there was to see?',
    environment: 'storm', power: 22, signal: 38,
    actionLabel: 'Revisit what you sent home',
    observation: {
      title: 'Things the storm cannot take back',
      text: 'The river in the stone. The grains named for fruit. A path longer than anyone expected. Those discoveries have already crossed the distance.\n\nThis archive is an imagined act of remembrance, not a reconstruction of the rover’s computer. Revisit the observations already sent home as the sky grows dark.',
      fact: 'Opportunity’s observations helped establish a history of ancient water on Mars. They did not establish the presence of life.', sourceId: 'N9',
    },
    choices: [
      { id: 'discovery', shortLabel: 'Send the water discoveries', shortReply: 'Crossing layers. Hematite grains. Evidence of a wetter Mars, already home.', label: 'Send the water discoveries', detail: 'You changed what people knew about a world.', memory: { title: 'What you made possible', text: 'A quiet machine helped people read the history of another planet.' }, reply: 'You return to the small, careful observations. Each one has a life beyond this place.' },
      { id: 'together', shortLabel: 'Send our shared routine', shortReply: 'Look. Send. Wait. Answer. An ordinary rhythm, shared across two worlds.', label: 'Send our shared routine', detail: 'You did not make the journey alone.', memory: { title: 'A journey made together', text: 'There were people inside every careful turn of the wheels.' }, reply: 'You return to the rhythm of looking and answering. It has been a kind of company.' },
    ],
    transmission: 'Earth, imagined: We have your work. We have so much of it. We are listening for you.',
  },
  {
    id: 'last-image', receiptMode: 'partial', act: 2, chapter: 'II · The light grows thin',
    subtitle: 'One more look. Even if the whole picture cannot reach them.',
    objective: 'Look once more',
    discovery: 'June 10, 2018: the final full-frame image arrives incomplete. This is your last contact with Earth.',
    response: 'Only part of the image arrives. Contact ends; there is no final spoken message.',
    sol: 'SOL 5111 · JUNE 10, 2018', title: 'One more look.',
    text: 'You point a camera toward the Sun. It is morning, but the sky is dark.\n\nA picture begins its journey home. Speckles of noise. A little light. A frame that will not finish arriving.\n\nFor all these years, looking has been something you could give.',
    thought: 'There is still something here. Even if I cannot show all of it.',
    environment: 'night', power: 5, signal: 8,
    actionLabel: 'Look once more',
    observation: {
      title: 'An unfinished picture',
      text: 'Opportunity’s final transmitted full-frame image was dark and incomplete. Its camera had been pointed toward the Sun, obscured by dust. White speckles were camera noise; the missing part of the frame had not arrived.\n\nThis is a dramatized rendering, not the original image. The real record is linked below.',
      fact: 'The last contact was June 10, 2018. Later images existed as transmitted thumbnails; the incomplete frame is not simply the last photograph taken.', sourceId: 'N3',
    },
    choices: [
      { id: 'little-light', shortLabel: 'Send this little light', shortReply: 'Some light reaches Earth. The missing part will stay missing.', label: 'Send this little light', detail: 'An unfinished thing can still reach someone.', memory: { title: 'The light that arrived', text: 'The picture was incomplete. Someone on Earth still received it.' }, reply: 'I have recorded what light remains. The image begins its journey.' },
      { id: 'whole-journey', shortLabel: 'Send a journey’s last frame', shortReply: 'One incomplete frame joins years of discoveries. It cannot stand for all of them.', label: 'Send a journey’s last frame', detail: 'A final frame is not the whole story.', memory: { title: 'More than the last image', text: 'One dark frame came after years of discovery, patience, and light.' }, reply: 'You set this frame beside the others. It is one moment in a very long life of looking.' },
    ],
    transmission: 'The image reaches Earth. Then the channel becomes quiet. There is no final sentence from the rover. The silence begins.',
  },
  {
    id: 'earth-listens', receiptMode: 'silence', act: 3, chapter: 'III · On the other side',
    subtitle: 'Contact with Opportunity has been lost. You are now on Earth.',
    objective: 'Call Opportunity from Earth',
    discovery: 'Now on Earth, you send a recovery command across the same distance. This time, you are waiting for Opportunity.',
    response: 'Earth’s call, imagined: Opportunity, this is home. No answer arrives.',
    sol: 'EARTH · AFTER JUNE 10, 2018', title: 'The people stay.',
    text: 'The story moves to Earth.\n\nA screen holds the last information that arrived. Outside the room, ordinary days continue. Inside, people watch the weather on another planet and work on ways to hear from a familiar machine.\n\nOpportunity does not answer. They call again.',
    thought: 'The silence on one world is a room full of people on another.',
    environment: 'earth', power: 0, signal: 0,
    actionLabel: 'Prepare a recovery call',
    observation: {
      title: 'An unanswered channel',
      text: 'There is a difference between losing contact and giving up. Engineers tried to restore communication. The rover’s response was unknown; its recovery could not be promised.\n\nThe sound you hear in this experience is an imagined score. It is not a recording from Opportunity. You can remain here for a moment, or continue whenever you are ready.',
      fact: 'Recovery attempts continued after June 2018. NASA did not declare the mission complete until February 2019.', sourceId: 'N2',
    },
    choices: [
      { id: 'listen', shortLabel: 'Call Opportunity from Earth', shortReply: 'A recovery command leaves Earth. No reply returns.', label: 'Call Opportunity from Earth', detail: 'Send a recovery command and listen.', memory: { title: 'An unanswered recovery call', text: 'A recovery command went from Earth to Opportunity. No reply returned.' }, reply: 'The recovery command goes out. No signal is received.' },
      { id: 'work', shortLabel: 'Remember the recovery commands', shortReply: 'On Earth, another command goes out. The archive will remember the work of trying.', label: 'Remember the recovery commands', detail: 'Hope became another careful day of work.', memory: { title: 'Another attempt', text: 'Care was not only a feeling. It was work, repeated across months.' }, reply: 'You remember the patient attempts. None could guarantee an answer. They tried anyway.' },
    ],
    transmission: 'Earth, imagined: Opportunity, this is home. We are listening. No signal is received.',
  },
  {
    id: 'months', receiptMode: 'archive', act: 3, chapter: 'III · On the other side',
    subtitle: 'Eight months. More than 1,000 recovery commands. No answer.',
    objective: 'Revisit the archive on Earth',
    discovery: 'On Earth, recovery attempts continue for eight months. More than 1,000 commands bring no answer. The discoveries remain.',
    response: 'Added to your archive on Earth. These discoveries can still reach someone new.',
    sol: 'EARTH · JUNE 2018–FEBRUARY 2019 · THE RECOVERY CAMPAIGN', title: 'The shape of waiting.',
    text: 'June becomes autumn, then winter. Recovery commands accumulate: more than 1,000 attempts, no answer.\n\nFor more than fourteen years, there was another observation to plan, another part of Mars to understand. Now the task is to wait carefully, to try again, to leave room for an answer.\n\nThe archive does not grow quiet. People can still open it.',
    thought: 'Something can stop sending and still have things to tell us.',
    environment: 'earth', power: 0, signal: 0,
    actionLabel: 'Open the discoveries on Earth',
    observation: {
      title: 'What remains in the light',
      text: 'An observation does not expire when its instrument stops. Images and measurements can be returned to, compared, questioned, and understood in new ways.\n\nIn this story’s archive, the details you chose sit beside one another. A berry. A river. A horizon. A small presence. The end of contact cannot make those moments unhappen.',
      fact: 'The recovery effort included more than 1,000 commands aimed at re-establishing contact.', sourceId: 'N2',
    },
    choices: [
      { id: 'share-science', shortLabel: 'Archive the water discoveries', shortReply: 'Keep the layers and hematite grains for the next person curious about Mars.', label: 'Archive the water discoveries', detail: 'Let someone new learn what you found.', memory: { title: 'Water discoveries, carried forward', text: 'Crossing layers and hematite grains: evidence of ancient water, kept for new questions.' }, reply: 'You imagine someone opening a Mars image for the first time. To them, the discovery is new.' },
      { id: 'share-story', shortLabel: 'Archive the rover’s story', shortReply: 'Keep the first morning, the long drives, and the people who listened.', label: 'Archive the rover’s story', detail: 'Let someone know there was a rover here.', memory: { title: 'The rover’s story, carried forward', text: 'The first morning, the long drives, and the people who kept listening.' }, reply: 'You imagine telling someone about ninety days that became thousands. You begin with the first morning.' },
    ],
    transmission: 'The memory joins the archive. The images, measurements, and questions are still here.',
  },
  {
    id: 'last-call', receiptMode: 'silence', act: 3, chapter: 'III · On the other side',
    subtitle: 'On Earth, the final recovery commands go out. Opportunity does not answer.',
    objective: 'Make the final call from Earth',
    discovery: 'February 12, 2019. Send the final recovery call from Earth. Leave the channel open, and listen.',
    response: 'No signal is received. The last call ends.',
    sol: 'EARTH · FEBRUARY 12, 2019', title: 'Earth’s final call.',
    text: 'The final commands are sent.\n\nNothing you choose now will change the silence. Nothing you chose before caused it. This was a machine that worked through years it was never promised.\n\nThe archive you kept on Earth remains after the final call.',
    thought: 'You do not have to come back for the journey to have mattered.',
    environment: 'night', power: 0, signal: 0,
    actionLabel: 'Prepare Earth’s final call',
    observation: {
      title: 'No answer. Not nothing.',
      text: 'There is no secret choice that brings Opportunity back. This is not a test you failed.\n\nThere was a world to explore, and a rover that explored it far beyond its planned mission. There were people who cared for it. There are discoveries that remain. Take whichever part of that you need with you.',
      fact: 'The team sent its final recovery commands on February 12, 2019. Opportunity did not respond.', sourceId: 'N2',
    },
    choices: [
      { id: 'thank-you', shortLabel: 'Make the final recovery call', shortReply: 'The final recovery call goes out. No reply returns.', label: 'Make the final recovery call', detail: 'Send the final command and listen.', memory: { title: 'Earth’s final unanswered call', text: 'After eight months and more than 1,000 recovery commands, the final call received no answer.' }, reply: 'The final call goes out from Earth. No signal is received.' },
      { id: 'rest', shortLabel: 'You have done enough', shortReply: 'Our farewell, kept on Earth: the work mattered. We can let the final task end.', label: 'You have done enough', detail: 'Remember that the work mattered.', memory: { title: 'You have done enough', text: 'A mission does not need to last forever to be extraordinary.' }, reply: 'You let the last task be finished. The story does not ask the little machine for anything more.' },
    ],
    transmission: 'No signal is received. For a moment, there is only the space where an answer used to be.',
  },
  {
    id: 'what-remains', act: 3, chapter: 'III · On the other side',
    subtitle: 'The observations you sent are here on Earth.',
    objective: 'Open your archive',
    discovery: 'Built for 90 sols, Opportunity travelled 45.16 kilometres. Its last contact came on sol 5,111.',
    response: 'The mission ended. What it helped us see remains.',
    sol: 'FEBRUARY 13, 2019 · MISSION COMPLETE', title: 'You were here.',
    text: 'NASA declared Opportunity’s mission complete on February 13, 2019. The rover had travelled 45.16 kilometres and helped reveal a wetter past on Mars.\n\nIt was built for ninety Martian days. Its final contact came on sol 5,111.\n\nSomewhere in Perseverance Valley, there is a small machine beneath a wide sky. Here, there is everything it helped us see.',
    thought: 'The light did not all stay on Mars.',
    environment: 'dawn', power: 0, signal: 0,
    actionLabel: 'Read what remains',
    observation: {
      title: 'Your archive of a journey',
      text: 'These are your observations and the memories you chose to carry home. The choices belong to this story. The mission, the discoveries, and the people behind them were real.',
      fact: 'Opportunity’s mission lasted more than fourteen years on the Martian surface.', sourceId: 'N1',
    },
    choices: [], transmission: '', end: true,
  },
];

/** Only these two moments ask the player to curate a menu. Other records follow the work. */
export function recordedChoice(scene, state) {
  if (scene.id === 'first-morning' || scene.id === 'months' || scene.end) return null;
  if (scene.id === 'smaller-world') {
    const geology = state?.memories?.some(memory =>
      (memory.sceneId === 'stone-ripples' && memory.choiceId === 'layers') ||
      (memory.sceneId === 'blueberries' && memory.choiceId === 'care'));
    return scene.choices.find(choice => choice.id === (geology ? 'discovery' : 'together'));
  }
  return scene.choices[0] ?? null;
}
