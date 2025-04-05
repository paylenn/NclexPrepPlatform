import os
from datetime import datetime

from flask import Flask, send_from_directory, jsonify, render_template, request, redirect, url_for, flash, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

from models import db, User, ExamHistory, SavedQuestion

# Create the Flask app
app = Flask(__name__, 
            static_url_path='', 
            static_folder='.')
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create tables
with app.app_context():
    db.create_all()

# Auth routes
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        password_confirm = request.form.get('password_confirm')
        
        # Simple validation
        if not username or not email or not password:
            flash('All fields are required.', 'danger')
            return redirect(url_for('register'))
            
        if password != password_confirm:
            flash('Passwords do not match.', 'danger')
            return redirect(url_for('register'))
            
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'danger')
            return redirect(url_for('register'))
            
        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'danger')
            return redirect(url_for('register'))
        
        # Create the user
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
        
    # For now, we'll use the static file until templates are properly created    
    return app.send_static_file('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Invalid username or password', 'danger')
            
    # For now, we'll use the static file until templates are properly created    
    return app.send_static_file('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    # For now, we'll use the static file until templates are properly created
    return app.send_static_file('dashboard.html')

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        # Update user preferences
        font_size = request.form.get('font_size')
        high_contrast = 'high_contrast' in request.form
        
        current_user.font_size = font_size
        current_user.high_contrast = high_contrast
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        
    # For now, we'll use the static file until templates are properly created    
    return app.send_static_file('profile.html')

# API routes for exam data
@app.route('/api/save-exam-result', methods=['POST'])
@login_required
def save_exam_result():
    data = request.json
    
    # Create a new exam history record
    exam_history = ExamHistory(
        user_id=current_user.id,
        exam_type=data.get('examType'),
        date_taken=datetime.now(),
        total_questions=data.get('totalQuestions'),
        correct_answers=data.get('correctAnswers'),
        time_spent=data.get('timeSpent')
    )
    
    # Update user statistics
    current_user.total_questions_attempted += data.get('totalQuestions')
    current_user.correct_answers += data.get('correctAnswers')
    
    db.session.add(exam_history)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Exam result saved successfully"})

@app.route('/api/save-question', methods=['POST'])
@login_required
def save_question():
    data = request.json
    
    # Check if question is already saved
    existing = SavedQuestion.query.filter_by(
        user_id=current_user.id, 
        question_id=data.get('questionId')
    ).first()
    
    if existing:
        return jsonify({"success": False, "message": "Question already saved"})
    
    # Create a new saved question record
    saved_question = SavedQuestion(
        user_id=current_user.id,
        question_id=data.get('questionId'),
        category=data.get('category'),
        date_saved=datetime.now()
    )
    
    db.session.add(saved_question)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Question saved successfully"})

@app.route('/api/user-stats')
@login_required
def get_user_stats():
    # Get user's exam history
    exams = ExamHistory.query.filter_by(user_id=current_user.id).all()
    
    exam_data = [{
        'examType': exam.exam_type,
        'dateTaken': exam.date_taken.strftime('%Y-%m-%d %H:%M'),
        'score': f"{exam.correct_answers}/{exam.total_questions}",
        'percentage': round((exam.correct_answers / exam.total_questions) * 100, 1),
        'timeSpent': exam.time_spent
    } for exam in exams]
    
    # Calculate overall performance
    overall_percentage = 0
    if current_user.total_questions_attempted > 0:
        overall_percentage = round(
            (current_user.correct_answers / current_user.total_questions_attempted) * 100, 1
        )
    
    return jsonify({
        'username': current_user.username,
        'totalQuestionsAttempted': current_user.total_questions_attempted,
        'correctAnswers': current_user.correct_answers,
        'overallPercentage': overall_percentage,
        'examHistory': exam_data,
        'preferences': {
            'fontSize': current_user.font_size,
            'highContrast': current_user.high_contrast
        }
    })

# Static routes
@app.route('/')
def index():
    return app.send_static_file('index.html')

# Static page routes
@app.route('/pages/<path:path>')
def serve_pages(path):
    return app.send_static_file(f'pages/{path}')

@app.route('/js/<path:path>')
def serve_js(path):
    return app.send_static_file(f'js/{path}')

@app.route('/css/<path:path>')
def serve_css(path):
    return app.send_static_file(f'css/{path}')

@app.route('/data/<path:path>')
def serve_data(path):
    return app.send_static_file(f'data/{path}')

@app.route('/images/<path:path>')
def serve_images(path):
    return app.send_static_file(f'images/{path}')

@app.route('/health')
def health_check():
    """Health check endpoint for the application"""
    return jsonify({"status": "healthy", "message": "NCLEX practice application is running"})