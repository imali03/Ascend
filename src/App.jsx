import { useState, useEffect } from 'react';
import { Home, Dumbbell, History, TrendingUp, Plus, Check, X, Flame, Trophy, Calendar, Clock, ChevronRight, ChevronDown, Search, Loader2, RotateCcw, Link2, Filter, Moon } from 'lucide-react';
// Storage shim — replaces Claude's window.storage with browser localStorage
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key);
      return v !== null ? { value: v } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
      return { value };
    },
    delete: async (key) => {
      localStorage.removeItem(key);
      return { deleted: true };
    },
  };
}
// ============================================================================
// STORAGE KEYS
// ============================================================================
const STORAGE_KEY_HISTORY = 'ascend:history:v2';
const STORAGE_KEY_ROTATION_INDEX = 'ascend:rotation_index:v2';
const STORAGE_KEY_CUSTOM_EXERCISES = 'ascend:custom_exercises:v2';
const STORAGE_KEY_ACTIVE_WORKOUT = 'ascend:active_workout:v2';

// ============================================================================
// ROTATION SEQUENCE
// Push A → Pull → Legs → Rest → Push B → Pull → Rest → Legs → Push A → Pull → Rest → repeat
// ============================================================================
const ROTATION_SEQUENCE = [
  'push-a',
  'pull',
  'legs',
  'rest',
  'push-b',
  'pull',
  'rest',
  'legs',
  'push-a',
  'pull',
  'rest',
];

