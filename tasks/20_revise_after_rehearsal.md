# Task: revise Week NN after rehearsal

Input: the instructor's rehearsal notes for Week NN (scene ids, what was unclear, what broke, what the print lacked).

Revise only the scenes and shared behaviors named in the notes. Preserve case rules, scene identifiers, control meanings and the source and data distinctions. Improve the explanation and the print interpretation together: a changed scene state needs a changed print panel. When a shared component in `site/shared/` changes, rerun the full test suite for every existing deck and list the affected decks in the pull request. Regenerate the week's PDF and cue list if a scene's states changed.

Do not expand the curriculum, add a library, or change a fixture value to make a scene more persuasive. If a note asks for something that contradicts `plan/weekNN.txt`, stop and report the conflict instead of choosing.

Definition of done: the AGENTS.md command list passes; the pull request maps each rehearsal note to the change made or the reason it was not made.
