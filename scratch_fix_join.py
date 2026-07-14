import os

with open('scripts/supabase.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(".select('*, profiles(full_name)')", ".select('*, profiles!seller_id(full_name)')")
content = content.replace(".select('*, profiles(full_name, is_verified)')", ".select('*, profiles!seller_id(full_name, is_verified)')")

with open('scripts/supabase.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced join clauses in supabase.js")
