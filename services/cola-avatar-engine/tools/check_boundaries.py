from pathlib import Path
import re
root = Path(__file__).resolve().parents[3]
for directory in (root / "src", root / "dist"):
    for path in directory.rglob("*"):
        if path.suffix not in (".ts", ".tsx", ".js", ".json"): continue
        if ".test." in path.name: continue
        content = path.read_text()
        assert not re.search(r"OPENAI_API_KEY|MINIMAX_API_KEY|AVATAR_JWT_SECRET|api\.openai\.com|private_context|unreleased_information|@heygen|api\.liveavatar", content), str(path)
for path in (root / "src/shiba/digital-human").rglob("*.ts"):
    if ".test." in path.name: continue
    assert not re.search(r'from ["\x27](react|@/live|@/integrations|@supabase)', path.read_text()), str(path)
print("Browser secret/profile and runtime dependency boundaries passed.")
