import streamlit as st
import random
from streamlit_ace import st_ace
import json
import os
import time
import subprocess
import tempfile
import hashlib
import re
from typing import List, Tuple, Dict, Any
from improved_coding_assistent import (
    setup_coding_assistant, update_assistant_context, track_coding_activity,
    track_execution_result, check_for_hint_triggers, get_hint_on_error,
    get_hint_on_submission_failure, get_hint_stats, configure_groq_settings
)

# Constants
PROBLEM_FILE = "problems.json"
USER_FILE = "users.json"
TEST_HISTORY_FILE = "test_history.json"
LANGUAGES = {
    "Python": {
        "ext": ".py",
        "filename": "solution",
        "command": ["python", "solution.py"],
        "mode": "python",
        "template": "# Read input\nn = int(input())\n# Your code here\nprint(result)"
    },
    "C++": {
        "ext": ".cpp",
        "filename": "solution",
        "command": ["g++", "solution.cpp", "-o", "solution"],
        "mode": "c_cpp",
        "template": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}"
    },
    "Java": {
        "ext": ".java",
        "filename": "Solution",
        "command": ["javac", "Solution.java"],
        "mode": "java",
        "template": "public class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}"
    },
    "JavaScript": {
        "ext": ".js",
        "filename": "solution",
        "command": ["node", "solution.js"],
        "mode": "javascript",
        "template": "// Read input from stdin\nconst readline = require('readline');\nconst rl = readline.createInterface({\n  input: process.stdin,\n  output: process.stdout\n});\n\nrl.on('line', (line) => {\n  // Your code here\n  console.log(result);\n  rl.close();\n});"
    }
}

# Page Configuration
st.set_page_config(page_title="DeepHire", layout="wide")
st.markdown("""
    <style>
        /* Modern Gradient Background */
        .stApp { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        
        /* Card-like Containers */
        .problem-card, .editor-container, .test-results {
            background: white;
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 1.5rem;
        }
        
        /* Difficulty Badges */
        .difficulty-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.8rem;
        }
        .easy-badge { background: #e8f5e9; color: #2e7d32; }
        .medium-badge { background: #fff3e0; color: #ef6c00; }
        .hard-badge { background: #ffebee; color: #c62828; }
        
        /* AI Assistant Bubble */
        .ai-assistant {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 1rem;
            position: relative;
            margin: 1rem 0;
            border-left: 4px solid #17a2b8;
        }
        .ai-assistant::before {
            content: '🤖';
            position: absolute;
            left: -35px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.5rem;
        }
        
        /* Progress Indicators */
        .progress-ring {
            width: 80px;
            height: 80px;
            transform: rotate(-90deg);
        }
        .progress-ring-circle {
            transition: stroke-dashoffset 0.3s;
        }
        
        /* Timer styles */
        .timer-display {
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            padding: 0.5rem;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.8);
            margin-bottom: 1rem;
        }
        
        /* Navigation styles */
        .nav-button {
            width: 100%;
            margin-bottom: 0.5rem;
        }
        
        /* Pill style for tags */
        .pill {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            background: #f0f0f0;
            margin-right: 0.5rem;
            font-size: 0.8rem;
        }
        
        /* Highlight recent activity */
        .recent-activity {
            background: #fff8e1;
            border-left: 3px solid #ffc107;
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            border-radius: 0 5px 5px 0;
        }
        
        /* Test mode styles */
        .test-mode-banner {
            background: linear-gradient(90deg, #4b6cb7 0%, #182848 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        /* Feedback buttons */
        .feedback-btn {
            padding: 0.25rem 0.5rem;
            margin: 0 0.25rem;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            transition: all 0.3s;
        }
        .feedback-btn:hover {
            transform: scale(1.1);
        }
        
        /* Code submission status */
        .submission-status {
            text-align: center;
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
        }
        .submission-success {
            background: #e8f5e9;
            border: 1px solid #2e7d32;
        }
        .submission-partial {
            background: #fff3e0;
            border: 1px solid #ef6c00;
        }
        .submission-failure {
            background: #ffebee;
            border: 1px solid #c62828;
        }
    </style>
""", unsafe_allow_html=True)

# Security Functions
def hash_password(password: str) -> str:
    """Hash a password for storing."""
    salt = "deephire"  # In production, use a proper salt strategy
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    return stored_password == hash_password(provided_password)

