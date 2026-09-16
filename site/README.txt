SOFTWARE ENGINEERING · LECTURE SITE
====================================

This folder is the complete student site. It works without a network connection.

START THE SITE
--------------
Supported route (a local HTTP server on your own computer; nothing leaves it):

    python scripts/serve.py --root site --port 8000
    then open http://127.0.0.1:8000/ in Chrome, Edge or Firefox

(Run the command from the folder that contains scripts/ and site/. Python 3.10 or newer;
no packages are needed for serving.) Opening the deck files directly by double-click
(file://) also works in Chrome for the current decks because they use plain script tags,
but the local server is the tested route.

The PDFs in pdf/ open directly; no server is needed for them.

FILES
-----
index.html                the course index: week, central question, scope, deck and PDF links
weeks/week-NN.html        one interactive deck per week (plus week-NN.js with that week's scenes)
shared/                   theme.css (dark theme), print.css (light print layout),
                          lecture-controls.js (pages, scene controls, modes, print), visual-components.js
assets/fixtures/          the teaching fixtures every deck renders (a copy of the plan's data)
vendor/                   pinned local libraries: Chart.js 4.5.1 (see THIRD_PARTY_NOTICES.txt)
pdf/week-NN.pdf           the student notes of each week, exported from the print view

USING A DECK
------------
Page navigation and scene controls are different things.

    Next / Previous page     Right or Left arrow, Page Down or Page Up, or the < > buttons.
                             They always change the page, even in the middle of a scene.
    Step / Back              Down or Up arrow, or the Step and Back buttons. They move the
                             demonstration on the page one state at a time and never change the page.
    Replay                   restarts the selected condition from its first state (key r).
    Reset                    returns to the baseline condition and the first state (Shift+R).
    Condition presets        change the demonstration's condition; the selected condition is
                             always written out in the Condition card.
    Overview / Help          the grid button or key o; the ? button or key ?.

Letter shortcuts (r, Shift+R, o, ?) can be switched off in the Help dialog; the setting is
kept in this browser only. Arrow keys inside a text field or slider are never captured.

Deep links: weeks/week-01.html#/two-confirmations opens that scene at its baseline, paused.
Reopening a scene always starts at its baseline.

Query modes: ?motion=off shows every state instantly (also automatic when the system asks
for reduced motion); ?print=1 shows the print view the PDFs are exported from; ?record=1 is
the deterministic timing mode used for recording.

Layout: the decks are designed at 1920 x 1080 and scale to the window.

ABOUT THE EXAMPLES
------------------
Campus Rooms is a fictional room-booking service. Every name, number and incident is a
teaching example unless a source is named on the page. Values marked "example assumption"
are illustrative, not measurements.
