import sqlite3
import json

# שם קובץ ה-DB שלך
DB_FILE = "monitor_data.db"

# התחברות למסד
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()

# בדוק איך קוראים לטבלה ולעמודות שלך
# דוגמה להוציא רשומה אחת
cursor.execute("SELECT * FROM snapshots LIMIT 1")
row = cursor.fetchone()

# הצג את השורה השלמה
print("Raw row:")
print(row)

# אם העמודה הרלוונטית שלך היא JSON
# שנה את האינדקס לפי המבנה האמיתי
try:
    data_json = json.loads(row[1])  # או row[0] תלוי במבנה שלך
    print("\nParsed JSON:")
    print(json.dumps(data_json, indent=2))
except Exception as e:
    print("Error parsing JSON:", e)

conn.close()
