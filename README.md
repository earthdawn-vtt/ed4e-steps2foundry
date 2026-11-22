# Steps2Foundry
A Foundry VTT module to import characters created with [SecondStep](https://www.secondstep.dk/Steps/) into the [Earthdawn 4th Edition game system](https://foundryvtt.com/packages/earthdawn4e) in [Foundry VTT](https://foundryvtt.com/).


## Requirements
The module currently is built to only work with the [Earthdawn 4th Edition Player's Guide](https://foundryvtt.com/packages/earthdawn-pg-compendium) and the [Earthdawn 4th Edition Gamemaster's Guide](https://foundryvtt.com/packages/earthdawn-gm-compendium) (for Thread Items) which have to be activated in your game. This is because it contains all talents/skills/disciplines/namegivers/equipment/thread items and to avoid licensing issues.

It is tested with Second Step: _Development version (1β12.2)_


## How to Use
1. After installing and activating the module in your world, the GM's client creates the macro "Import from SecondStep" on the first start (see [Import Macro](#import-macro)). Drag it to your hotbar.

2. Run the macro: a dialog opens, asking you to select one or more files. Choose the \*.json files you downloaded from [SecondStep](https://www.secondstep.dk/Steps/), and click _Import_.

3. The module imports every file on its own, and you should see the new character sheet open on the screen.

4. Check if everything worked out and have a look at your import log in the Journals Directory ("Steps2Foundry Imports").

5. Done!


## Import Macro
On the first start, the module creates a script macro "Import from SecondStep" in your world (done by the active GM). The module remembers that it was created, so if you delete the macro, it does not come back. The macro is visible to everyone with at least Observer permission, which is the default. Drag it to your hotbar to start an import. You can select several files at once. Every import is logged in a journal of the importing user ("Steps2Foundry Imports"). The macro is just this:

```js
const importer = game.modules.get( "ed4e-steps2foundry" );
if ( !importer?.active ) return ui.notifications.error( "Steps2Foundry is not active." );
await importer.api.runImport();
```

### Permissions
- `MACRO_SCRIPT` (default: Player): everyone may run script macros.
- `ACTOR_CREATE` (default: Assistant GM): needed to create characters. Players cannot import by default, unless the GM grants this permission.
- `JOURNAL_CREATE` (default: Trusted Player): needed additionally for characters with a log.

Without these permissions, the import reports a clear error before anything is created.


## Tips & Tricks
- The module receives items in Foundry VTT from the compendia of the Player's Guide and the Gamemaster's Guide (see Requirements), which are the [official Earthdawn Compendia](https://shop.fasagames.com/index.php?main_page=index&cPath=1_102_167). Since there are no fixed naming conventions for these items (especially when it comes to things like Knowledge/Artisan Skills and the such), the importer might not find all listed items in the file. To check and edit these items, an import log is created as a Journal Entry ("Steps2Foundry Imports"). After importing, control this log to edit and finalize your character creation and add all missing items.
- The "Log" field from SecondStep is imported as the character's personal Journal Entry.
- Knacks are imported from the compendia; a knack that is not found is only created if it is clearly a knack ability (it has an attribute and no embedded spell ID, as improved spell knacks have), all others are listed as not imported in the log. Thread items are imported like any other equipment, and those that grant a matrix become a matrix with the attuned spell linked (as do talents with an attuned spell).
- If your SecondStep file has character art/an image, it can be automatically loaded. For this to be possible, the image has to come frome a valid absolute URL, that is, a publicly available internet site (the url you get when right-clicking an online image and select an option like "Show Image in New Tab").


## Fair Warnings
- This is somewhat of a beta version. There might be stuff not working right now. If you find this stuff, please open an issue here on github and I will try to take care of it as soon as possible.
- The module is currently only tested with files generated from the online version of SecondStep. Feel free to try it with the standalone application and let me know how it goes.


## Other stuff
I hope this helps, and don't hesitate to contact me with questions.

**You are great**