// ============================================================================
// WORKOUT PROGRAM — Source of truth from uploaded program document
// ============================================================================
const PROGRAM = {
  'push-a': {
    id: 'push-a',
    name: 'Push A',
    focus: {
      primary: 'Chest',
      secondary: 'Triceps',
      smallDose: 'Shoulders',
    },
    description: 'Push A is a chest-priority day. The goal is to train chest with enough volume and intensity, finish triceps hard, and include just enough shoulder work without turning this into a shoulder-focused day.',
    sections: [
      {
        title: 'Chest',
        exercises: [
          {
            id: 'pa-1',
            name: 'Incline Dumbbell Press',
            sets: 3,
            reps: '6–10',
            rest: '2–3 min',
            purpose: 'Main upper-chest builder.',
            executionNotes: [
              'Use a 30–45° bench angle.',
              'Lower the dumbbells under control.',
              'Get a deep chest stretch at the bottom.',
              'Press up and slightly inward.',
              'Do not turn it into a shoulder press.',
              'Last set should be very hard, but avoid ugly reps.',
            ],
            setTargets: ['8–10 reps', '6–8 reps', '6–8 reps'],
            failureRule: 'Stop with 1 rep left on most sets. Final set can reach 0–1 reps from failure.',
            addWeightWhen: 'You can hit 10, 8, 8 cleanly.',
            muscleGroups: ['Chest'],
          },
          {
            id: 'pa-2',
            name: 'Barbell Bench Press',
            sets: 3,
            reps: '6–10',
            rest: '2–3 min',
            purpose: 'Heavy chest strength and thickness movement.',
            executionNotes: [
              'Use controlled reps, not ego lifting.',
              'Keep chest high and shoulder blades stable.',
              'Lower the bar with control.',
              'Press powerfully while keeping tension on the chest.',
              'Stop the set when form starts breaking down.',
            ],
            setTargets: ['8 reps', '6–8 reps', '6 reps'],
            failureRule: 'Stop with 1–2 reps left. Do not fail bench press without a spotter.',
            addWeightWhen: 'You can hit 8, 8, 8 cleanly.',
            muscleGroups: ['Chest'],
          },
          {
            id: 'pa-3',
            name: 'Pec Deck',
            sets: 2,
            reps: '12–15',
            rest: '60–90s',
            purpose: 'Stable chest isolation with strong stretch and squeeze.',
            executionNotes: [
              'Let the chest stretch fully at the open position.',
              'Keep elbows slightly bent and fixed.',
              'Squeeze hard at the contraction.',
              'Do not use momentum.',
              'Final set can be taken to failure.',
            ],
            setTargets: ['15 reps', '12–15 reps'],
            failureRule: 'Final set can go to true failure.',
            addWeightWhen: 'You can hit 15 and 15 with a strong squeeze.',
            muscleGroups: ['Chest'],
          },
        ],
      },
      {
        title: 'Chest Superset',
        supersetGroup: 'pa-ss-chest',
        supersetInstructions: 'Low-to-High Cable Fly → immediately Push-Up → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'pa-4a',
            name: 'Low-to-High Cable Fly',
            sets: 2,
            reps: '12–15',
            rest: '0s (superset)',
            purpose: 'Upper-chest focused cable fly used as the first part of the chest superset.',
            executionNotes: [
              'Set the cables low.',
              'Bring the handles upward and inward toward upper-chest/face height.',
              'Keep a slight bend in the elbows.',
              'Think about bringing the biceps together, not just the hands.',
              'Use clean reps and avoid going too heavy.',
            ],
            setTargets: ['15 reps', '12–15 reps'],
            failureRule: 'Go very close to failure, but keep the motion clean.',
            addWeightWhen: 'You can hit 15 and 15 without swinging.',
            muscleGroups: ['Chest'],
            supersetPosition: 'A',
          },
          {
            id: 'pa-4b',
            name: 'Push-Up',
            sets: 2,
            reps: 'Near failure',
            rest: '90s',
            purpose: 'Chest finisher after the low-to-high cable fly.',
            executionNotes: [
              'Keep the body tight.',
              'Use a controlled lowering phase.',
              'Push through the chest.',
              'Stop when reps become sloppy.',
            ],
            setTargets: ['Near failure', 'Near failure'],
            failureRule: 'Stop 1 rep before form collapses.',
            addWeightWhen: 'Progress by adding slower reps or a weighted push-up later.',
            muscleGroups: ['Chest'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Shoulders',
        exercises: [
          {
            id: 'pa-5',
            name: 'Dumbbell Lateral Raise',
            sets: 3,
            reps: '12–20',
            rest: '60–90s',
            purpose: 'Side delt work for shoulder width without overloading Push A.',
            executionNotes: [
              'Slight lean forward.',
              'Lead with the elbows.',
              'Do not shrug.',
              'Raise to shoulder height or slightly above.',
              'Control the negative.',
              'Optional: last set drop set.',
            ],
            setTargets: ['15–20 reps', '12–15 reps', '12–15 reps + optional drop set'],
            failureRule: 'Final set can go to failure. Drop set allowed.',
            addWeightWhen: 'You can hit 20, 15, 15 cleanly.',
            muscleGroups: ['Shoulders'],
          },
        ],
      },
      {
        title: 'Triceps',
        exercises: [
          {
            id: 'pa-6',
            name: 'Rope Triceps Pushdown',
            sets: 3,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Standalone triceps movement with strong contraction.',
            executionNotes: [
              'Keep elbows locked by your sides.',
              'Push down and spread the rope slightly at the bottom.',
              'Squeeze the triceps hard.',
              'Control the rope back up.',
              'Avoid swinging your torso.',
            ],
            setTargets: ['15 reps', '12–15 reps', '10–12 reps'],
            failureRule: 'Final set can go to failure.',
            addWeightWhen: 'You can hit 15, 15, 12 with full lockout.',
            muscleGroups: ['Triceps'],
          },
        ],
      },
      {
        title: 'Triceps Superset',
        supersetGroup: 'pa-ss-tri',
        supersetInstructions: 'Underhand Grip Cable Pushdown → immediately Machine/Assisted Dip → rest 90–120 seconds → repeat.',
        exercises: [
          {
            id: 'pb-7',
            name: 'Underhand Grip Pushdown',
            sets: 3,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Triceps growth with medial-head emphasis from the supinated grip.',
            executionNotes: [
              'Use a straight bar with palms facing up.',
              'Keep elbows pinned tight to your sides.',
              'Push down until arms fully lock out.',
              'Squeeze the triceps hard at the bottom.',
              'Control the bar back up without letting elbows drift forward.',
              'Avoid swinging the torso.',
            ],
            setTargets: ['12–15 reps', '10–12 reps', '10 reps'],
            failureRule: 'Final set can go close to failure.',
            addWeightWhen: 'You can hit 15, 12, 12 with full lockout.',
            muscleGroups: ['Triceps'],
          },
          {
            id: 'pa-7b',
            name: 'Machine Dip or Assisted Dip',
            sets: 2,
            reps: '8–12',
            rest: '90–120s',
            purpose: 'Triceps-biased pressing finisher.',
            executionNotes: [
              'Keep torso more upright to bias triceps.',
              'Do not flare elbows too wide.',
              'Control the bottom position.',
              'Press hard through the triceps.',
            ],
            setTargets: ['10–12 reps', '8–10 reps'],
            failureRule: 'Stop when pressing form breaks. Do not grind ugly reps.',
            addWeightWhen: 'You can hit 12 and 12 cleanly.',
            muscleGroups: ['Triceps'],
            supersetPosition: 'B',
          },
        ],
      },
    ],
    volume: [
      { group: 'Chest', sets: 12 },
      { group: 'Shoulders', sets: 3 },
      { group: 'Triceps', sets: 7 },
    ],
    loadingRules: 'Use the first set of each exercise to lock in form and feel the target muscle. The final set is usually the hardest set. For heavy pressing movements: train hard, but stop before form breaks. For machines, cables, and isolation work: you can safely push closer to failure.',
    weightSelectionRules: [
      'Heavy Presses: For Incline Dumbbell Press and Barbell Bench Press, choose a weight that makes the target rep range challenging while still allowing clean form.',
      'Pattern: Set 1 strong but controlled · Set 2 heavier/harder · Set 3 hardest set.',
      'You can use the same weight across all sets or slightly increase after the first set if you feel strong.',
      'Do not chase failure on bench press. Chest growth comes from hard clean reps, not getting pinned under the bar.',
      'Isolation: Pec Deck, Cable Fly, Lateral Raise, Pushdown, Cable Extension — use a weight that lets you fully control the negative and feel the target muscle.',
      'Push harder on: pec deck final set (true failure), lateral raise final set (failure + optional drop), rope pushdown final set (true failure), cable fly (close to failure but never sloppy), overhead extension (close to failure with stable elbows).',
    ],
    progressionRules: 'Add weight only when you own the top of the rep range with clean form.',
    coachingNotes: [
      'Chest is the clear priority of this day.',
      'Shoulders are intentionally limited to 3 lateral raise sets because Push B will be shoulder-focused.',
      'Triceps are trained with one standalone exercise and one superset.',
      'Low-to-high cable fly is used because pec deck already covers the mid-chest fly pattern.',
      'Heavy presses should be loaded progressively, but not taken to unsafe failure.',
      'Isolation exercises are where you can chase failure and pump safely.',
      'Final sets matter most, but only if the earlier sets are controlled and intentional.',
      'Keep reps controlled and avoid ego lifting.',
    ],
  },

  'pull': {
    id: 'pull',
    name: 'Pull',
    focus: {
      primary: 'Back and rear delts',
      secondary: 'Biceps',
      smallDose: 'Forearms',
    },
    description: 'Pull is a repeatable back-priority day. The goal is to build back thickness, lat width, rear-delt roundness, and arm size without making the session unnecessarily long.',
    sections: [
      {
        title: 'Back / Rear Delts',
        exercises: [
          {
            id: 'pl-1',
            name: 'Chest-Supported Row',
            sets: 3,
            reps: '6–10',
            rest: '2–3 min',
            purpose: 'Main heavy back thickness movement.',
            executionNotes: [
              'Keep chest fixed against the pad.',
              'Pull elbows back, not hands.',
              'Control the stretch at the bottom.',
              'Squeeze the mid-back at the top.',
              'Do not turn it into a lower-back or trap movement.',
              'Use straps if grip starts limiting your back work.',
            ],
            setTargets: ['8–10 reps', '6–8 reps', '6–8 reps'],
            failureRule: 'Stop with 1 rep left. Final set can reach 0–1 reps from failure if form stays strict.',
            addWeightWhen: 'You can hit 10, 8, 8 cleanly.',
            muscleGroups: ['Back'],
          },
          {
            id: 'pl-2',
            name: 'Lat Pulldown',
            sets: 3,
            reps: '8–12',
            rest: '2 min',
            purpose: 'Main vertical pull for lats and width.',
            executionNotes: [
              'Use a neutral or slightly wide grip.',
              'Let the lats stretch fully at the top.',
              'Drive elbows down toward your ribs.',
              'Keep chest slightly up.',
              'Avoid leaning too far back.',
              'Do not use momentum.',
            ],
            setTargets: ['10–12 reps', '8–10 reps', '8 reps'],
            failureRule: 'Stop with 1 rep left. Do not swing or lean back excessively.',
            addWeightWhen: 'You can hit 12, 10, 10 cleanly.',
            muscleGroups: ['Back'],
          },
          {
            id: 'pl-3',
            name: 'Seated Cable Row',
            sets: 2,
            reps: '10–12',
            rest: '90s',
            purpose: 'Controlled back volume with a strong stretch and squeeze.',
            executionNotes: [
              'Use a medium or neutral grip if available.',
              'Let the shoulder blades move forward slightly for the stretch.',
              'Pull back under control.',
              'Pause briefly at the squeezed position.',
              'Avoid jerking the weight.',
            ],
            setTargets: ['12 reps', '10–12 reps'],
            failureRule: 'Go close to failure, but keep the squeeze controlled.',
            addWeightWhen: 'You can hit 12 and 12 with clean pauses.',
            muscleGroups: ['Back'],
          },
        ],
      },
      {
        title: 'Back/Rear-Delt Superset',
        supersetGroup: 'pl-ss-back',
        supersetInstructions: 'Straight-Arm Cable Pulldown → immediately Reverse Pec Deck → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'pl-4a',
            name: 'Straight-Arm Cable Pulldown',
            sets: 2,
            reps: '12–15',
            rest: '0s (superset)',
            purpose: 'Lat isolation without biceps taking over.',
            executionNotes: [
              'Keep arms mostly straight with a slight elbow bend.',
              'Start with the lats stretched overhead.',
              'Pull the cable down toward your thighs.',
              'Squeeze the lats at the bottom.',
              'Do not turn this into a triceps pushdown.',
            ],
            setTargets: ['15 reps', '12–15 reps'],
            failureRule: 'Go close to failure while keeping arms controlled.',
            addWeightWhen: 'You can hit 15 and 15 without turning it into a pushdown.',
            muscleGroups: ['Back'],
            supersetPosition: 'A',
          },
          {
            id: 'pl-4b',
            name: 'Reverse Pec Deck',
            sets: 2,
            reps: '12–20',
            rest: '90s',
            purpose: 'Rear-delt work included inside the back section.',
            executionNotes: [
              'Keep chest against the pad.',
              'Let shoulders sit slightly forward.',
              'Think about creating a wide circle with your arms.',
              'Pull through the rear delts, not the traps.',
              'Control the return.',
              'Final set can be pushed very hard.',
            ],
            setTargets: ['15–20 reps', '12–15 reps'],
            failureRule: 'Final set can go to true failure.',
            addWeightWhen: 'You can hit 20 and 15 cleanly.',
            muscleGroups: ['Rear Delts'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Biceps',
        exercises: [
          {
            id: 'pl-5',
            name: 'Machine Preacher Curl',
            sets: 3,
            reps: '8–12',
            rest: '60–90s',
            purpose: 'Main strict biceps movement with stable tension.',
            executionNotes: [
              'Adjust the seat so your upper arm is fully supported.',
              'Lower slowly into the stretched position.',
              'Pause briefly at the bottom without relaxing completely.',
              'Curl up under control.',
              'Squeeze hard at the top.',
              'Do not let your shoulders roll forward to cheat the rep.',
            ],
            setTargets: ['10–12 reps', '8–10 reps', '8 reps'],
            failureRule: 'Final set can go to true failure if elbows stay controlled.',
            addWeightWhen: 'You can hit 12, 10, 10 cleanly.',
            muscleGroups: ['Biceps'],
          },
        ],
      },
      {
        title: 'Biceps Superset',
        supersetGroup: 'pl-ss-bi',
        supersetInstructions: 'Cable Curl with Elbow Slightly Behind Body → immediately Hammer Curl → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'pl-6a',
            name: 'Cable Curl (Elbow Slightly Behind Body)',
            sets: 2,
            reps: '10–15',
            rest: '0s (superset)',
            purpose: 'Stretched-position biceps work.',
            executionNotes: [
              'Set cable low.',
              'Stand slightly in front of the cable so the elbow sits a little behind the body.',
              'Keep elbows fixed.',
              'Curl without swinging.',
              'Squeeze at the top and control the negative.',
            ],
            setTargets: ['12–15 reps', '10–12 reps'],
            failureRule: 'Go close to failure with strict elbow position.',
            addWeightWhen: 'You can hit 15 and 12 cleanly.',
            muscleGroups: ['Biceps'],
            supersetPosition: 'A',
          },
          {
            id: 'pl-6b',
            name: 'Hammer Curl',
            sets: 2,
            reps: '10–12',
            rest: '90s',
            purpose: 'Brachialis, biceps thickness, and forearm support.',
            executionNotes: [
              'Use dumbbells or a rope cable attachment.',
              'Keep wrists neutral.',
              'Curl without swinging.',
              'Control the lower half of the rep.',
              'Stop when form gets sloppy.',
            ],
            setTargets: ['10–12 reps', '8–10 reps'],
            failureRule: 'Stop when swinging starts. Do not cheat.',
            addWeightWhen: 'You can hit 12 and 12 cleanly.',
            muscleGroups: ['Biceps', 'Forearms/Brachialis'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Forearms',
        exercises: [
          {
            id: 'pl-7',
            name: 'Cable Reverse Curl or EZ-Bar Reverse Curl',
            sets: 3,
            reps: '12–15',
            rest: '60–90s',
            purpose: 'Forearms, brachialis, and arm thickness.',
            executionNotes: [
              'Use a pronated grip, palms facing down.',
              'Keep elbows close to the body.',
              'Curl under control.',
              'Do not swing.',
              'Lower slowly.',
              'Choose cable reverse curls if available because the tension is smoother.',
            ],
            setTargets: ['15 reps', '12–15 reps', '12 reps'],
            failureRule: 'Final set can go close to failure.',
            addWeightWhen: 'You can hit 15, 15, 12 cleanly.',
            muscleGroups: ['Forearms/Brachialis'],
          },
        ],
      },
    ],
    volume: [
      { group: 'Back', sets: 10 },
      { group: 'Rear Delts', sets: 2 },
      { group: 'Biceps', sets: 7 },
      { group: 'Forearms/Brachialis', sets: 5 },
    ],
    loadingRules: 'The heavy back exercises should be trained hard, but with clean form and controlled reps. Do not use momentum just to move more weight. For curls, rear delts, and forearms, you can push closer to failure because the risk is lower and the target muscles respond well to hard, controlled sets.',
    weightSelectionRules: [
      'Heavy Back: For Chest-Supported Row and Lat Pulldown, choose weights that let you feel the target muscles, not just move the stack.',
      'Pattern: Set 1 controlled, strong, clean · Set 2 harder · Set 3 hardest set.',
      'Do not sacrifice range of motion, stretch, or squeeze just to add weight.',
      'Back Isolation/Rear Delts: Straight-Arm Cable Pulldown should feel mostly in the lats. Reverse Pec Deck should feel mostly in the rear delts. If traps or arms dominate, reduce weight.',
      'Biceps/Forearms: Preacher curl — deep stretch, controlled curl, no shoulder cheating. Cable curl — elbow stays slightly behind the body. Hammer curl — no swinging. Reverse curl — wrists stay strong and controlled.',
    ],
    progressionRules: 'Add weight only when you can reach the top targets with clean form.',
    coachingNotes: [
      'Pull is a back-priority day, but biceps and forearms still get meaningful work.',
      'Rear delts are included inside the back section through the reverse pec deck superset.',
      'Chest-supported row is used instead of bent-over barbell row to load the back hard without lower-back fatigue becoming the limiter.',
      'The back superset pairs lat isolation with rear-delt isolation, so it adds quality volume without interfering with the heavy back work.',
      'The biceps superset pairs stretched-position cable curls with hammer curls for arm thickness.',
      'Forearms are included directly with reverse curls, but the total volume stays controlled.',
      'Use straps on heavy back work if grip limits your back. Forearms are trained later; do not let grip weakness ruin back sets.',
      'Heavy pulls should be hard but clean.',
      'Curls, rear delts, and forearms can be pushed closer to failure.',
    ],
  },

  'legs': {
    id: 'legs',
    name: 'Legs',
    focus: {
      primary: 'Quads and overall leg size',
      secondary: 'Hamstrings, glutes, adductors, abductors, calves',
      smallDose: 'Abs',
    },
    description: 'Legs is designed to be simple, stable, and easy to overload over time. Since legs are currently a weaker area, this day avoids highly technical barbell lifts for now and focuses on machine-based movements that let you train hard with good control. The goal is to build leg size, confidence, and strength.',
    sections: [
      {
        title: 'Quads / Main Leg Work',
        exercises: [
          {
            id: 'lg-1',
            name: 'Hack Squat or Smith Machine Squat',
            alternatives: 'Preferred: Hack squat. Second: Smith machine squat. Third: Leg press.',
            sets: 3,
            reps: '8–12',
            rest: '2–3 min',
            purpose: 'Main leg movement for quad size and overall lower-body strength.',
            executionNotes: [
              'Use a controlled descent.',
              'Go as deep as you can while keeping tension and control.',
              'Keep your feet stable and planted.',
              'Push through the whole foot, not only the toes.',
              'Do not bounce out of the bottom.',
              'Stop the set when form starts breaking down.',
            ],
            setTargets: ['10–12 reps', '8–10 reps', '8 reps'],
            failureRule: 'Stop with 1–2 reps left. Do not fail this movement.',
            addWeightWhen: 'You can hit 12, 10, 10 cleanly.',
            muscleGroups: ['Quads'],
          },
          {
            id: 'lg-2',
            name: 'Leg Press',
            sets: 3,
            reps: '10–15',
            rest: '2–3 min',
            purpose: 'Main overloadable leg volume after the hack squat or Smith squat.',
            executionNotes: [
              'Use a deep but controlled range of motion.',
              'Do not half-rep the movement.',
              'Keep your lower back locked into the pad.',
              'Control the negative.',
              'Drive the platform up powerfully without locking out aggressively.',
              'Keep constant tension on the legs.',
            ],
            setTargets: ['12–15 reps', '10–12 reps', '10 reps'],
            failureRule: 'Stop with 1 rep left. No ugly grinder reps.',
            addWeightWhen: 'You can hit 15, 12, 12 with full depth.',
            muscleGroups: ['Quads'],
          },
          {
            id: 'lg-3',
            name: 'Leg Extension',
            sets: 3,
            reps: '12–15',
            rest: '60–90s',
            purpose: 'Quad isolation and controlled high-tension work.',
            executionNotes: [
              'Adjust the machine so your knees line up with the pivot point.',
              'Lift under control.',
              'Squeeze the quads hard at the top.',
              'Lower slowly.',
              'Do not swing the weight.',
              'Final set can be pushed to failure.',
            ],
            setTargets: ['15 reps', '12–15 reps', '12 reps'],
            failureRule: 'Final set can go to true failure.',
            addWeightWhen: 'You can hit 15, 15, 12 with a hard squeeze.',
            muscleGroups: ['Quads'],
          },
        ],
      },
      {
        title: 'Hamstrings',
        exercises: [
          {
            id: 'lg-4',
            name: 'Seated or Lying Leg Curl',
            alternatives: 'Preferred: Seated leg curl.',
            sets: 3,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Hamstring growth without needing Romanian deadlifts yet.',
            executionNotes: [
              'Keep hips planted against the pad.',
              'Curl the weight under control.',
              'Squeeze the hamstrings at the bottom.',
              'Control the stretch on the way back.',
              'Do not let the weight slam into the stack.',
              'Final set can go close to failure.',
            ],
            setTargets: ['12–15 reps', '10–12 reps', '10 reps'],
            failureRule: 'Final set can go close to failure.',
            addWeightWhen: 'You can hit 15, 12, 12 cleanly.',
            muscleGroups: ['Hamstrings'],
          },
        ],
      },
      {
        title: 'Leg Superset',
        supersetGroup: 'lg-ss',
        supersetInstructions: 'Hip Adductor Machine → immediately Hip Abductor Machine → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'lg-5a',
            name: 'Hip Adductor Machine',
            sets: 2,
            reps: '12–20',
            rest: '0s (superset)',
            purpose: 'Inner-thigh/adductor work for thicker, more complete legs.',
            executionNotes: [
              'Sit tall and keep the hips stable.',
              'Bring the legs together under control.',
              'Squeeze the inner thighs hard.',
              'Return slowly to the stretched position.',
              'Do not bounce the reps.',
            ],
            setTargets: ['15–20 reps', '12–15 reps'],
            failureRule: 'Go close to failure with control.',
            addWeightWhen: 'You can hit 20 and 15 cleanly.',
            muscleGroups: ['Adductors'],
            supersetPosition: 'A',
          },
          {
            id: 'lg-5b',
            name: 'Hip Abductor Machine',
            sets: 2,
            reps: '12–20',
            rest: '90s',
            purpose: 'Outer hip/glute medius work for leg balance and hip stability.',
            executionNotes: [
              'Sit tall and stay controlled.',
              'Push the knees outward using the outer hips/glutes.',
              'Pause briefly at the open position.',
              'Return slowly.',
              'Do not use momentum.',
            ],
            setTargets: ['15–20 reps', '12–15 reps'],
            failureRule: 'Go close to failure with control.',
            addWeightWhen: 'You can hit 20 and 15 cleanly.',
            muscleGroups: ['Abductors/Outer Glutes'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Calves',
        exercises: [
          {
            id: 'lg-6',
            name: 'Seated or Standing Calf Raise',
            sets: 4,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Direct calf growth.',
            executionNotes: [
              'Get a full stretch at the bottom.',
              'Pause briefly in the stretched position.',
              'Raise up fully onto the toes.',
              'Squeeze hard at the top.',
              'Lower slowly.',
              'Do not bounce.',
            ],
            setTargets: ['12–15 reps', '10–12 reps', '10–12 reps', '10 reps'],
            failureRule: 'Final set can go to failure if reps stay controlled.',
            addWeightWhen: 'You can hit 15, 12, 12, 12 with full stretch.',
            muscleGroups: ['Calves'],
          },
        ],
      },
      {
        title: 'Abs',
        exercises: [
          {
            id: 'lg-7',
            name: 'Machine Crunch',
            sets: 2,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Simple direct ab work without making abs a major focus during the bulk.',
            executionNotes: [
              'Curl the torso down using the abs.',
              'Do not just pull with the arms.',
              'Control the stretch at the top.',
              'Squeeze the abs at the bottom.',
              'Keep reps controlled.',
            ],
            setTargets: ['12–15 reps', '10–12 reps'],
            failureRule: 'Go close to failure while keeping abs in control.',
            addWeightWhen: 'You can hit 15 and 15 cleanly.',
            muscleGroups: ['Abs'],
          },
        ],
      },
    ],
    volume: [
      { group: 'Quads', sets: 9 },
      { group: 'Hamstrings', sets: 3 },
      { group: 'Adductors', sets: 2 },
      { group: 'Abductors/Outer Glutes', sets: 2 },
      { group: 'Calves', sets: 4 },
      { group: 'Abs', sets: 2 },
    ],
    loadingRules: 'Leg day should be hard, but controlled. Since legs are currently a weaker area, the priority is clean reps, full range of motion, and progressive overload over time. Do not turn the first 8 weeks into a max-effort ego lifting phase.',
    weightSelectionRules: [
      'Main Leg Movements: For Hack Squat / Smith Machine Squat and Leg Press, choose weights that challenge your legs without compromising range of motion.',
      'Pattern: Set 1 controlled and confident · Set 2 harder · Set 3 hardest clean set.',
      'Do not add weight if depth gets worse, knees feel bad, or reps become unstable.',
      'Isolation: Leg Extension final set can go to failure. Leg curl final set close to failure. Adductor/abductor — close to failure, no bouncing. Calf raise — final set can go to failure if full stretch and control stay intact. Machine crunch — close to failure, not sloppy.',
    ],
    progressionRules: 'Add weight only when you can reach the top targets with clean form.',
    coachingNotes: [
      'Legs are currently a weaker area, so this day is built around stable, easy-to-progress movements.',
      'Hack squat or Smith machine squat is used instead of free barbell squat during this first 8-week block.',
      'Leg press provides extra overloadable leg volume without needing complex technique.',
      'Leg extension gives direct quad work and can safely be pushed hard.',
      'Leg curl covers hamstrings without introducing heavy Romanian deadlifts yet.',
      'The adductor/abductor superset is beginner-friendly, stable, and useful for more complete leg development.',
      'Calves are trained directly with 4 sets because they need specific work.',
      'Abs are included with one simple machine crunch movement only.',
      'Do not rush leg progression. Add weight only when reps are deep, controlled, and stable.',
      'The goal is to make legs stronger and bigger while building confidence for harder movements later.',
    ],
  },

  'push-b': {
    id: 'push-b',
    name: 'Push B',
    focus: {
      primary: 'Shoulders',
      secondary: 'Chest',
      smallDose: 'Triceps and neck',
    },
    description: 'Push B is the shoulder-priority push day. Push A is chest-focused; Push B is built around shoulder width, shoulder pressing strength, upper-chest maintenance, triceps work, and a small amount of neck training.',
    sections: [
      {
        title: 'Shoulders',
        exercises: [
          {
            id: 'pb-1',
            name: 'Single-Arm Cable Lateral Raise',
            sets: 3,
            reps: '12–20',
            rest: '60–90s',
            purpose: 'Main side-delt isolation for shoulder width. Lateral cable raises preferred over front cable raises — front delts already get enough from pressing.',
            executionNotes: [
              'Set the cable low.',
              'Stand slightly away from the cable stack.',
              'Let the arm cross slightly in front of the body at the bottom for a stretch.',
              'Raise out to the side with the elbow leading.',
              'Keep traps relaxed.',
              'Control the negative.',
              'Do not swing.',
            ],
            setTargets: ['15–20 reps', '12–15 reps', '12 reps'],
            failureRule: 'Final set can go to failure if form stays strict.',
            addWeightWhen: 'You can hit 20, 15, 15 without swinging.',
            muscleGroups: ['Shoulders'],
          },
          {
            id: 'pb-2',
            name: 'Machine Shoulder Press',
            sets: 3,
            reps: '6–10',
            rest: '2–3 min',
            purpose: 'Main heavy shoulder pressing movement for strength and size.',
            executionNotes: [
              'Adjust the seat so the handles start around shoulder level.',
              'Keep the back supported.',
              'Press up powerfully without fully relaxing at the top.',
              'Lower under control.',
              'Keep tension on the delts.',
              'Stop if the shoulders feel pinchy or unstable.',
            ],
            setTargets: ['8–10 reps', '6–8 reps', '6–8 reps'],
            failureRule: 'Stop with 1 rep left. Avoid ugly grinders.',
            addWeightWhen: 'You can hit 10, 8, 8 cleanly.',
            muscleGroups: ['Shoulders'],
          },
          {
            id: 'pb-3',
            name: 'Face Pull',
            sets: 3,
            reps: '12–20',
            rest: '60–90s',
            purpose: 'Rear delts, upper back, shoulder balance, and shoulder health.',
            executionNotes: [
              'Set the cable around upper-chest to face height.',
              'Pull toward the face while spreading the rope.',
              'Keep elbows high.',
              'Squeeze rear delts and upper back.',
              'Do not turn it into a heavy row.',
              'Use clean, controlled reps.',
            ],
            setTargets: ['15–20 reps', '12–15 reps', '12 reps'],
            failureRule: 'Go close to failure, but keep it controlled.',
            addWeightWhen: 'You can hit 20, 15, 15 with clean rear-delt control.',
            muscleGroups: ['Shoulders'],
          },
        ],
      },
      {
        title: 'Shoulder Superset',
        supersetGroup: 'pb-ss-shoulder',
        supersetInstructions: 'Dumbbell Arnold Press → immediately Cable Front Raise → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'pb-4a',
            name: 'Dumbbell Arnold Press',
            sets: 2,
            reps: '8–12',
            rest: '0s (superset)',
            purpose: 'Shoulder finisher hitting front and side delts through a controlled pressing pattern.',
            executionNotes: [
              'Use moderate weight, not maximal.',
              'Start with palms facing you.',
              'Rotate as you press overhead.',
              'Control the descent.',
              'Keep reps smooth and strict.',
              'Do not grind ugly reps here because it is part of a superset.',
            ],
            setTargets: ['10–12 reps', '8–10 reps'],
            failureRule: 'Stop with 1–2 reps left because it is in a superset.',
            addWeightWhen: 'You can hit 12 and 10 cleanly.',
            muscleGroups: ['Shoulders'],
            supersetPosition: 'A',
          },
          {
            id: 'pb-4b',
            name: 'Cable Front Raise',
            sets: 2,
            reps: '12–20',
            rest: '90s',
            purpose: 'Second part of the shoulder superset, controlled front-delt work after Arnold pressing.',
            executionNotes: [
              'Set the cable low.',
              'Use a straight bar, rope, or single handle depending on comfort.',
              'Raise the cable forward to around shoulder height.',
              'Keep the movement controlled.',
              'Do not swing your torso.',
              'Stop if the front of the shoulder feels pinchy.',
            ],
            setTargets: ['15–20 reps', '12–15 reps'],
            failureRule: 'Go close to failure with clean form, but stop if shoulders feel pinchy.',
            addWeightWhen: 'You can hit 20 and 15 cleanly.',
            muscleGroups: ['Shoulders'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Chest',
        exercises: [
          {
            id: 'pb-5',
            name: 'Incline Machine Press',
            sets: 3,
            reps: '8–12',
            rest: '2 min',
            purpose: 'Upper-chest work without making Push B another full chest-priority day.',
            executionNotes: [
              'Keep chest high and shoulders stable.',
              'Lower under control.',
              'Feel the upper chest stretch.',
              'Press without locking out aggressively.',
              'Do not let shoulders take over.',
            ],
            setTargets: ['10–12 reps', '8–10 reps', '8 reps'],
            failureRule: 'Stop with 1 rep left. Final set can be very hard.',
            addWeightWhen: 'You can hit 12, 10, 10 cleanly.',
            muscleGroups: ['Chest'],
          },
        ],
      },
      {
        title: 'Chest Superset',
        supersetGroup: 'pb-ss-chest',
        supersetInstructions: 'High-to-Low Cable Fly → immediately Push-Up → rest 90 seconds → repeat.',
        exercises: [
          {
            id: 'pb-6a',
            name: 'High-to-Low Cable Fly',
            sets: 2,
            reps: '12–15',
            rest: '0s (superset)',
            purpose: 'Chest isolation from a different angle than Push A.',
            executionNotes: [
              'Set the cables high.',
              'Bring the handles downward and inward.',
              'Keep a slight bend in the elbows.',
              'Squeeze the chest at the bottom.',
              'Control the stretch on the way back up.',
              'Avoid going too heavy.',
            ],
            setTargets: ['15 reps', '12–15 reps'],
            failureRule: 'Go close to failure without swinging.',
            addWeightWhen: 'You can hit 15 and 15 cleanly.',
            muscleGroups: ['Chest'],
            supersetPosition: 'A',
          },
          {
            id: 'pb-6b',
            name: 'Push-Up',
            sets: 2,
            reps: 'Near failure',
            rest: '90s',
            purpose: 'Chest finisher after high-to-low cable fly.',
            executionNotes: [
              'Keep the body tight.',
              'Lower under control.',
              'Push through the chest.',
              'Stop when reps become sloppy.',
            ],
            setTargets: ['Near failure', 'Near failure'],
            failureRule: 'Stop 1 rep before form collapses.',
            addWeightWhen: 'Progress with slower reps or weighted push-ups later.',
            muscleGroups: ['Chest'],
            supersetPosition: 'B',
          },
        ],
      },
      {
        title: 'Triceps',
        exercises: [
          {
            id: 'pb-7',
            name: 'Overhead Cable Triceps Extension',
            sets: 3,
            reps: '10–15',
            rest: '60–90s',
            purpose: 'Long-head triceps growth through the stretched position.',
            executionNotes: [
              'Let the triceps stretch fully overhead.',
              'Keep elbows stable.',
              'Extend under control.',
              'Squeeze at lockout.',
              'Do not let the elbows flare wildly.',
              'Final set can go close to failure.',
            ],
            setTargets: ['12–15 reps', '10–12 reps', '10 reps'],
            failureRule: 'Final set can go close to failure.',
            addWeightWhen: 'You can hit 15, 12, 12 cleanly.',
            muscleGroups: ['Triceps'],
          },
        ],
      },
      {
        title: 'Neck',
        exercises: [
          {
            id: 'pb-8',
            name: 'Plate Neck Flexion or Cable Neck Flexion',
            sets: 2,
            reps: '15–25',
            rest: '45–75s',
            purpose: 'Light direct neck work for gradual neck thickness.',
            executionNotes: [
              'Use very light weight.',
              'Move slowly.',
              'Control every rep.',
              'Do not jerk the neck.',
              'Stop immediately if you feel pain, nerve symptoms, or dizziness.',
              'Neck work should feel controlled, not aggressive.',
            ],
            setTargets: ['20–25 reps', '15–20 reps'],
            failureRule: 'Never go to aggressive failure. Stop with control.',
            addWeightWhen: 'You can hit 25 and 20 smoothly with no discomfort.',
            muscleGroups: ['Neck'],
          },
        ],
      },
    ],
    volume: [
      { group: 'Shoulders', sets: 13 },
      { group: 'Chest', sets: 5 },
      { group: 'Triceps', sets: 3 },
      { group: 'Neck', sets: 2 },
    ],
    loadingRules: 'Push B is shoulder-focused, but the shoulders are sensitive. Train hard, but do not chase ugly reps on presses. Use controlled reps and push isolation movements closer to failure.',
    weightSelectionRules: [
      'Shoulder Pressing: Machine Shoulder Press and Arnold Press — use weights that let you press smoothly and safely. Do not sacrifice shoulder comfort for load.',
      'Lateral Raises and Face Pulls: choose weights that allow strict control. If traps take over, reduce weight. If you have to swing, reduce weight.',
      'Chest: Incline Machine Press — controlled weight that lets you feel the upper chest despite shoulders being tired. High-to-Low Fly — lighter weight, focus on squeeze.',
      'Triceps: Overhead Extension — weight that gives a deep stretch without elbow pain.',
      'Neck: Start extremely light. Progress slowly. More weight is not better if control is lost.',
    ],
    progressionRules: 'Add weight only when you can reach the top targets with clean form.',
    coachingNotes: [
      'Push B is shoulder-priority, while Push A is chest-priority.',
      'Lateral cable raises chosen over front cable raises because side delts matter more for shoulder width and front delts already receive a lot of pressing volume.',
      'Machine shoulder press is used as the main heavy shoulder movement because it is easier and safer to overload than free-weight pressing during this block.',
      'Face pulls give rear-delt and shoulder-balance work without needing a separate rear-delt isolation block.',
      'Shoulder superset uses Arnold press + cable front raise to add controlled front-delt work without repeating laterals.',
      'Chest is still trained, but with less volume than Push A.',
      'High-to-low cable fly is used on Push B to create variety from Push A\u2019s low-to-high fly.',
      'Triceps get one focused long-head movement because Push A already has heavier triceps volume.',
      'Neck work is intentionally light and controlled. Do not rush neck progression.',
    ],
  },

  'rest': {
    id: 'rest',
    name: 'Rest',
    isRest: true,
    description: 'Recovery day. No active workout logging. Sleep, eat, hydrate. Your muscles grow on rest days, not in the gym.',
  },
};

const WORKOUT_IDS = ['push-a', 'pull', 'legs', 'push-b'];

// ============================================================================
// HELPERS
// ============================================================================
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTimer = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

// Get all exercises for a workout (flattened from sections)
const getAllExercises = (workout) => {
  if (!workout || !workout.sections) return [];
  const out = [];
  workout.sections.forEach((sec) => {
    sec.exercises.forEach((ex) => {
      out.push({ ...ex, sectionTitle: sec.title, supersetGroup: sec.supersetGroup });
    });
  });
  return out;
};

// PR detection: best (weight × reps) per exercise NAME across history
const getPRs = (history) => {
  const prs = {};
  history.forEach((wk) => {
    if (!wk.exercises) return;
    wk.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (!s.done) return;
        const cur = prs[ex.name];
        if (!cur || s.w > cur.w || (s.w === cur.w && s.r > cur.r)) {
          prs[ex.name] = { w: s.w, r: s.r, date: wk.date, muscleGroups: ex.muscleGroups || [] };
        }
      });
    });
  });
  return prs;
};

// Streak: count consecutive days where a workout was logged (rest days allowed in gaps up to 1 day)
const getStreak = (history) => {
  if (!history.length) return 0;
  const dates = new Set(history.map((w) => w.date));
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  if (!dates.has(todayStr) && !dates.has(yStr)) return 0;
  let cursor = dates.has(todayStr) ? new Date() : yesterday;
  let streak = 0;
  let gap = 0;
  for (let i = 0; i < 60; i++) {
    const ds = cursor.toISOString().split('T')[0];
    if (dates.has(ds)) { streak++; gap = 0; }
    else { gap++; if (gap > 1) break; }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const getThisWeekCount = (history) => {
  const now = new Date();
  const monday = new Date(now);
  const day = monday.getDay();
  const diff = day === 0 ? 6 : day - 1;
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return history.filter((w) => new Date(w.date) >= monday).length;
};

// Last performance per exercise name
const findPrevious = (history, exerciseName) => {
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const wk of sorted) {
    if (!wk.exercises) continue;
    const ex = wk.exercises.find((e) => e.name === exerciseName);
    if (ex) return ex.sets.filter((s) => s.done);
  }
  return null;
};

// Weekly volume by muscle group from history
const getWeeklyVolumeByMuscle = (history, days = 7) => {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  const groups = {};
  history.filter((w) => new Date(w.date) >= cutoff).forEach((wk) => {
    if (!wk.exercises) return;
    wk.exercises.forEach((ex) => {
      const mgs = ex.muscleGroups || [];
      const completedSets = ex.sets.filter((s) => s.done).length;
      mgs.forEach((mg) => { groups[mg] = (groups[mg] || 0) + completedSets; });
    });
  });
  return Object.entries(groups).sort((a, b) => b[1] - a[1]);
};

// Aggregate program weekly volume — what one full rotation cycle delivers per muscle
const getProgramWeeklyVolume = () => {
  // One rotation: Push A ×1, Pull ×3, Legs ×2, Push B ×1 (rest days don't add volume)
  const counts = { 'push-a': 1, 'pull': 3, 'legs': 2, 'push-b': 1 };
  const totals = {};
  Object.entries(counts).forEach(([wid, mult]) => {
    PROGRAM[wid].volume.forEach((v) => {
      totals[v.group] = (totals[v.group] || 0) + v.sets * mult;
    });
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
};

// Per-exercise trend: max weight per session
const getExerciseTrend = (history, exerciseName) => {
  const points = [];
  history.forEach((wk) => {
    if (!wk.exercises) return;
    wk.exercises.forEach((ex) => {
      if (ex.name === exerciseName) {
        const done = ex.sets.filter((s) => s.done);
        if (done.length === 0) return;
        const max = Math.max(...done.map((s) => s.w));
        if (Number.isFinite(max)) points.push({ date: wk.date, w: max, r: Math.max(...done.map((s) => s.r)) });
      }
    });
  });
  return points.sort((a, b) => new Date(a.date) - new Date(b.date));
};

// ============================================================================
// MAIN APP
// ============================================================================
export default function FitnessTracker() {
  const [tab, setTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [customExercises, setCustomExercises] = useState({}); // workoutId → array of custom exercises (persisted within active session only)

  // Load from storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY_HISTORY);
        if (!cancelled && res && res.value) {
          const parsed = JSON.parse(res.value);
          if (Array.isArray(parsed)) setHistory(parsed);
        }
      } catch (e) { if (!cancelled) setHistory([]); }
      try {
        const res = await window.storage.get(STORAGE_KEY_ROTATION_INDEX);
        if (!cancelled && res && res.value) {
          const n = parseInt(res.value);
          if (Number.isFinite(n) && n >= 0) setRotationIndex(n);
        }
      } catch (e) { /* default 0 */ }
      try {
        const res = await window.storage.get(STORAGE_KEY_ACTIVE_WORKOUT);
        if (!cancelled && res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed && parsed.workoutId && parsed.startTime) {
            setActiveWorkout(parsed);
          }
        }
      } catch (e) { /* no active workout, fine */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Save history
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY_HISTORY, JSON.stringify(history));
        setSaveError(null);
      } catch (e) { setSaveError('Could not save — your last session may not persist.'); }
    })();
  }, [history, loading]);

  // Save rotation index
  useEffect(() => {
    if (loading) return;
    (async () => {
      try { await window.storage.set(STORAGE_KEY_ROTATION_INDEX, String(rotationIndex)); } catch (e) {}
    })();
  }, [rotationIndex, loading]);
  // Save active workout on every change (auto-resume mid-workout)
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        if (activeWorkout) {
          await window.storage.set(STORAGE_KEY_ACTIVE_WORKOUT, JSON.stringify(activeWorkout));
        } else {
          await window.storage.delete(STORAGE_KEY_ACTIVE_WORKOUT);
        }
      } catch (e) {}
    })();
  }, [activeWorkout, loading]);

  const currentRotationId = ROTATION_SEQUENCE[rotationIndex % ROTATION_SEQUENCE.length];
  const nextRotationId = ROTATION_SEQUENCE[(rotationIndex + 1) % ROTATION_SEQUENCE.length];

  const advanceRotation = () => setRotationIndex((i) => i + 1);

  const startWorkout = (workoutId) => {
    if (workoutId === 'rest' || PROGRAM[workoutId]?.isRest) return;
    const w = PROGRAM[workoutId];
    const exercises = getAllExercises(w).map((ex) => ({
      ...ex,
      sets: Array.from({ length: ex.sets }, () => ({ w: '', r: '', done: false })),
    }));
    setActiveWorkout({
      workoutId,
      name: w.name,
      focus: w.focus,
      startTime: Date.now(),
      exercises,
      sections: w.sections,
    });
    setTab('workout');
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    const duration = Math.round((Date.now() - activeWorkout.startTime) / 60000);
    const completed = activeWorkout.exercises
      .map((ex) => ({
        name: ex.name,
        muscleGroups: ex.muscleGroups || [],
        supersetGroup: ex.supersetGroup,
        custom: !!ex.custom,
        sets: ex.sets.filter((s) => s.done && s.w !== '' && s.r !== '').map((s) => ({ w: parseFloat(s.w), r: parseInt(s.r), done: true })),
      }))
      .filter((ex) => ex.sets.length > 0);

    if (completed.length === 0) {
      setActiveWorkout(null);
      setTab('dashboard');
      return;
    }

    // Detect PRs against prior history
    const prevPRs = getPRs(history);
    completed.forEach((ex) => {
      const prev = prevPRs[ex.name];
      const best = ex.sets.reduce((a, b) => (b.w > a.w || (b.w === a.w && b.r > a.r) ? b : a), ex.sets[0]);
      if (!prev || best.w > prev.w || (best.w === prev.w && best.r > prev.r)) ex.pr = true;
    });

    const entry = {
      id: 'h' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      workoutId: activeWorkout.workoutId,
      name: activeWorkout.name,
      duration,
      exercises: completed,
    };
    setHistory((h) => [...h, entry]);
    advanceRotation();
    setActiveWorkout(null);
    setTab('history');
  };

  const discardWorkout = () => {
    setActiveWorkout(null);
    setTab('dashboard');
  };

  const skipRest = () => advanceRotation();

  const resetAllData = async () => {
    try { await window.storage.delete(STORAGE_KEY_HISTORY); } catch (e) {}
    try { await window.storage.delete(STORAGE_KEY_ROTATION_INDEX); } catch (e) {}
    try { await window.storage.delete(STORAGE_KEY_ACTIVE_WORKOUT); } catch (e) {}
    setHistory([]);
    setRotationIndex(0);
    setActiveWorkout(null);
    setShowResetConfirm(false);
    setTab('dashboard');
  };
