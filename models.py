from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    font_size = db.Column(db.String(20), default='medium')
    high_contrast = db.Column(db.Boolean, default=False)
    total_questions_attempted = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    
    # Relationships
    exam_history = db.relationship('ExamHistory', backref='user', lazy='dynamic')
    saved_questions = db.relationship('SavedQuestion', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    def __repr__(self):
        return f'<User {self.username}>'

class ExamHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    exam_type = db.Column(db.String(50))
    date_taken = db.Column(db.DateTime)
    total_questions = db.Column(db.Integer)
    correct_answers = db.Column(db.Integer)
    time_spent = db.Column(db.String(20))  # Format: MM:SS
    
    def __repr__(self):
        return f'<ExamHistory {self.exam_type} {self.date_taken}>'

class SavedQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    question_id = db.Column(db.String(50))  # Identifier from question data
    category = db.Column(db.String(50))
    date_saved = db.Column(db.DateTime)
    
    def __repr__(self):
        return f'<SavedQuestion {self.question_id}>'