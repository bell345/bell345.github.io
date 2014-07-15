bell345.github.io
=================

This is the website and platform that I will be uploading my work and prototype code for all of the world to see. Not much else to say about it, really.

If you are here to copy/edit my code; `/assets/js/tbi.js` is the site-wide code used by everything, and `/assets/js/proto.js` is the code for the prototypes.

Each individual application (inside of `/apps/`) does not depend on the `/assets/` folder; rather, they use a seperate `./assets/` folder inside of each application sub-folder that contains a similar hierarchy to the main asset folder. This conserves code by only including what it uses and makes sure that the applications can be directly lifted out of the website and into standalone applications.