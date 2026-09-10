# King of the Hill artwork

Retrieved on 2026-09-10 from the official Mortal Kombat 1 roster:
https://www.mortalkombat.com/en-us/roster

## Character portraits

`../fighters/portraits/{slug}.webp` (relative to this directory) contains the original `hero` image from
the official page's `data-roster` JSON for each of the 35 main fighters.
The image source pattern is:

`https://cdn-mk1.mortalkombat.com/roster/{slug}/hero.webp`

The exact source URL, downloaded byte length, dimensions and WebP alpha flag
for every image are recorded in `portrait-sources.json`.
All 35 downloaded images are WebP files, 1280 by 1280 pixels, with alpha.
The Scorpion image was visually inspected: the artwork extends below the waist,
so the page can crop and position the original image with CSS for a waist-up view.
The files retain their original downloaded bytes. The existing smaller roster
thumbnails remain available for the character picker.

`src/data/king-portrait-framing.json` records the nontransparent bounds of each
portrait's upper 742 pixels (king) and upper 640 pixels (challengers), with a
12-pixel margin clipped to that region. The board uses these as SVG viewBoxes
with `xMidYMax meet`, so wide silhouettes fit without stretching or spilling
out of the player area. Source images remain unchanged. Recalculate the framing
when replacing a portrait with different artwork.

Artwork belongs to the respective Mortal Kombat / Warner Bros. rights holders;
this source record does not assert an open license.

## VS mark

No verified Mortal Kombat 1 (2023) VS asset was found in the official roster page
or its main/roster JavaScript resources. The supplied Fandom page
https://mortalkombat.fandom.com/wiki/Mortal_Kombat_1 returned an access challenge
(HTTP 403 for direct retrieval; the web reader also could not load it).
Search results for generic Mortal Kombat VS PNGs did not establish MK1 provenance,
so no unrelated VS image has been included. A text VS treatment remains a
temporary interface treatment until an authentic asset is available.
