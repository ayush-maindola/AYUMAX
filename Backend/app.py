
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from google import genai

app = Flask(__name__)

load_dotenv()

client = genai.Client()

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
)

app.secret_key = "AYUMAX-local-development-secret-change-later"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False


# Database connection
def get_db_connection():
    connection = sqlite3.connect("backend/nebula.db")
    connection.row_factory = sqlite3.Row
    return connection


# Create database tables
def init_db():
    connection = get_db_connection()

    # Existing assessments table code
    connection.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            age INTEGER NOT NULL,
            symptoms TEXT NOT NULL,
            duration TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # Existing users table code
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    """)

    columns = [
        row["name"]
        for row in connection.execute(
            "PRAGMA table_info(assessments)"
        ).fetchall()
    ]

    if "user_id" not in columns:
        connection.execute("""
            ALTER TABLE assessments
            ADD COLUMN user_id INTEGER REFERENCES users(id)
        """)

    connection.commit()
    connection.close()


@app.route("/")
def home():
    return "AYUMAX Backend is running!"


# SIGNUP API
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid request"}), 400

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    hashed_password = generate_password_hash(password)

    try:
        connection = get_db_connection()

        cursor = connection.execute("""
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)
        """, (username, email, hashed_password))

        connection.commit()

        # Automatically login after signup
        session["user_id"] = cursor.lastrowid

        connection.close()

        return jsonify({
            "status": "success",
            "message": "Account created successfully!"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "Username or email already exists"
        }), 409


# LOGIN API
@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid request"}), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    connection = get_db_connection()

    user = connection.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    connection.close()

    if user is None or not check_password_hash(user["password"], password):
        return jsonify({
            "error": "Invalid email or password"
        }), 401

    session["user_id"] = user["id"]

    return jsonify({
        "status": "success",
        "message": "Login successful!",
        "username": user["username"]
    })


# SYMPTOM CHECKER API
@app.route("/check-symptoms", methods=["POST"])
def check_symptoms():

    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid request"}), 400

    age = data.get("age")

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Please login first"}), 401
    

    symptoms = data.get("symptoms")
    duration = data.get("duration")

    if not age or not symptoms or not duration:
        return jsonify({"error": "All fields are required"}), 400

    connection = get_db_connection()

    cursor = connection.execute("""
    INSERT INTO assessments
    (age, symptoms, duration, created_at, user_id)
    VALUES (?, ?, ?, ?, ?)
""", (
    int(age),
    symptoms,
    duration,
    datetime.now().isoformat(timespec="seconds"),
    user_id
))

    assessment_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return jsonify({
        "status": "success",
        "message": "Assessment saved successfully!",
        "assessment_id": assessment_id
    })

# CURRENT USER API
@app.route("/me", methods=["GET"])
def current_user():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    connection = get_db_connection()

    user = connection.execute(
        "SELECT username FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    connection.close()

    if user is None:
        session.clear()
        return jsonify({"error": "User not found"}), 401

    return jsonify({
        "username": user["username"]
    })

# LOGOUT API
@app.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully!"
    })

# HISTORY API
@app.route("/history", methods=["GET"])
def get_history():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    connection = get_db_connection()

    records = connection.execute("""
        SELECT * FROM assessments
        WHERE user_id = ?
        ORDER BY id DESC
    """, (user_id,)).fetchall()

    connection.close()

    return jsonify([dict(record) for record in records])





# AI SYMPTOM ANALYSIS API
@app.route("/analyze-symptoms", methods=["POST"])
def analyze_symptoms():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}

    age = data.get("age")
    symptoms = data.get("symptoms", "").strip()
    duration = data.get("duration", "").strip()

    if not symptoms or not duration or age is None:
        return jsonify({"error": "All fields are required"}), 400

    try:
        age = int(age)
        if age < 0 or age > 120:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"error": "Please enter a valid age"}), 400

    if len(symptoms) > 2000:
        return jsonify({"error": "Symptoms are too long"}), 400

    prompt = f"""
    You are AYUMAX, an AI health information assistant.

    User information:
    Age: {age}
    Symptoms: {symptoms}
    Duration: {duration}

    Provide a cautious, easy-to-understand health information response.

    Include:
    1. Possible explanations, not a diagnosis.
    2. General self-care guidance where appropriate.
    3. When to consult a healthcare professional.
    4. Emergency warning signs and when to seek urgent care.

    Never claim certainty or prescribe medication.
    If symptoms suggest an emergency, clearly advise immediate
    emergency medical care.

    Use simple language and clear headings.
    """

    try:
        response = client.models.generate_content(
        
        
            model="gemini-3.5-flash-lite",
            contents=prompt
        )

        print("GEMINI RESPONSE:", repr(response.text))

        return jsonify({
            "status": "success",
            "analysis": response.text
        })

    except Exception as error:
        print("Gemini API Error:", error)
        return jsonify({
            "error": "AI analysis is temporarily unavailable."
        }), 503
    

if __name__ == "__main__":
    init_db()
    app.run(debug=True)   