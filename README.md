# Judgle Suite - folder map

index.html, jed.html, rtinput.html, judgle.html, landings.html, qira.html   (pages)

css/   theme.css (colour tokens: dark / light / mono) + components.css (shared UI) + one file per page
js/    judgle-rules.js      scoring rules, input mappings, severity colours  <- edit CoP changes here
       judgle-storage.js    every localStorage key + safe helpers
       judgle-utils.js      escapeHtml, audio/haptic feedback, swipe classifier
       judgle-recognizer.js shared $P handwriting recogniser + saved patterns
       judgle-trainer.js    shared "train a digit" modal
       theme.js             theme switcher, home button, footer
       judgle-help.js       the ? button (top-right) and tabbed help sheet
       <page>.js            page-specific code
data/  videos.js (quiz videos)  resources.js (resource library)  <- add content here
       help.js (the wording of every tool's help window)  <- edit help text here
tests/ rules-test.html (open in a browser after editing rules; all lines should be green)
       run.js (same tests: node tests/run.js)

Footer line per page: <meta name="jg-footer" content="...">
Help per page:        <meta name="jg-help" content="rtinput">  (id must exist in data/help.js)
Scripts are classic (non-module) so the site also works when opened straight from disk.