# User Management Functions
def load_users() -> Dict[str, Dict[str, Any]]:
    """Load users from JSON file with error handling."""
    try:
        if not os.path.exists(USER_FILE):
            return {}
        with open(USER_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        st.error("Error loading user data. Please contact support.")
        return {}

def save_users(users: Dict[str, Dict[str, Any]]) -> None:
    """Save users to JSON file."""
    with open(USER_FILE, "w") as f:
        json.dump(users, f)

def register_user(username: str, password: str) -> bool:
    """Register a new user with validation."""
    # Input validation
    if not (3 <= len(username) <= 20 and re.match(r'^[a-zA-Z0-9_]+$', username)):
        st.error("Username must be 3-20 characters and contain only letters, numbers, and underscores.")
        return False
    
    if len(password) < 6:
        st.error("Password must be at least 6 characters long.")
        return False
    
    users = load_users()
    if username in users:
        return False
        
    users[username] = {
        "password": hash_password(password),
        "solved_problems": [],
        "attempts": {},
        "hint_usage": {
            "total_hints": 0,
            "basic_hints": 0,
            "advanced_hints": 0
        },
        "test_history": [],
        "joined_date": time.strftime("%Y-%m-%d"),
        "last_login": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    save_users(users)
    return True

def authenticate_user(username: str, password: str) -> bool:
    """Authenticate a user and update last login time."""
    users = load_users()
    if username not in users:
        return False
    
    is_valid = verify_password(users[username]["password"], password)
    if is_valid:
        # Update last login time
        users[username]["last_login"] = time.strftime("%Y-%m-%d %H:%M:%S")
        save_users(users)
        
    return is_valid

def update_user_progress(username: str, problem_id: int, status: str, hint_stats: Dict[str, int] = None) -> None:
    """Update user's progress on a problem with hint usage tracking."""
    users = load_users()
    if username not in users:
        return
    
    if status == "solved":
        if problem_id not in users[username]["solved_problems"]:
            users[username]["solved_problems"].append(problem_id)
    
    # Update attempts count
    users[username]["attempts"][str(problem_id)] = users[username]["attempts"].get(str(problem_id), 0) + 1
    
    # Update hint usage if provided
    if hint_stats:
        if "hint_usage" not in users[username]:
            users[username]["hint_usage"] = {
                "total_hints": 0,
                "basic_hints": 0,
                "advanced_hints": 0
            }
        
        users[username]["hint_usage"]["total_hints"] += hint_stats.get("total_hints", 0)
        users[username]["hint_usage"]["basic_hints"] += hint_stats.get("basic_hints", 0)
        users[username]["hint_usage"]["advanced_hints"] += hint_stats.get("advanced_hints", 0)
        
        # Add problem-specific hint usage
        if "problem_hints" not in users[username]:
            users[username]["problem_hints"] = {}
            
        users[username]["problem_hints"][str(problem_id)] = hint_stats
    
    save_users(users)

def save_test_results(username: str, test_data: Dict[str, Any]) -> None:
    """Save test results to user history."""
    users = load_users()
    if username not in users:
        return
    
    # Initialize test history if it doesn't exist
    if "test_history" not in users[username]:
        users[username]["test_history"] = []
    
    # Add timestamp
    test_data["timestamp"] = time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Save to user's test history
    users[username]["test_history"].append(test_data)
    
    # Limit to last 10 tests
    users[username]["test_history"] = users[username]["test_history"][-10:]
    
    save_users(users)

def get_user_progress(username: str) -> Dict[str, Any]:
    """Get user's progress data."""
    users = load_users()
    return users.get(username, {
        "solved_problems": [],
        "attempts": {},
        "hint_usage": {
            "total_hints": 0,
            "basic_hints": 0,
            "advanced_hints": 0
        },
        "test_history": []
    })

# AI Assistant Configuration
def groq_settings_ui() -> None:
    """UI for Groq API configuration with better UX."""
    with st.sidebar.expander("🧠 AI Assistant Settings"):
        # Improvement: Add explanation of AI assistant capabilities
        st.caption("Configure the AI-powered hint system to help you solve coding challenges")
        
        groq_api_key = st.text_input("Groq API Key", type="password", 
                                    value=st.session_state.get("groq_api_key", ""))
        
        groq_model = st.selectbox(
            "Groq Model",
            ["llama-3.3-70b-versatile", "llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768"],
            index=0
        )
        
        hint_frequency = st.slider("Hint Frequency", 1, 10, 5, 
                                 help="Higher values mean fewer automatic hints")
        
        if st.button("Save Settings"):
            st.session_state["groq_api_key"] = groq_api_key
            st.session_state["hint_frequency"] = hint_frequency
            configure_groq_settings(st, groq_api_key, groq_model)
            st.success("AI Assistant settings updated!")
            
    # Show hint statistics if assistant is configured
    if 'coding_assistant' in st.session_state and st.session_state.coding_assistant.use_groq_for_hints:
        stats = get_hint_stats(st)
        
        # Display metrics in a more visually appealing way
        with st.sidebar.container():
            st.markdown("### 🤖 AI Assistant Stats")
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Total Hints", f"{stats['total_hints']}")
            with col2:
                st.metric("Accuracy", f"{stats.get('accuracy', 0)}%")
            
            # Progress bar for basic vs advanced hints
            if stats['total_hints'] > 0:
                basic_ratio = stats['basic_hints'] / stats['total_hints']
                st.markdown(f"""
                    <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                        <div style="flex-grow: 1; height: 8px; border-radius: 4px; background: #eee; margin-right: 0.5rem;">
                            <div style="width: {basic_ratio*100}%; height: 100%; background: #17a2b8; border-radius: 4px;"></div>
                        </div>
                        <div style="font-size: 0.8rem;">
                            Basic: {stats['basic_hints']} | Advanced: {stats['advanced_hints']}
                        </div>
                    </div>
                """, unsafe_allow_html=True)

def show_auth_forms() -> None:
    """Show login and registration forms with improved UI."""
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Branding and welcome message
        st.markdown("""
            <div style="text-align: center; padding: 2rem 1rem;">
                <h1 style="color: #4b6cb7;">Welcome to DeepHire</h1>
                <p style="font-size: 1.1rem;">The AI-powered coding assessment platform for modern tech recruitment</p>
            </div>
        """, unsafe_allow_html=True)
        
        # Features highlight
        st.markdown("""
            <div style="display: flex; justify-content: space-between; margin: 2rem 0;">
                <div style="flex: 1; text-align: center; padding: 1rem; margin: 0 0.5rem;">
                    <div style="font-size: 2rem; color: #4b6cb7; margin-bottom: 0.5rem;">🧠</div>
                    <h3>AI-Powered Hints</h3>
                    <p>Get personalized guidance when stuck on coding problems</p>
                </div>
                <div style="flex: 1; text-align: center; padding: 1rem; margin: 0 0.5rem;">
                    <div style="font-size: 2rem; color: #4b6cb7; margin-bottom: 0.5rem;">📊</div>
                    <h3>Skill Assessment</h3>
                    <p>Evaluate your coding skills with adaptive difficulty</p>
                </div>
                <div style="flex: 1; text-align: center; padding: 1rem; margin: 0 0.5rem;">
                    <div style="font-size: 2rem; color: #4b6cb7; margin-bottom: 0.5rem;">📈</div>
                    <h3>Progress Tracking</h3>
                    <p>Monitor your learning journey with detailed analytics</p>
                </div>
            </div>
        """, unsafe_allow_html=True)
    
    with col2:
        tab1, tab2 = st.tabs(["Login", "Register"])
        
        with tab1:
            with st.form("login_form"):
                st.markdown("<h3 style='text-align: center;'>Sign In</h3>", unsafe_allow_html=True)
                username = st.text_input("Username", key="login_username")
                password = st.text_input("Password", type="password", key="login_password")
                remember = st.checkbox("Remember me")
                
                if st.form_submit_button("Login", use_container_width=True):
                    if not username or not password:
                        st.error("Please enter both username and password")
                    elif authenticate_user(username, password):
                        st.session_state["authenticated"] = True
                        st.session_state["username"] = username
                        st.success("Login successful!")
                        time.sleep(1)  # Brief pause for better UX
                        st.experimental_rerun()
                    else:
                        st.error("Invalid username or password")
        
        with tab2:
            with st.form("register_form"):
                st.markdown("<h3 style='text-align: center;'>Create Account</h3>", unsafe_allow_html=True)
                new_username = st.text_input("Choose Username", key="register_username")
                st.caption("3-20 characters, letters, numbers and underscores only")
                
                new_password = st.text_input("Create Password", type="password", key="register_password")
                st.caption("At least 6 characters")
                
                confirm_password = st.text_input("Confirm Password", type="password", key="confirm_password")
                agree_terms = st.checkbox("I agree to the Terms of Service")
                
                if st.form_submit_button("Register", use_container_width=True):
                    if not new_username or not new_password or not confirm_password:
                        st.error("Please fill in all fields")
                    elif not agree_terms:
                        st.error("You must agree to the Terms of Service")
                    elif new_password != confirm_password:
                        st.error("Passwords do not match")
                    elif register_user(new_username, new_password):
                        st.success("Registration successful! Please login.")
                    else:
                        st.error("Username already exists or invalid format")

# Problem Management Functions
def load_problems() -> List[Dict[str, Any]]:
    """Load problems from JSON file with error handling."""
    try:
        if not os.path.exists(PROBLEM_FILE):
            return []
        with open(PROBLEM_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, IOError) as e:
        st.error(f"Error loading problems: {str(e)}")
        return []

def get_problems_by_difficulty(difficulty: str) -> List[Dict[str, Any]]:
    """Filter problems by difficulty level."""
    return [p for p in load_problems() if p["difficulty"].lower() == difficulty.lower()]

def get_problem_by_id(problem_id: int) -> Dict[str, Any]:
    """Get problem by ID using efficient generator."""
    return next((p for p in load_problems() if p["id"] == problem_id), None)

def get_problems_by_tag(tag: str) -> List[Dict[str, Any]]:
    """Filter problems by tag."""
    return [p for p in load_problems() if tag.lower() in [t.lower() for t in p.get("tags", [])]]

def get_recommended_problems(username: str, limit: int = 3) -> List[Dict[str, Any]]:
    """Get recommended problems based on user's progress and skill level."""
    user_progress = get_user_progress(username)
    solved_problems = user_progress.get("solved_problems", [])
    hint_usage = user_progress.get("hint_usage", {})
    
    # Determine user's skill level based on solved problems difficulty
    all_problems = load_problems()
    solved_difficulties = [p["difficulty"] for p in all_problems if p["id"] in solved_problems]
    
    # Count by difficulty
    easy_count = solved_difficulties.count("Easy")
    medium_count = solved_difficulties.count("Medium")
    hard_count = solved_difficulties.count("Hard")
    
    # Determine user's primary skill level
    if hard_count > 5:
        target_difficulty = "Hard"
    elif medium_count > 10 or (easy_count > 15 and medium_count > 3):
        target_difficulty = "Medium"
    else:
        target_difficulty = "Easy"
    
    # Get unsolved problems of the target difficulty
    unsolved = [p for p in all_problems if p["id"] not in solved_problems and p["difficulty"] == target_difficulty]
    
    # Sort by potential relevance based on tags of previously solved problems
    solved_tags = []
    for p in all_problems:
        if p["id"] in solved_problems:
            solved_tags.extend(p.get("tags", []))
    
    # Count tag frequency
    tag_counts = {}
    for tag in solved_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Score unsolved problems based on tag relevance
    for problem in unsolved:
        problem["relevance_score"] = sum(tag_counts.get(tag, 0) for tag in problem.get("tags", []))
    
    # Sort by relevance and return top recommendations
    recommended = sorted(unsolved, key=lambda p: p.get("relevance_score", 0), reverse=True)
    return recommended[:limit]

# Code Execution and Evaluation Functions
def execute_code(user_code: str, language: str, input_data: str = "") -> Tuple[str, str]:
    """Execute user code in a secure temporary directory with improved error handling."""
    with tempfile.TemporaryDirectory() as temp_dir:
        lang_config = LANGUAGES[language]
        code_path = os.path.join(temp_dir, lang_config["filename"] + lang_config["ext"])
        
        # Write code to file
        try:
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(user_code)
        except Exception as e:
            return "", f"⚠️ Error writing code file: {str(e)}"

        # Compilation step for compiled languages
        compile_error = None
        if language in ["C++", "Java"]:
            try:
                compile_cmd = lang_config["command"] if language == "Java" else ["g++", code_path, "-o", os.path.join(temp_dir, "solution")]
                result = subprocess.run(compile_cmd, check=True, capture_output=True, text=True, cwd=temp_dir)
                if result.stderr:
                    return "", result.stderr.strip()
            except subprocess.CalledProcessError as e:
                return "", e.stderr.strip()
            except Exception as e:
                return "", str(e)

        # Prepare execution command
        try:
            if language == "C++":
                run_cmd = [os.path.join(temp_dir, "solution")]
            elif language == "Java":
                run_cmd = ["java", "-cp", temp_dir, lang_config["filename"].removesuffix(".java")]
            elif language == "JavaScript":
                run_cmd = ["node", code_path]
            else:
                run_cmd = ["python", code_path]

            # Execute the code with timeout
            result = subprocess.run(
                run_cmd,
                input=input_data,
                text=True,
                capture_output=True,
                timeout=5,
                cwd=temp_dir
            )
            
            # Capture both stdout and stderr
            output = result.stdout.strip()
            error = result.stderr.strip()
            
            # Handle JavaScript specific stdout/stderr combination
            if language == "JavaScript" and error:
                if "SyntaxError" in error or "ReferenceError" in error:
                    return "", error
                else:
                    output = f"{output}\n{error}" if output else error
                    return output, ""
                    
            return output, error
            
        except subprocess.TimeoutExpired:
            return "", "⏳ Timeout Error: Execution exceeded 5 seconds"
        except Exception as e:
            return "", f"⚠️ Unexpected Error: {str(e)}"

def evaluate_submission(user_code: str, test_cases: List[Dict[str, str]], language: str) -> Tuple[List[Tuple], List[Dict]]:
    """Evaluate user code against all test cases with performance metrics."""
    results = []
    failed_cases = []
    execution_times = []
    
    for case_id, test_case in enumerate(test_cases, 1):
        input_data = test_case["input"]
        expected = test_case["expected_output"].strip()
        
        # Measure execution time
        start_time = time.time()
        output, error = execute_code(user_code, language, input_data)
        execution_time = time.time() - start_time
        execution_times.append(execution_time)
        
        if error:
            status = "❌ Failed"
            output = f"{error}\n{output}".strip()
        else:
            # Normalize whitespace and line endings for comparison
            normalized_output = re.sub(r'\s+', ' ', output).strip()
            normalized_expected = re.sub(r'\s+', ' ', expected).strip()
            
            status = "✅ Passed" if normalized_output == normalized_expected else "❌ Failed"
        
        results.append((case_id, status, output, expected, execution_time))
        if status == "❌ Failed":
            failed_cases.append({
                "id": case_id,
                "input": input_data,
                "output": output,
                "expected": expected,
                "result": error if error else "Output mismatch",
                "execution_time": execution_time
            })
            
            # Track execution result for the assistant
            track_execution_result(st, user_code, language, 
                                  error if error else "Output mismatch",
                                  {"id": case_id, "input": input_data})
    
    # Calculate performance metrics
    avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
    max_execution_time = max(execution_times) if execution_times else 0
    
    # Return with performance data
    return results, failed_cases, {
        "avg_execution_time": avg_execution_time,
        "max_execution_time": max_execution_time,
        "passed": len(results) - len(failed_cases),
        "total": len(results)
    }

def display_problem(problem: Dict[str, Any]) -> None:
    """Display problem information with enhanced visual design."""
    with st.container():
        st.markdown(f"""
            <div class='problem-card'>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">{problem['title']}</h2>
                    <span class='difficulty-badge {problem['difficulty'].lower()}-badge'>
                        {problem['difficulty']}
                    </span>
                </div>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <div class='pill'>🏷️ {', '.join(problem['tags'])}</div>
                    <div class='pill'>✅ {len(problem['test_cases'])} Test Cases</div>
                </div>
                {problem["statement"]}
            </div>
        """, unsafe_allow_html=True)
        
        with st.expander("📚 Sample Input & Output", expanded=True):
            for idx, tc in enumerate(problem["test_cases"][:2], 1):
                st.markdown(f"**Sample {idx}**")
                with st.container():
                    col1, col2 = st.columns(2)
                    with col1:
                        st.code(f"Input:\n{tc['input']}", language="text")
                    with col2:
                        st.code(f"Output:\n{tc['expected_output']}", language="text")
                        
        # Add more resources and hints for problem
        if problem.get("resources"):
            with st.expander("📖 Additional Resources", expanded=False):
                for resource in problem.get("resources", []):
                    st.markdown(f"- {resource}")
                    
        if problem.get("hints"):
            with st.expander("💡 Starting Hints", expanded=False):
                st.warning("These are general hints to get you started. For more specific help, use the AI assistant.")
                for hint in problem.get("hints", []):
                    st.markdown(f"- {hint}")

def initialize_session_state() -> None:
    """Initialize session state variables with improved defaults."""
    defaults = {
        "start_time": None,
        "timer_running": False,
        "current_code": "",
        "current_problem": None,
        "current_language": "Python",
        "last_hint_check": time.time(),
        "hint_frequency": 5,  # Default hint check frequency (lower = more frequent)
        "show_hints": True,   # Allow user to toggle hints on/off
        "test_mode_expanded": False,  # For test mode UI
        "feedback_given": {},  # Track when feedback is given on hints
        "code_history": [],   # Track code versions
        "editor_layout": "split",  # Layout preference
        "theme": "light",     # Theme preference
        "notifications": []   # System notifications
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

def display_hint(hint_data: Dict[str, str]) -> None:
    """Show hint in a modal pop-up instead of sidebar."""
    # Store hint data in session state to trigger modal
    st.session_state.active_hint = hint_data

def show_hint_modal() -> None:
    """Display hint in a centered modal pop-up."""
    if 'active_hint' not in st.session_state or not st.session_state.active_hint:
        return

    hint_data = st.session_state.active_hint
    hint_id = hashlib.md5(json.dumps(hint_data).encode()).hexdigest()[:6]

    # Modal overlay styling
    st.markdown(f"""
        <style>
            .hint-modal {{
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 0 20px rgba(0,0,0,0.2);
                z-index: 1000;
                width: 80%;
                max-width: 600px;
            }}
            .hint-overlay {{
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 999;
            }}
        </style>
        <div class="hint-overlay" onclick="document.querySelector('.hint-modal').style.display='none';"></div>
        <div class="hint-modal">
    """, unsafe_allow_html=True)

    # Modal content
    with st.container():
        st.markdown(f"""
            <div class='ai-assistant'>
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <div style="font-size: 1.2rem; margin-right: 0.5rem;">💡</div>
                    <strong>{hint_data.get('type', 'General').title()} Hint</strong>
                    <div style="flex-grow: 1; text-align: right;">
                        <button onclick="document.querySelector('.hint-modal').style.display='none';" 
                                style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">
                            ×
                        </button>
                    </div>
                </div>
                <div style="margin-left: 1.5rem;">
                    {hint_data.get('content', '')}
                </div>
            </div>
        """, unsafe_allow_html=True)

        # Feedback system
        feedback_key = f"hint_feedback_{hint_id}"
        if feedback_key not in st.session_state.feedback_given:
            st.session_state.feedback_given[feedback_key] = None

        if st.session_state.feedback_given[feedback_key] is None:
            cols = st.columns([1, 1, 4])
            with cols[0]:
                if st.button("👍 Helpful", key=f"helpful_{hint_id}"):
                    st.session_state.feedback_given[feedback_key] = "helpful"
                    track_hint_feedback(st.session_state.username, hint_id, "helpful")
                    del st.session_state.active_hint
                    st.rerun()
            with cols[1]:
                if st.button("👎 Not Helpful", key=f"noth_{hint_id}"):
                    st.session_state.feedback_given[feedback_key] = "not_helpful"
                    track_hint_feedback(st.session_state.username, hint_id, "not_helpful")
                    del st.session_state.active_hint
                    st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

def track_hint_feedback(username: str, hint_id: str, feedback: str) -> None:
    """Track user feedback on hints in their profile."""
    users = load_users()
    if username in users:
        if "hint_feedback" not in users[username]:
            users[username]["hint_feedback"] = {}
        
        users[username]["hint_feedback"][hint_id] = {
            "feedback": feedback,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        save_users(users)

def initialize_test_session():
    """Initialize session state for test mode"""
    if 'test_mode' not in st.session_state:
        st.session_state.test_mode = False
        st.session_state.test_start_time = None
        st.session_state.test_questions = []
        st.session_state.current_test_question = 0
        st.session_state.test_scores = []
        st.session_state.test_hints_used = []

def calculate_score(time_taken, hints_used, difficulty):
    """Calculate score based on time taken and hints used"""
    base_score = {"Easy": 100, "Medium": 200, "Hard": 300}[difficulty]
    time_penalty = max(0, (time_taken - 300) // 60) * 5  # 5 points penalty per minute over 5 mins
    hint_penalty = hints_used * 20  # 20 points per hint
    final_score = max(0, base_score - time_penalty - hint_penalty)
    return final_score

def take_test_mode():
    """Handle the test mode interface"""
    st.title("DeepHire - Coding Assessment")
    
    # Sidebar with test info
    with st.sidebar:
        st.header("Test Information")
        st.write(f"Welcome, {st.session_state['username']}!")
        st.write("Time Limit: 45 minutes")
        st.write(f"Questions: {len(st.session_state.test_questions)}")
        st.write(f"Current Question: {st.session_state.current_test_question + 1}")
        
        if st.session_state.test_start_time:
            elapsed = int(time.time() - st.session_state.test_start_time)
            remaining = max(0, 2700 - elapsed)  # 45 minutes = 2700 seconds
            st.write(f"Time Remaining: {remaining//60:02d}:{remaining%60:02d}")

    # Initialize test if not started
    if not st.session_state.test_questions:
        easy_problems = get_problems_by_difficulty("Easy")
        st.session_state.test_questions = [random.choice(easy_problems)]
        st.session_state.test_start_time = time.time()
        st.session_state.test_hints_used = [0]
        st.session_state.current_test_question = 0

    current_problem = st.session_state.test_questions[st.session_state.current_test_question]
    
    # Main layout
    col1, col2 = st.columns([1, 2], gap="large")
    
    with col1:
        display_problem(current_problem)
        
        # Hint tracking
        current_time = time.time()
        if current_time - st.session_state.last_hint_check > 10:
            hint_data = check_for_hint_triggers(st)
            st.session_state.last_hint_check = current_time
            if hint_data:
                st.session_state.test_hints_used[-1] += 1
                display_hint(hint_data)

    with col2:
        st.header("Code Editor")
        language = st.selectbox("Language", list(LANGUAGES.keys()),
                              key=f"test_lang_{st.session_state.current_test_question}")
        
        code_key = f"test_editor_{current_problem['id']}_{language}"
        if f"test_code_{current_problem['id']}" not in st.session_state:
            st.session_state[f"test_code_{current_problem['id']}"] = LANGUAGES[language]["template"]
        
        user_code = st_ace.st_ace(
            value=st.session_state[f"test_code_{current_problem['id']}"],
            language=LANGUAGES[language]["mode"],
            theme="hc-black",
            key=code_key,
            height=400,
            font_size=14,
            auto_update=True
        )
        
        if user_code != st.session_state[f"test_code_{current_problem['id']}"]:
            track_coding_activity(st, user_code, language)
            st.session_state[f"test_code_{current_problem['id']}"] = user_code

        # Test runner and submission
        with st.expander("Test Runner", expanded=True):
            custom_input = st.text_area("Test Input", height=100)
            run_col, hint_col = st.columns([3, 1])
            
            with run_col:
                if st.button("Run Test"):
                    if user_code.strip():
                        output, error = execute_code(user_code, language, custom_input)
                        track_execution_result(st, user_code, language, 
                                             error if error else output,
                                             {"input": custom_input})
                        if error:
                            st.error(f"Error:\n```\n{error}\n```")
                        if output:
                            st.success(f"Output:\n```\n{output}\n```")

            with hint_col:
                if st.button("Get Hint"):
                    hint_data = check_for_hint_triggers(st)
                    if hint_data:
                        st.session_state.test_hints_used[-1] += 1
                        display_hint(hint_data)

        # Submit button
        if st.button("Submit Solution"):
            if not user_code.strip():
                st.error("Please write code before submitting")
            else:
                with st.spinner("Evaluating..."):
                    results, failed = evaluate_submission(user_code, current_problem["test_cases"], language)
                    time_taken = int(time.time() - st.session_state.test_start_time)
                    
                    if len(failed) == 0:
                        score = calculate_score(
                            time_taken,
                            st.session_state.test_hints_used[-1],
                            current_problem["difficulty"]
                        )
                        st.session_state.test_scores.append(score)
                        
                        # Decide next question
                        if st.session_state.current_test_question == 0:
                            medium_problems = get_problems_by_difficulty("Medium")
                            next_difficulty = "Medium" if time_taken < 900 else "Easy"  # 15 minutes
                            next_problems = get_problems_by_difficulty(next_difficulty)
                            next_problem = random.choice(next_problems)
                            st.session_state.test_questions.append(next_problem)
                            st.session_state.test_hints_used.append(0)
                            st.session_state.current_test_question += 1
                            st.success("First question solved! Moving to next question.")
                        else:
                            st.session_state.test_mode = False
                            display_test_results()
                    else:
                        st.error("Some test cases failed. Try again!")
                        for case_id, status, output, expected in results:
                            if status == "❌ Failed":
                                st.write(f"Test Case {case_id}:")
                                st.code(f"Expected:\n{expected}")
                                st.code(f"Received:\n{output}")

def display_test_results():
    """Display final test results"""
    st.title("Test Results")
    total_score = sum(st.session_state.test_scores)
    st.write(f"Total Score: {total_score}/300")
    st.write(f"Questions Solved: {len(st.session_state.test_scores)}/2")
    st.write(f"Hints Used: {sum(st.session_state.test_hints_used)}")
    
    performance = "Excellent" if total_score >= 240 else "Good" if total_score >= 180 else "Needs Improvement"
    st.write(f"Performance: {performance}")
    
    if st.button("Return to Main"):
        st.session_state.test_mode = False
        st.session_state.test_questions = []
        st.session_state.test_scores = []
        st.session_state.test_hints_used = []
        
def main_application():
    """Main application logic with test mode option and regular practice mode."""
    # Initialize test session state
    # initialize_test_session()  # Commented out as the function is not defined
    
    st.title("DeepHire �")
    st.sidebar.write(f"Welcome, {st.session_state['username']}!")
    
    # Sidebar with test mode toggle and progress
    with st.sidebar:
        if st.button("Take Assessment"):
            st.session_state.test_mode = True
        
        # Show user progress
        progress = get_user_progress(st.session_state['username'])
        st.write("### Your Progress")
        st.write(f"Problems Solved: {len(progress['solved_problems'])}")

    # Show hint modal if active hint exists
    show_hint_modal()

    # Switch between test mode and regular mode
    if st.session_state.test_mode:
        st.warning("Test mode is not implemented yet.")
    else:
        # Regular practice mode logic
        initialize_session_state()
        
        # Problem Selection Sidebar
        with st.sidebar:
            st.header("Problem Selection")
            difficulty = st.selectbox("Difficulty Level", ["Easy", "Medium", "Hard"])
            problems = get_problems_by_difficulty(difficulty)
            
            if not problems:
                st.warning("No problems found for selected difficulty")
                return
                
            problem_options = [f"{p['id']}: {p['title']}" for p in problems]
            selected_problem = st.selectbox("Choose Problem", problem_options)
            problem_id = int(selected_problem.split(":")[0])
            problem = get_problem_by_id(problem_id)
            
            if not problem:
                st.error("Selected problem not found")
                return
            
            # Update assistant context when problem changes
            if st.session_state.current_problem != problem_id:
                st.session_state.current_problem = problem_id
                update_assistant_context(st, problem)
                
            # Display hint statistics
            st.subheader("Hint Usage")
            hint_stats = get_hint_stats(st)
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Basic", hint_stats["basic_hints"])
            with col2:
                st.metric("Advanced", hint_stats["advanced_hints"])
                
            if hint_stats["total_hints"] > 0:
                st.progress(hint_stats["basic_hints"] / max(1, hint_stats["total_hints"]))
                st.caption("Advanced hints may impact your score")
        
        setup_coding_assistant(st)
        
        # AI settings in sidebar
        groq_settings_ui()

        # Main Interface Columns
        col1, col2 = st.columns([1, 2], gap="large")

        with col1:
            if problem:
                display_problem(problem)
                
                # Check for hints based on inactivity or patterns
                current_time = time.time()
                if current_time - st.session_state.last_hint_check > 10:  # Every 10 seconds
                    hint_data = check_for_hint_triggers(st)
                    st.session_state.last_hint_check = current_time
                    
                    if hint_data:
                        display_hint(hint_data)  # This will trigger the modal

        with col2:
            st.header("Code Editor")
            language = st.selectbox("Programming Language", list(LANGUAGES.keys()), 
                                 key="lang_select", index=list(LANGUAGES.keys()).index(st.session_state.current_language))
            
            # Timer Control
            timer_col1, timer_col2 = st.columns([2, 1])
            with timer_col1:
                if st.button("⏱️ Start Timer") and not st.session_state.timer_running:
                    st.session_state.start_time = time.time()
                st.session_state.timer_running = True
                if st.button("⏹️ Stop Timer") and st.session_state.timer_running:
                    st.session_state.timer_running = False
                if st.button("🔄 Reset Timer"):
                    st.session_state.start_time = None
                    st.session_state.timer_running = False
                if st.session_state.timer_running:
                    elapsed = int(time.time() - st.session_state.start_time)
                    st.markdown(f"**Time Elapsed:** {elapsed//60:02d}:{elapsed%60:02d}")
                elif st.session_state.start_time:
                    elapsed = int(time.time() - st.session_state.start_time)
                    st.markdown(f"**Time Elapsed:** {elapsed//60:02d}:{elapsed%60:02d} (Paused)")
            
            # Code Editor
            code_key = f"editor_{problem_id}_{language}"
            if st.session_state.current_problem != problem_id or st.session_state.current_language != language:
                default_code = LANGUAGES[language]["template"]
                st.session_state.current_code = default_code
                st.session_state.current_language = language
            
            user_code = st_ace.st_ace(
                value=st.session_state.current_code,
                language=LANGUAGES[language]["mode"],
                theme="hc-black",
                key=code_key,
                height=400,
                font_size=14,
                auto_update=True
            )
            
            # Track coding activity whenever code changes
            if user_code != st.session_state.current_code:
                track_coding_activity(st, user_code, language)
                st.session_state.current_code = user_code
            
            # Custom Test Case Section
            with st.expander("🔧 Custom Test Runner", expanded=True):
                custom_input = st.text_area("Input Data", height=100)
                run_test_col, hint_col = st.columns([3, 1])
                
                with run_test_col:
                    if st.button("▶️ Run Custom Test", use_container_width=True):
                        if not user_code.strip():
                            st.error("Please write code before testing")
                        else:
                            output, error = execute_code(user_code, language, custom_input)
                            
                            # Track execution for the assistant
                            track_execution_result(st, user_code, language, 
                                                  error if error else output,
                                                  {"input": custom_input})
                            
                            if error:
                                st.error(f"**Error:**\n```\n{error}\n```")
                                hint_data = get_hint_on_error(st, error, {"input": custom_input})
                                if hint_data:
                                    display_hint(hint_data)  # Triggers modal
                            if output:
                                st.success(f"**Output:**\n```\n{output}\n```")
                
                with hint_col:
                    if st.button("💡 Get Hint", use_container_width=True):
                        hint_data = check_for_hint_triggers(st)
                        if not hint_data and st.session_state.last_hint_check:
                            if st.session_state.coding_assistant.execution_results:
                                last_result = st.session_state.coding_assistant.execution_results[-1]
                                hint_data = get_hint_on_error(st, last_result.get('result', ''), 
                                                             last_result.get('test_case'))
                            else:
                                hint_data = st.session_state.coding_assistant.generate_hint(trigger_type="inactivity")
                        if hint_data:
                            display_hint(hint_data)  # Triggers modal
                        else:
                            st.info("You're on the right track! Keep coding.")
            
            # Submission Handling
            if st.button("🚀 Submit Solution", use_container_width=True):
                if not user_code.strip():
                    st.error("Please write code before submitting")
                else:
                    with st.spinner("Evaluating submission..."):
                        results, failed = evaluate_submission(user_code, problem["test_cases"], language)
                        passed = len(results) - len(failed)
                        
                        st.subheader(f"Results: {passed}/{len(results)} Passed")
                        for case_id, status, output, expected in results:
                            with st.expander(f"Test Case {case_id}: {status}", expanded=status == "❌ Failed"):
                                st.code(f"Expected:\n{expected}", language="text")
                                st.code(f"Received:\n{output}", language="text")
                        
                        if len(failed) == 0:
                            st.balloons()
                            st.success("🎉 All test cases passed! Excellent work!")
                            hint_stats = get_hint_stats(st)
                            update_user_progress(
                                username=st.session_state.username,
                                problem_id=problem_id,
                                status="solved",
                                hint_stats=hint_stats
                            )
                        else:
                            hint_data = get_hint_on_submission_failure(st, failed)
                            if hint_data:
                                display_hint(hint_data)  # Triggers modal


def main():
    """Main entry point with authentication check."""
    if "authenticated" not in st.session_state:
        st.session_state["authenticated"] = False
    
    if not st.session_state["authenticated"]:
        st.title("DeepHire")
        show_auth_forms()
    else:
        main_application()

if __name__ == "__main__":
    main()