// If we restored an active workout on load, jump to the workout tab automatically
  useEffect(() => {
    if (!loading && activeWorkout && tab === 'dashboard') {
      setTab('workout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center" style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');`}</style>
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <div className="font-display font-bold text-xs uppercase tracking-[0.3em] text-zinc-500 mt-4">Loading Your Data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'Barlow Condensed', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.01em; }
        .font-mono-stat { font-family: 'JetBrains Mono', monospace; font-feature-settings: 'tnum'; }
        .grain {
          background-image:
            radial-gradient(circle at 20% 0%, rgba(0, 153, 255, 0.08), transparent 50%),
            radial-gradient(circle at 80% 100%, rgba(0, 153, 255, 0.05), transparent 50%);
        }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .slide-in { animation: slide-in 0.25s ease-out; }
        @keyframes slide-in { from { transform: translateY(6px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {saveError && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500/90 text-white rounded-sm font-display text-xs uppercase tracking-wider">{saveError}</div>
      )}

      <div className="grain min-h-screen pb-24">
        {tab === 'dashboard' && (
          <Dashboard
            history={history}
            onStart={startWorkout}
            onReset={() => setShowResetConfirm(true)}
            currentRotationId={currentRotationId}
            nextRotationId={nextRotationId}
            rotationIndex={rotationIndex}
            onSkipRest={skipRest}
          />
        )}
        {tab === 'workout' && activeWorkout && (
          <WorkoutScreen
            workout={activeWorkout}
            setWorkout={setActiveWorkout}
            history={history}
            onFinish={finishWorkout}
            onDiscard={discardWorkout}
          />
        )}
        {tab === 'workout' && !activeWorkout && (
          <NoActiveWorkout onSelect={startWorkout} currentRotationId={currentRotationId} onSkipRest={skipRest} />
        )}
        {tab === 'history' && <HistoryScreen history={history} />}
        {tab === 'progress' && <ProgressScreen history={history} />}
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] bg-zinc-950/90 flex items-center justify-center px-5">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-sm p-5 slide-in">
            <div className="font-display font-black text-xl uppercase tracking-wide">Reset All Data?</div>
            <p className="text-sm text-zinc-400 font-display mt-2 leading-relaxed">This wipes every workout you've logged and resets the rotation. Cannot be undone.</p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <button onClick={() => setShowResetConfirm(false)} className="py-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-sm font-display font-bold text-xs uppercase tracking-[0.15em] text-zinc-300">Cancel</button>
              <button onClick={resetAllData} className="py-3 bg-red-500 hover:bg-red-400 text-zinc-950 rounded-sm font-display font-black text-xs uppercase tracking-[0.15em]">Wipe Data</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav tab={tab} setTab={setTab} hasActive={!!activeWorkout} />
    </div>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================
function Dashboard({ history, onStart, onReset, currentRotationId, nextRotationId, rotationIndex, onSkipRest }) {
  const streak = getStreak(history);
  const thisWeek = getThisWeekCount(history);
  const total = history.length;
  const prs = getPRs(history);
  const topPRs = Object.entries(prs)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.w * b.r - a.w * a.r)
    .slice(0, 3);

  const programVolume = getProgramWeeklyVolume();
  const maxProgVol = Math.max(...programVolume.map(([, v]) => v), 1);
  const isRestNow = currentRotationId === 'rest';
  const current = PROGRAM[currentRotationId];
  const next = PROGRAM[nextRotationId];

  return (
    <div className="px-5 pt-8 pb-4">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs tracking-[0.3em] text-zinc-500 font-display font-medium uppercase">Athlete</div>
          <h1 className="font-display font-black text-4xl uppercase leading-none mt-1">Ascend Mode</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-sm">
            <span className="w-2 h-2 bg-sky-400 rounded-full pulse-dot"></span>
            <span className="font-mono-stat text-[10px] tracking-wider text-zinc-400 uppercase">Active</span>
          </div>
          {total > 0 && (
            <button onClick={onReset} title="Reset all data" className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:text-red-400 text-zinc-600 transition-colors rounded-sm">
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* CURRENT POSITION BANNER */}
      <div className={`relative mt-5 p-5 rounded-sm overflow-hidden ${isRestNow ? 'bg-zinc-900 border border-zinc-800' : 'bg-gradient-to-br from-sky-500 to-sky-700'}`}>
        {!isRestNow && (
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 9px)' }}></div>
        )}
        <div className="relative">
          <div className={`text-[10px] tracking-[0.3em] font-display font-semibold uppercase ${isRestNow ? 'text-zinc-500' : 'text-sky-100'}`}>Up Next</div>
          {isRestNow ? (
            <>
              <div className="flex items-center gap-3 mt-1">
                <Moon className="w-7 h-7 text-zinc-500" />
                <div className="font-display font-black text-3xl text-zinc-200 uppercase leading-none">Rest Day</div>
              </div>
              <div className="text-[11px] tracking-wider text-zinc-500 font-display mt-3 leading-snug max-w-md">Recovery is when growth happens. Tomorrow: <span className="text-sky-400 font-bold">{next.name}</span></div>
              <button onClick={onSkipRest} className="mt-4 px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-sky-500 hover:text-sky-400 text-zinc-400 transition-colors rounded-sm font-display font-bold text-[10px] uppercase tracking-[0.15em]">
                Skip Rest →
              </button>
            </>
          ) : (
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display font-black text-3xl text-white uppercase leading-none mt-1">{current.name}</div>
                <div className="text-[11px] tracking-wider text-sky-100 font-display mt-2 uppercase">Focus · {current.focus.primary}</div>
              </div>
              <button onClick={() => onStart(currentRotationId)} className="bg-zinc-950 hover:bg-zinc-900 text-white px-5 py-3 rounded-sm font-display font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                Start <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ROTATION STRIP */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Rotation</div>
          <div className="text-[10px] tracking-wider text-zinc-600 font-display uppercase">Position {(rotationIndex % ROTATION_SEQUENCE.length) + 1} / {ROTATION_SEQUENCE.length}</div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
          {ROTATION_SEQUENCE.map((wid, i) => {
            const isCurrent = i === rotationIndex % ROTATION_SEQUENCE.length;
            const isPast = i < rotationIndex % ROTATION_SEQUENCE.length;
            const w = PROGRAM[wid];
            const isRest = w.isRest;
            return (
              <div
                key={i}
                className={`flex-shrink-0 px-2.5 py-2 border rounded-sm transition-all ${
                  isCurrent
                    ? 'bg-sky-400 border-sky-400 text-zinc-950 ring-2 ring-sky-400/30'
                    : isPast
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-600'
                    : isRest
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-600'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="font-display font-black text-[9px] uppercase tracking-wider whitespace-nowrap">
                  {isRest ? 'Rest' : w.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAT BOXES */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        <StatBox label="Streak" value={streak} unit="days" icon={<Flame className="w-4 h-4" />} accent />
        <StatBox label="This Week" value={thisWeek} unit="lifts" />
        <StatBox label="Total" value={total} unit="lifts" />
      </div>

      {/* QUICK LAUNCH */}
      <div className="mt-8 mb-3">
        <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Workouts</div>
        <h2 className="font-display font-bold text-2xl uppercase leading-none mt-0.5">Quick Launch</h2>
      </div>
      <div className="space-y-2">
        {WORKOUT_IDS.map((wid) => {
          const w = PROGRAM[wid];
          const isCurrent = wid === currentRotationId;
          return (
            <button
              key={wid}
              onClick={() => onStart(wid)}
              className={`w-full group flex items-center gap-4 p-4 border transition-all rounded-sm text-left ${
                isCurrent ? 'bg-sky-500/10 border-sky-500' : 'bg-zinc-900 border-zinc-800 hover:border-sky-500'
              }`}
            >
              <div className={`flex-shrink-0 w-12 h-12 border flex items-center justify-center rounded-sm transition-colors ${
                isCurrent ? 'bg-sky-400 border-sky-400 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:border-sky-500 group-hover:bg-sky-500 group-hover:text-zinc-950'
              }`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-bold text-lg uppercase tracking-wide">{w.name}</span>
                  {isCurrent && <span className="text-[9px] tracking-wider text-sky-400 font-display font-bold uppercase">· Up Next</span>}
                </div>
                <div className="text-[10px] tracking-wider text-zinc-500 font-display uppercase mt-0.5">
                  Focus · {w.focus.primary}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-sky-400 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* PROGRAM VOLUME */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Per Rotation</div>
            <h2 className="font-display font-bold text-2xl uppercase leading-none mt-0.5">Program Volume</h2>
          </div>
          <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">Direct Sets</span>
        </div>
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-sm space-y-2.5">
          {programVolume.map(([group, sets]) => (
            <div key={group}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-display font-medium text-xs uppercase tracking-wider text-zinc-300">{group}</span>
                <span className="font-mono-stat text-xs text-zinc-400">{sets} sets</span>
              </div>
              <div className="h-1.5 bg-zinc-950 rounded-sm overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400" style={{ width: `${(sets / maxProgVol) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP PRS */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Records</div>
            <h2 className="font-display font-bold text-2xl uppercase leading-none mt-0.5">Top 3 Lifts</h2>
          </div>
          <Trophy className="w-5 h-5 text-sky-400" />
        </div>
        {topPRs.length > 0 ? (
          <div className="space-y-2">
            {topPRs.map((pr, i) => (
              <div key={pr.name} className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
                <div className="flex-shrink-0 w-10 text-center">
                  <span className="font-display font-black text-3xl text-sky-400 leading-none">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-sm uppercase tracking-wide truncate">{pr.name}</div>
                  <div className="text-[10px] tracking-wider text-zinc-500 font-display uppercase mt-0.5">{(pr.muscleGroups || []).join(' · ') || '—'} · {formatDate(pr.date)}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono-stat text-2xl font-bold text-white leading-none">{pr.w}<span className="text-xs text-zinc-500 ml-0.5">kg</span></div>
                  <div className="font-mono-stat text-[10px] text-zinc-500 mt-1 tracking-wider">× {pr.r} REPS</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-zinc-900 border border-dashed border-zinc-800 rounded-sm text-center">
            <Trophy className="w-6 h-6 text-zinc-700 mx-auto" />
            <div className="font-display font-bold text-sm uppercase tracking-wider text-zinc-500 mt-3">No PRs yet</div>
            <div className="text-[11px] text-zinc-600 font-display mt-1 leading-snug">Finish your first workout — every set you log is a record.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, unit, icon, accent }) {
  return (
    <div className={`relative p-3 border rounded-sm ${accent ? 'bg-sky-500/10 border-sky-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-center justify-between">
        <div className="text-[9px] tracking-[0.2em] text-zinc-400 font-display font-semibold uppercase">{label}</div>
        {icon && <div className={accent ? 'text-sky-400' : 'text-zinc-600'}>{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-mono-stat text-3xl font-bold leading-none ${accent ? 'text-sky-300' : 'text-white'}`}>{value}</span>
        <span className="text-[10px] text-zinc-500 font-display uppercase tracking-wider">{unit}</span>
      </div>
    </div>
  );
}

// ============================================================================
// WORKOUT SCREEN
// ============================================================================
function WorkoutScreen({ workout, setWorkout, history, onFinish, onDiscard }) {
  const [elapsed, setElapsed] = useState(0);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [search, setSearch] = useState('');
  const [openNotes, setOpenNotes] = useState({}); // exerciseId → bool

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - workout.startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [workout.startTime]);

  const programDay = PROGRAM[workout.workoutId];

  const updateSet = (idx, setIdx, field, value) => {
    setWorkout((w) => {
      const exercises = [...w.exercises];
      const ex = { ...exercises[idx] };
      ex.sets = [...ex.sets];
      ex.sets[setIdx] = { ...ex.sets[setIdx], [field]: value };
      exercises[idx] = ex;
      return { ...w, exercises };
    });
  };

  const toggleDone = (idx, setIdx) => {
    setWorkout((w) => {
      const exercises = [...w.exercises];
      const ex = { ...exercises[idx] };
      ex.sets = [...ex.sets];
      ex.sets[setIdx] = { ...ex.sets[setIdx], done: !ex.sets[setIdx].done };
      exercises[idx] = ex;
      return { ...w, exercises };
    });
  };

  const addSet = (idx) => {
    setWorkout((w) => {
      const exercises = [...w.exercises];
      const ex = { ...exercises[idx] };
      const last = ex.sets[ex.sets.length - 1] || { w: '', r: '' };
      ex.sets = [...ex.sets, { w: last.w, r: last.r, done: false }];
      exercises[idx] = ex;
      return { ...w, exercises };
    });
  };

  const addCustomExercise = (name, muscleGroups) => {
    setWorkout((w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        {
          id: 'custom-' + Date.now(),
          name,
          muscleGroups,
          sectionTitle: 'Custom',
          custom: true,
          reps: '8–12',
          rest: '90s',
          purpose: 'Custom-added exercise.',
          executionNotes: [],
          sets: [{ w: '', r: '', done: false }, { w: '', r: '', done: false }, { w: '', r: '', done: false }],
        },
      ],
    }));
    setShowAddSheet(false);
    setSearch('');
  };

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Build pool of available exercises for picker (all exercises across program, excluding ones already in workout)
  const allExercisePool = WORKOUT_IDS.flatMap((wid) =>
    getAllExercises(PROGRAM[wid]).map((ex) => ({ name: ex.name, muscleGroups: ex.muscleGroups }))
  );
  const seen = new Set();
  const uniquePool = allExercisePool.filter((e) => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
  const inWorkout = new Set(workout.exercises.map((e) => e.name));
  const availableExercises = uniquePool.filter((e) =>
    !inWorkout.has(e.name) &&
    (search === '' || e.name.toLowerCase().includes(search.toLowerCase()) || (e.muscleGroups || []).some((m) => m.toLowerCase().includes(search.toLowerCase())))
  );

  // Group exercises by section for rendering, preserving order
  // First the program sections, then any custom exercises at end
  const renderQueue = [];
  programDay.sections.forEach((sec) => {
    const exercisesInSection = workout.exercises.filter((ex) => ex.sectionTitle === sec.title);
    if (exercisesInSection.length > 0) renderQueue.push({ section: sec, exercises: exercisesInSection });
  });
  const customs = workout.exercises.filter((ex) => ex.custom);
  if (customs.length > 0) {
    renderQueue.push({ section: { title: 'Custom (Added by you)' }, exercises: customs });
  }

  const toggleNote = (id) => setOpenNotes((o) => ({ ...o, [id]: !o[id] }));

  return (
    <div className="px-5 pt-6 pb-4">
      {/* HEADER */}
      <div className="sticky top-0 -mx-5 px-5 pt-2 pb-3 bg-zinc-950 z-20 border-b border-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-sky-400 font-display font-semibold uppercase">{today}</div>
            <h1 className="font-display font-black text-3xl uppercase leading-none mt-1">{workout.name}</h1>
            <div className="text-[10px] tracking-wider text-zinc-500 font-display uppercase mt-1">
              Focus · {workout.focus.primary}
              {workout.focus.secondary && <span className="text-zinc-700"> · </span>}
              {workout.focus.secondary && <span>{workout.focus.secondary}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3 h-3 text-sky-400" />
              <span className="font-mono-stat text-xl font-bold text-white leading-none">{formatTimer(elapsed)}</span>
            </div>
            <div className="font-mono-stat text-[10px] text-zinc-500 mt-1 tracking-wider">{completedSets}/{totalSets} SETS</div>
          </div>
        </div>
        <div className="mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-sky-400 transition-all" style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}></div>
        </div>
      </div>

      {/* SECTIONS */}
      {renderQueue.map(({ section, exercises }) => (
        <SectionRender
          key={section.title}
          section={section}
          exercises={exercises}
          allExercises={workout.exercises}
          history={history}
          onUpdate={updateSet}
          onToggle={toggleDone}
          onAddSet={addSet}
          openNotes={openNotes}
          toggleNote={toggleNote}
        />
      ))}

      {/* COACHING NOTES BLOCK */}
      <CollapsibleBlock title="Coaching Notes" defaultOpen={false}>
        <ul className="space-y-1.5">
          {programDay.coachingNotes.map((n, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-zinc-400 font-display leading-snug">
              <span className="text-sky-400 flex-shrink-0">›</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </CollapsibleBlock>

      <CollapsibleBlock title="Loading & Failure Rules" defaultOpen={false}>
        <p className="text-[12px] text-zinc-400 font-display leading-snug">{programDay.loadingRules}</p>
      </CollapsibleBlock>

      <CollapsibleBlock title="Weight Selection" defaultOpen={false}>
        <ul className="space-y-1.5">
          {programDay.weightSelectionRules.map((n, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-zinc-400 font-display leading-snug">
              <span className="text-sky-400 flex-shrink-0">›</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </CollapsibleBlock>

      <CollapsibleBlock title="Progression Rule" defaultOpen={false}>
        <p className="text-[12px] text-zinc-400 font-display leading-snug">{programDay.progressionRules}</p>
      </CollapsibleBlock>

      {/* ADD EXERCISE */}
      {!showAddSheet ? (
        <button onClick={() => setShowAddSheet(true)} className="w-full mt-4 p-4 border-2 border-dashed border-zinc-800 hover:border-sky-500 hover:bg-zinc-900 rounded-sm flex items-center justify-center gap-2 text-zinc-500 hover:text-sky-400 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="font-display font-bold text-sm uppercase tracking-wider">Add Custom Exercise</span>
        </button>
      ) : (
        <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-sm slide-in">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <span className="font-display font-bold text-sm uppercase tracking-wider">Add Custom Exercise</span>
            <button onClick={() => { setShowAddSheet(false); setSearch(''); }} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-sm">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search exercises or muscles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-display text-white placeholder:text-zinc-600"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableExercises.slice(0, 25).map((e) => (
              <button key={e.name} onClick={() => addCustomExercise(e.name, e.muscleGroups)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 border-b border-zinc-800 last:border-b-0 text-left">
                <div>
                  <div className="font-display font-medium text-sm">{e.name}</div>
                  <div className="text-[10px] tracking-wider text-zinc-500 font-display uppercase mt-0.5">{(e.muscleGroups || []).join(' · ')}</div>
                </div>
                <Plus className="w-4 h-4 text-sky-400" />
              </button>
            ))}
            {availableExercises.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500 font-display uppercase tracking-wider">No matches</div>
            )}
          </div>
        </div>
      )}

      {/* FINISH/DISCARD */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <button onClick={onDiscard} className="col-span-1 py-4 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:text-red-400 transition-colors rounded-sm font-display font-bold text-sm uppercase tracking-wider">Discard</button>
        <button onClick={onFinish} className="col-span-2 py-4 bg-sky-400 hover:bg-sky-300 text-zinc-950 transition-colors rounded-sm font-display font-black text-sm uppercase tracking-[0.15em]">Finish Workout</button>
      </div>
    </div>
  );
}

function CollapsibleBlock({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/60">
        <span className="font-display font-bold text-[11px] tracking-[0.2em] uppercase text-sky-400">{title}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-0 border-t border-zinc-800">{children}</div>}
    </div>
  );
}

// Render a section: groups superset exercises into a single visual card
function SectionRender({ section, exercises, allExercises, history, onUpdate, onToggle, onAddSet, openNotes, toggleNote }) {
  const isSuperset = !!section.supersetGroup;

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          {isSuperset && <Link2 className="w-3 h-3 text-sky-400" />}
          <h3 className="font-display font-bold text-[11px] tracking-[0.2em] uppercase text-sky-400">{section.title}</h3>
        </div>
        {isSuperset && <span className="text-[9px] tracking-wider text-zinc-600 font-display uppercase">{exercises.length} paired</span>}
      </div>

      {isSuperset && section.supersetInstructions && (
        <div className="mb-2 px-3 py-2 bg-sky-500/5 border border-sky-500/30 rounded-sm">
          <p className="text-[11px] text-sky-300 font-display leading-snug italic">{section.supersetInstructions}</p>
        </div>
      )}

      <div className={isSuperset ? 'border-l-2 border-sky-500/40 pl-2 space-y-2' : 'space-y-3'}>
        {exercises.map((ex) => {
          const idx = allExercises.findIndex((e) => e.id === ex.id);
          return (
            <ExerciseBlock
              key={ex.id}
              ex={ex}
              idx={idx}
              isSupersetItem={isSuperset}
              history={history}
              onUpdate={onUpdate}
              onToggle={onToggle}
              onAddSet={() => onAddSet(idx)}
              notesOpen={!!openNotes[ex.id]}
              onToggleNotes={() => toggleNote(ex.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ExerciseBlock({ ex, idx, isSupersetItem, history, onUpdate, onToggle, onAddSet, notesOpen, onToggleNotes }) {
  const previous = findPrevious(history, ex.name);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isSupersetItem && ex.supersetPosition && (
                <span className="font-display font-black text-[10px] uppercase tracking-wider text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-sm border border-sky-500/30">
                  {ex.supersetPosition}
                </span>
              )}
              <span className="font-display font-bold text-base uppercase tracking-wide truncate">{ex.name}</span>
              {ex.custom && <span className="text-[9px] tracking-wider text-amber-400 font-display font-bold uppercase border border-amber-400/40 px-1.5 py-0.5 rounded-sm">Custom</span>}
              {ex.alternatives && (
                <span className="text-[9px] tracking-wider text-zinc-500 font-display uppercase">+ alternatives</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">{(ex.muscleGroups || []).join(' · ')}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">{ex.reps} reps</span>
              <span className="text-zinc-700">·</span>
              <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">Rest {ex.rest}</span>
            </div>
          </div>
        </div>
        {ex.purpose && (
          <div className="mt-2 text-[11px] text-zinc-400 font-display italic leading-snug">→ {ex.purpose}</div>
        )}
        {(ex.executionNotes && ex.executionNotes.length > 0) || ex.failureRule || ex.addWeightWhen || ex.alternatives ? (
          <button onClick={onToggleNotes} className="mt-2 flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-wider text-zinc-500 hover:text-sky-400">
            <ChevronDown className={`w-3 h-3 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
            <span>{notesOpen ? 'Hide' : 'Show'} Notes</span>
          </button>
        ) : null}
        {notesOpen && (
          <div className="mt-3 space-y-3 slide-in">
            {ex.alternatives && (
              <div>
                <div className="text-[9px] tracking-[0.2em] font-display font-bold uppercase text-sky-400 mb-1">Alternatives</div>
                <p className="text-[11px] text-zinc-400 font-display leading-snug">{ex.alternatives}</p>
              </div>
            )}
            {ex.executionNotes && ex.executionNotes.length > 0 && (
              <div>
                <div className="text-[9px] tracking-[0.2em] font-display font-bold uppercase text-sky-400 mb-1">Execution</div>
                <ul className="space-y-1">
                  {ex.executionNotes.map((n, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-zinc-400 font-display leading-snug">
                      <span className="text-zinc-600 flex-shrink-0">·</span><span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ex.setTargets && ex.setTargets.length > 0 && (
              <div>
                <div className="text-[9px] tracking-[0.2em] font-display font-bold uppercase text-sky-400 mb-1">Per-Set Targets</div>
                <div className="flex flex-wrap gap-1.5">
                  {ex.setTargets.map((t, i) => (
                    <span key={i} className="text-[10px] text-zinc-300 font-mono-stat bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded-sm">
                      Set {i + 1}: {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {ex.failureRule && (
              <div>
                <div className="text-[9px] tracking-[0.2em] font-display font-bold uppercase text-sky-400 mb-1">Failure Rule</div>
                <p className="text-[11px] text-zinc-400 font-display leading-snug">{ex.failureRule}</p>
              </div>
            )}
            {ex.addWeightWhen && (
              <div>
                <div className="text-[9px] tracking-[0.2em] font-display font-bold uppercase text-sky-400 mb-1">Add Weight When</div>
                <p className="text-[11px] text-zinc-400 font-display leading-snug">{ex.addWeightWhen}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="grid grid-cols-12 gap-2 items-center px-2 pb-2 border-b border-zinc-800">
          <div className="col-span-1 text-[9px] tracking-wider text-zinc-500 font-display font-bold uppercase">Set</div>
          <div className="col-span-4 text-[9px] tracking-wider text-zinc-500 font-display font-bold uppercase">Previous</div>
          <div className="col-span-3 text-[9px] tracking-wider text-zinc-500 font-display font-bold uppercase">Weight</div>
          <div className="col-span-2 text-[9px] tracking-wider text-zinc-500 font-display font-bold uppercase">Reps</div>
          <div className="col-span-2"></div>
        </div>
        {ex.sets.map((s, setIdx) => {
          const prev = previous && previous[setIdx];
          return (
            <div
              key={setIdx}
              className={`grid grid-cols-12 gap-2 items-center px-2 py-2 border-b border-zinc-800 last:border-b-0 transition-colors ${s.done ? 'bg-sky-500/10' : ''}`}
            >
              <div className="col-span-1">
                <span className={`font-mono-stat text-sm font-bold ${s.done ? 'text-sky-400' : 'text-zinc-400'}`}>{setIdx + 1}</span>
              </div>
              <div className="col-span-4">
                {prev ? (
                  <span className="font-mono-stat text-xs text-zinc-500">{prev.w} × {prev.r}</span>
                ) : ex.setTargets && ex.setTargets[setIdx] ? (
                  <span className="font-mono-stat text-[10px] text-zinc-600 truncate block">target {ex.setTargets[setIdx]}</span>
                ) : (
                  <span className="font-mono-stat text-xs text-zinc-700">—</span>
                )}
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={s.w}
                  onChange={(e) => onUpdate(idx, setIdx, 'w', e.target.value)}
                  placeholder={prev ? prev.w : '0'}
                  className={`w-full px-2 py-1.5 bg-zinc-950 border rounded-sm text-sm font-mono-stat text-white outline-none focus:border-sky-500 ${s.done ? 'border-sky-500/50' : 'border-zinc-800'}`}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.r}
                  onChange={(e) => onUpdate(idx, setIdx, 'r', e.target.value)}
                  placeholder={prev ? prev.r : '0'}
                  className={`w-full px-2 py-1.5 bg-zinc-950 border rounded-sm text-sm font-mono-stat text-white outline-none focus:border-sky-500 ${s.done ? 'border-sky-500/50' : 'border-zinc-800'}`}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => onToggle(idx, setIdx)}
                  disabled={!s.w || !s.r}
                  className={`w-9 h-9 flex items-center justify-center border rounded-sm transition-all ${
                    s.done
                      ? 'bg-sky-400 border-sky-400 text-zinc-950'
                      : s.w && s.r
                      ? 'bg-zinc-900 border-zinc-700 hover:border-sky-500 hover:text-sky-400 text-zinc-500'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-800 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
        <button onClick={onAddSet} className="w-full mt-2 py-2 text-[10px] tracking-[0.15em] text-zinc-500 hover:text-sky-400 font-display font-bold uppercase border border-dashed border-zinc-800 hover:border-sky-500 rounded-sm transition-colors">
          + Add Set
        </button>
      </div>
    </div>
  );
}

function NoActiveWorkout({ onSelect, currentRotationId, onSkipRest }) {
  const isRest = currentRotationId === 'rest';
  return (
    <div className="px-5 pt-8 pb-4">
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Workout</div>
      <h1 className="font-display font-black text-4xl uppercase leading-none mt-1">Pick A Day</h1>
      {isRest && (
        <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-zinc-500" />
            <span className="font-display font-bold text-xs uppercase tracking-wider text-zinc-300">Rotation says: Rest Day</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-display mt-2 leading-snug">You can skip the rest if needed, or pick any workout below to override the rotation.</p>
          <button onClick={onSkipRest} className="mt-3 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-sky-500 hover:text-sky-400 text-zinc-400 transition-colors rounded-sm font-display font-bold text-[10px] uppercase tracking-[0.15em]">
            Skip Rest →
          </button>
        </div>
      )}
      <div className="mt-6 space-y-2">
        {WORKOUT_IDS.map((wid) => {
          const w = PROGRAM[wid];
          const isCurrent = wid === currentRotationId;
          return (
            <button
              key={wid}
              onClick={() => onSelect(wid)}
              className={`w-full group flex items-center gap-4 p-4 border transition-all rounded-sm text-left ${
                isCurrent ? 'bg-sky-500/10 border-sky-500' : 'bg-zinc-900 border-zinc-800 hover:border-sky-500'
              }`}
            >
              <div className={`flex-shrink-0 w-12 h-12 border flex items-center justify-center rounded-sm transition-colors ${
                isCurrent ? 'bg-sky-400 border-sky-400 text-zinc-950' : 'bg-zinc-950 border-zinc-800 text-zinc-400 group-hover:border-sky-500'
              }`}>
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-lg uppercase tracking-wide">{w.name}</div>
                <div className="font-display text-xs text-zinc-500 uppercase tracking-wider">Focus · {w.focus.primary}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-sky-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// HISTORY
// ============================================================================
function HistoryScreen({ history }) {
  const [filter, setFilter] = useState('all');
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = filter === 'all' ? sorted : sorted.filter((w) => w.workoutId === filter);

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Log</div>
      <h1 className="font-display font-black text-4xl uppercase leading-none mt-1">History</h1>
      <p className="text-xs tracking-wider text-zinc-500 font-display uppercase mt-2">{filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}{filter !== 'all' ? ` · ${PROGRAM[filter].name}` : ''}</p>

      {sorted.length > 0 && (
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-3 h-3 text-zinc-600 flex-shrink-0" />
          <button onClick={() => setFilter('all')} className={`flex-shrink-0 px-3 py-1.5 border rounded-sm font-display font-bold text-[10px] uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-sky-400 border-sky-400 text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-sky-500'}`}>All</button>
          {WORKOUT_IDS.map((wid) => (
            <button key={wid} onClick={() => setFilter(wid)} className={`flex-shrink-0 px-3 py-1.5 border rounded-sm font-display font-bold text-[10px] uppercase tracking-wider transition-colors ${filter === wid ? 'bg-sky-400 border-sky-400 text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-sky-500'}`}>
              {PROGRAM[wid].name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8 p-8 bg-zinc-900 border border-dashed border-zinc-800 rounded-sm text-center">
          <History className="w-8 h-8 text-zinc-700 mx-auto" />
          <div className="font-display font-bold text-base uppercase tracking-wider text-zinc-400 mt-4">{sorted.length === 0 ? 'No History Yet' : 'No Sessions Match'}</div>
          <div className="text-xs text-zinc-500 font-display mt-2 leading-relaxed max-w-xs mx-auto">{sorted.length === 0 ? 'Your logged workouts will appear here. Track every set — that\u2019s non-negotiable.' : 'Try a different filter.'}</div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((wk) => {
            const totalSets = wk.exercises.reduce((sum, e) => sum + e.sets.length, 0);
            const hasPR = wk.exercises.some((e) => e.pr);
            const muscleGroupSet = new Set();
            wk.exercises.forEach((e) => (e.muscleGroups || []).forEach((m) => muscleGroupSet.add(m)));
            const muscleGroups = Array.from(muscleGroupSet);
            const supersetGroups = new Set(wk.exercises.map((e) => e.supersetGroup).filter(Boolean));
            return (
              <div key={wk.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-lg uppercase tracking-wide">{wk.name}</span>
                      {hasPR && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-400 text-zinc-950 rounded-sm">
                          <Trophy className="w-3 h-3" strokeWidth={2.5} />
                          <span className="font-display font-black text-[9px] tracking-wider uppercase">PR</span>
                        </span>
                      )}
                      {supersetGroups.size > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-950 border border-sky-500/40 rounded-sm">
                          <Link2 className="w-2.5 h-2.5 text-sky-400" />
                          <span className="font-display font-bold text-[9px] tracking-wider uppercase text-sky-400">{supersetGroups.size} Superset{supersetGroups.size > 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] tracking-wider text-zinc-500 font-display uppercase">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(wk.date)}</div>
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{wk.duration}m</div>
                      <div className="font-mono-stat">{totalSets} SETS</div>
                    </div>
                  </div>
                </div>
                {muscleGroups.length > 0 && (
                  <div className="mt-2 text-[10px] tracking-wider text-sky-400 font-display uppercase">{muscleGroups.join(' · ')}</div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {wk.exercises.map((ex, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] tracking-wide font-display font-medium uppercase rounded-sm ${
                        ex.pr ? 'bg-sky-400 text-zinc-950 font-bold' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ex.pr && <Trophy className="w-2.5 h-2.5" strokeWidth={3} />}
                      {ex.supersetGroup && <Link2 className="w-2.5 h-2.5 text-sky-400" />}
                      {ex.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROGRESS
// ============================================================================
const MUSCLE_GROUP_ORDER = [
  'Chest', 'Back', 'Shoulders', 'Rear Delts', 'Triceps', 'Biceps',
  'Quads', 'Hamstrings', 'Adductors', 'Abductors/Outer Glutes',
  'Calves', 'Forearms/Brachialis', 'Neck', 'Abs',
];

function ProgressScreen({ history }) {
  const volume = getWeeklyVolumeByMuscle(history, 7);
  const programVolume = getProgramWeeklyVolume();
  const maxVol = Math.max(...volume.map(([, v]) => v), ...programVolume.map(([, v]) => v), 1);

  // Build per-exercise summary across all program exercises (not just history)
  const allProgramExercises = WORKOUT_IDS.flatMap((wid) => getAllExercises(PROGRAM[wid]));
  const seenNames = new Set();
  const uniqueProgramExercises = allProgramExercises.filter((e) => {
    if (seenNames.has(e.name)) return false;
    seenNames.add(e.name);
    return true;
  });

  const prs = getPRs(history);

  // Group exercises by primary muscle group
  const byMuscleGroup = {};
  uniqueProgramExercises.forEach((ex) => {
    const primary = (ex.muscleGroups && ex.muscleGroups[0]) || 'Other';
    if (!byMuscleGroup[primary]) byMuscleGroup[primary] = [];
    byMuscleGroup[primary].push(ex);
  });

  const orderedGroups = MUSCLE_GROUP_ORDER.filter((g) => byMuscleGroup[g]);
  Object.keys(byMuscleGroup).forEach((g) => { if (!orderedGroups.includes(g)) orderedGroups.push(g); });

  if (history.length === 0) {
    return (
      <div className="px-5 pt-8 pb-4">
        <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Analytics</div>
        <h1 className="font-display font-black text-4xl uppercase leading-none mt-1">Progress</h1>

        {/* Show program volume preview even with no history */}
        <div className="mt-6 p-5 bg-zinc-900 border border-zinc-800 rounded-sm">
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-display font-bold text-base uppercase tracking-wide">Program Volume</span>
            <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">Per rotation</span>
          </div>
          <div className="text-[10px] tracking-wider text-sky-400 font-display uppercase font-semibold">Direct Sets / Muscle Group</div>
          <div className="mt-5 space-y-3">
            {programVolume.map(([group, sets]) => (
              <div key={group}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-display font-medium text-xs uppercase tracking-wider text-zinc-300">{group}</span>
                  <span className="font-mono-stat text-xs text-zinc-400">{sets}</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-sm overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400" style={{ width: `${(sets / maxVol) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-8 bg-zinc-900 border border-dashed border-zinc-800 rounded-sm text-center">
          <TrendingUp className="w-8 h-8 text-zinc-700 mx-auto" />
          <div className="font-display font-bold text-base uppercase tracking-wider text-zinc-400 mt-4">No Workout Data Yet</div>
          <div className="text-xs text-zinc-500 font-display mt-2 leading-relaxed max-w-xs mx-auto">Per-exercise PRs and trends will appear once you log a few sessions.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-8 pb-4">
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Analytics</div>
      <h1 className="font-display font-black text-4xl uppercase leading-none mt-1">Progress</h1>

      {/* WEEKLY VOLUME (last 7 days, actual completed) */}
      <div className="mt-6 p-5 bg-zinc-900 border border-zinc-800 rounded-sm">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display font-bold text-base uppercase tracking-wide">Weekly Volume</span>
          <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">Last 7 days</span>
        </div>
        <div className="text-[10px] tracking-wider text-sky-400 font-display uppercase font-semibold">Completed Sets / Muscle Group</div>
        <div className="mt-5 space-y-3">
          {volume.length > 0 ? volume.map(([group, sets]) => (
            <div key={group}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-display font-medium text-xs uppercase tracking-wider text-zinc-300">{group}</span>
                <span className="font-mono-stat text-xs text-zinc-400">{sets}</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-sm overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-sky-400" style={{ width: `${(sets / maxVol) * 100}%` }}></div>
              </div>
            </div>
          )) : (
            <div className="text-center text-xs text-zinc-500 font-display uppercase tracking-wider py-4">No volume tracked this week</div>
          )}
        </div>
      </div>

      {/* PROGRAM TARGET VOLUME */}
      <div className="mt-3 p-5 bg-zinc-900 border border-zinc-800 rounded-sm">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-display font-bold text-base uppercase tracking-wide">Program Target</span>
          <span className="text-[10px] tracking-wider text-zinc-500 font-display uppercase">Per rotation</span>
        </div>
        <div className="text-[10px] tracking-wider text-sky-400 font-display uppercase font-semibold">Planned Direct Sets</div>
        <div className="mt-5 space-y-3">
          {programVolume.map(([group, sets]) => (
            <div key={group}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-display font-medium text-xs uppercase tracking-wider text-zinc-300">{group}</span>
                <span className="font-mono-stat text-xs text-zinc-400">{sets}</span>
              </div>
              <div className="h-2 bg-zinc-950 rounded-sm overflow-hidden">
                <div className="h-full bg-zinc-700" style={{ width: `${(sets / maxVol) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PER-MUSCLE-GROUP CARDS */}
      <div className="mt-8">
        <div className="text-[10px] tracking-[0.3em] text-zinc-500 font-display font-semibold uppercase">Trends</div>
        <h2 className="font-display font-bold text-2xl uppercase leading-none mt-0.5">By Muscle Group</h2>
      </div>

      {orderedGroups.map((group) => {
        const exercises = byMuscleGroup[group];
        return (
          <div key={group} className="mt-5">
            <h3 className="font-display font-bold text-[11px] tracking-[0.2em] uppercase text-sky-400 mb-2 px-1">{group}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exercises.map((ex) => {
                const trend = getExerciseTrend(history, ex.name);
                const pr = prs[ex.name];
                return <ExerciseProgressCard key={ex.name} exercise={ex} trend={trend} pr={pr} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExerciseProgressCard({ exercise, trend, pr }) {
  const hasData = trend.length > 0;
  const W = 200;
  const H = 36;

  let pathD = '', areaD = '', points = [];
  if (hasData && trend.length > 0) {
    const weights = trend.map((p) => p.w);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    points = trend.map((p, i) => {
      const x = trend.length === 1 ? W / 2 : (i / (trend.length - 1)) * W;
      const y = H - ((p.w - min) / range) * (H - 6) - 3;
      return [x, y];
    });
    pathD = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
    areaD = `${pathD} L ${W} ${H} L 0 ${H} Z`;
  }

  const lastPerformed = trend.length > 0 ? trend[trend.length - 1].date : null;
  const bestWeight = pr ? pr.w : (trend.length > 0 ? Math.max(...trend.map((p) => p.w)) : null);
  const bestReps = pr ? pr.r : null;

  return (
    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm">
      <div className="font-display font-bold text-[12px] uppercase tracking-wide truncate">{exercise.name}</div>
      <div className="flex items-baseline justify-between mt-2">
        <div>
          <div className="text-[9px] tracking-wider text-zinc-500 font-display uppercase">PR</div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono-stat text-xl font-bold text-sky-400 leading-none">{bestWeight !== null ? bestWeight : '—'}</span>
            {bestWeight !== null && <span className="text-[9px] text-zinc-500 font-display uppercase">kg{bestReps ? ` × ${bestReps}` : ''}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] tracking-wider text-zinc-500 font-display uppercase">Last</div>
          <div className="font-mono-stat text-[10px] text-zinc-400 mt-0.5">{lastPerformed ? formatDate(lastPerformed) : '—'}</div>
        </div>
      </div>
      {hasData ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9 mt-2" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grd-${exercise.name.replace(/\W/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#grd-${exercise.name.replace(/\W/g, '-')})`} />
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 2.5 : 1.2} fill="#38bdf8" />
          ))}
        </svg>
      ) : (
        <div className="mt-2 h-9 flex items-center justify-center border border-dashed border-zinc-800 rounded-sm">
          <span className="text-[9px] tracking-wider text-zinc-700 font-display uppercase">No data yet</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BOTTOM NAV
// ============================================================================
function BottomNav({ tab, setTab, hasActive }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'workout', label: 'Train', icon: Dumbbell },
    { id: 'history', label: 'Log', icon: History },
    { id: 'progress', label: 'Stats', icon: TrendingUp },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 z-50">
      <div className="grid grid-cols-4 max-w-2xl mx-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          const showDot = t.id === 'workout' && hasActive;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`relative py-3 flex flex-col items-center gap-1 transition-colors ${active ? 'text-sky-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {showDot && <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 bg-sky-400 rounded-full pulse-dot"></span>}
              </div>
              <span className="font-display font-bold text-[9px] tracking-[0.2em] uppercase">{t.label}</span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-400"></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}