# Task: cue list for Week NN

Read `plan/22_recording_track.txt` and the rule files it links in `F:/0_tutorial_videos_project`. Then write `cues/week-NN.json` in the workspace shot-list format (`F:/0_tutorial_videos_project/docs/templates/shot_list.example.json`) with the extra per-segment fields the recording track defines: `scene`, `cue_target`, `deck_action`, `expect_state`.

Derive the segments from `plan/plan_manifest.json` and the scene notes in `plan/weekNN.txt`: one segment per pointer action on a cue target or per running process, in lecture order. The first segments operate the first Anchor's situation inside the opening window. The prediction pause is a hover over the options, narrated later as a prompt to pause the video. Every Bridge reveal is a click or hover. Static segments are the exception and carry a written reason.

Check before handing over: `python F:/0_tutorial_videos_project/tools/check_static_content.py cues/week-NN.json` must pass; every `cue_target` must exist in the deck (`lecture.cues` or a DOM query); every `expect_state` must match what Step produces in `record=1` mode. No spoken text belongs in the cue list; narration is written after the recording.
