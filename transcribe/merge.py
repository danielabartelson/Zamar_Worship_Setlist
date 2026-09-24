import importlib.util, sys, re

def load(path):
    spec = importlib.util.spec_from_file_location("mod", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.SONGS

all_songs = []
for i in range(1, 7):
    fname = "new_songs.py" if i == 1 else f"new_songs_{i}.py"
    all_songs.extend(load(f"/root/worship-app/transcribe/data/{fname}"))

# sanity: check duplicate ids
ids = {}
for s in all_songs:
    ids.setdefault(s["id"], []).append(s["title"])
dupes = {k: v for k, v in ids.items() if len(v) > 1}
if dupes:
    print("DUPLICATE IDS FOUND:", dupes)
    sys.exit(1)

print(f"Total new songs: {len(all_songs)}")

def js_string_escape(text):
    # escape backslashes, backticks, and ${ for template literal safety
    text = text.replace("\\", "\\\\")
    text = text.replace("`", "\\`")
    text = text.replace("${", "\\${")
    return text

entries = []
for s in all_songs:
    key = s.get("key", "")
    tempo = s.get("tempo", "slow")
    text = js_string_escape(s["text"])
    title_escaped = s["title"].replace('"', '\\"')
    entry = '  {\n'
    entry += f'    id: "{s["id"]}",\n'
    entry += f'    title: "{title_escaped}",\n'
    entry += f'    key: "{key}",\n'
    entry += f'    tempo: "{tempo}",\n'
    entry += '    lines: lines(\n'
    entry += f'`{text}`\n'
    entry += '    ),\n'
    entry += '  },'
    entries.append(entry)

js_block = "\n".join(entries)

with open("/root/worship-app/src/data/sampleSongs.js", "r") as f:
    content = f.read()

# Replace closing of array: find the last "  },\n];" and insert before "];"
marker = "\n];\n"
idx = content.rfind(marker)
if idx == -1:
    print("Could not find array closing marker")
    sys.exit(1)

new_content = content[:idx] + "\n" + js_block + content[idx:]

# Update header comment
old_header = """// The Potter's House (Ogden) worship song library.
//
// This is batch 1 of the transcription (the "A" section, 14 songs) --
// the rest of the ~130-song library is being transcribed in the
// background and will be merged in as it completes.
//
// tempo is an initial best guess (fast / slow / offering) -- use the
// Song Library screen in the app to correct any of these; corrections
// save per-device and don't require re-editing this file."""

new_header = """// The Potter's House (Ogden) worship song library.
//
// Transcribed from scanned lyric/chord sheets. tempo is an initial best
// guess (fast / slow / offering) -- use the Song Library screen in the
// app to correct any of these; corrections save per-device and don't
// require re-editing this file.
//
// Two songs could not be transcribed due to a repeated read error on
// their source images and are NOT included here: "Breathe On Me.jpg"
// and "Give Thanks.jpg". These will need to be re-scanned/re-uploaded
// and added via the "Add Song" screen, or retried later."""

new_content = new_content.replace(old_header, new_header)

with open("/root/worship-app/src/data/sampleSongs.js", "w") as f:
    f.write(new_content)

print("Done. New file length:", len(new_content))
